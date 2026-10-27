/**
 * Logika agenda (PRD §6). Grid timetable F4 memakai `groupOverlaps`; tampilan Hari F5 memakai
 * `dayAgenda`, dan F6 menambah `dayTasks` (blok jadwal pengerjaan + bagian "Tenggat") yang digabung
 * dengan rutin lewat `mergeDay`; `assignLanes` disiapkan untuk tampilan bertumpuk. F2 menambah agenda
 * gabungan Hari Ini (`agendaFor`): `dayAgenda` + `dayTasks` + 5 sholat sebagai blok 15 menit di zona
 * perangkat, dengan status, bentrok (`markConflicts`), dan jendela 6 item (`agendaWindow`).
 */
import { addDays, fromZoned, MINUTES_PER_DAY, toMinutes, toZoned } from './dates';
import { parsePrayerLogId, prayerLogId, prayerStatus, prayerTimes, type PrayerConfig } from './prayer';
import { isSupportedRoutine, occurrencesBetween, skippedBetween, validateTimeSlot } from './recurrence';
import { compareCarriedOver, compareTasks, isCarriedOver } from './tasks';
import {
  PRAYERS,
  type AgendaItem,
  type AgendaStatus,
  type Completion,
  type Id,
  type LocalDate,
  type LocalTime,
  type Minutes,
  type PrayerLog,
  type PrayerName,
  type PrayerStatus,
  type Routine,
  type Subject,
  type Task
} from './types';

export interface Span {
  start: Minutes;
  /** Eksklusif. */
  end: Minutes;
}

export type WithLane<T> = T & { lane: number; laneCount: number };

export interface OverlapGroup<T extends Span> extends Span {
  /** Urut mulai, lalu selesai. Lebih dari satu item = bentrok. */
  items: T[];
}

/**
 * Mengelompokkan item yang saling bertumpuk (langsung atau berantai) menjadi satu grup selebar
 * rentang gabungannya. Item yang hanya bersentuhan (08.30 selesai, 08.30 mulai) tidak bentrok.
 * Dipakai grid Minggu: di kolom ±45 px, sesi bentrok tampil sebagai satu blok "N sesi" (PRD §F4).
 */
export function groupOverlaps<T extends Span>(items: readonly T[]): OverlapGroup<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const groups: OverlapGroup<T>[] = [];
  for (const item of sorted) {
    const last = groups.at(-1);
    if (last && item.start < last.end) {
      last.items.push(item);
      last.end = Math.max(last.end, item.end);
    } else {
      groups.push({ start: item.start, end: item.end, items: [item] });
    }
  }
  return groups;
}

/**
 * Membagi item yang bertumpuk ke kolom ("lane") agar tampil berdampingan.
 * Bentrok = irisan [mulai, selesai). Item yang hanya bersentuhan (08.30 selesai, 08.30 mulai) tidak bentrok.
 * Satu klaster = rangkaian item yang saling terhubung lewat irisan; semua item di klaster
 * mendapat `laneCount` yang sama. Urutan keluaran = urutan mulai, lalu selesai.
 */
export function assignLanes<T extends Span>(items: readonly T[]): WithLane<T>[] {
  const sorted = [...items].sort((a, b) => a.start - b.start || a.end - b.end);
  const result: WithLane<T>[] = [];

  let cluster: WithLane<T>[] = [];
  let laneEnds: Minutes[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    for (const item of cluster) item.laneCount = laneEnds.length;
    result.push(...cluster);
    cluster = [];
    laneEnds = [];
  };

  for (const item of sorted) {
    if (item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(item.end);
    } else {
      laneEnds[lane] = item.end;
    }
    cluster.push({ ...item, lane, laneCount: 0 });
    clusterEnd = Math.max(clusterEnd, item.end);
  }
  flush();
  return result;
}

export interface DayItem extends Span {
  routine: Routine;
  date: LocalDate;
  /** Nama mapel untuk kelas, judul rutin untuk yang lain. */
  title: string;
  startTime: LocalTime;
  durationMin: number;
  /** true jika jam/durasi berasal dari override tanggal ini. */
  overridden: boolean;
  /** true untuk kejadian yang dilewati (exdates); jamnya jam induk. */
  skipped: boolean;
}

/**
 * Kejadian kelas, rutin, dan kegiatan di satu tanggal, urut mulai lalu selesai, termasuk baris
 * yang dilewati. Rutin dengan pola tak dikenal dan kelas tanpa mapel aktif tidak pernah masuk.
 * `routines` sudah disaring dari yang dihapus oleh pemanggil.
 */
export function dayAgenda(
  date: LocalDate,
  sources: { routines: readonly Routine[]; subjects: readonly Pick<Subject, 'id' | 'name'>[] }
): DayItem[] {
  const subjectNames = new Map(sources.subjects.map((s) => [s.id, s.name]));
  const items: DayItem[] = [];
  for (const routine of sources.routines) {
    if (!isSupportedRoutine(routine)) continue;
    let title = routine.title;
    if (routine.kind === 'class') {
      const name = routine.subjectId === null ? undefined : subjectNames.get(routine.subjectId);
      if (name === undefined) continue;
      title = name;
    }
    for (const o of occurrencesBetween(routine, date, date)) {
      items.push({ routine, title, ...o, skipped: false });
    }
    for (const skippedDate of skippedBetween(routine, date, date)) {
      const start = toMinutes(routine.startTime);
      items.push({
        routine,
        date: skippedDate,
        title,
        startTime: routine.startTime,
        durationMin: routine.durationMin,
        start,
        end: start + routine.durationMin,
        overridden: false,
        skipped: true
      });
    }
  }
  return items.sort((a, b) => a.start - b.start || a.end - b.end);
}

export interface TaskDayItem extends Span {
  task: Task;
  date: LocalDate;
  title: string;
  startTime: LocalTime;
  durationMin: number;
  /** Tugas selesai tetap tampil (dicoret). */
  done: boolean;
}

export interface DayTasks {
  /** Blok jadwal pengerjaan di tanggal itu, urut mulai, selesai, lalu id. */
  scheduled: TaskDayItem[];
  /** Bagian "Tenggat": urut compareTasks. */
  due: Task[];
  /** "Belum selesai sebelumnya" = tugas isCarriedOver(t, today) jika date === today; selain itu []. Urutan: scheduledDate, startTime, compareTasks. */
  carriedOver: Task[];
}

const compareIds = (a: Id, b: Id) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Tugas di satu tanggal (PRD §F6.2). Tenggat ≠ jadwal pengerjaan: hanya jadwal pengerjaan yang menjadi
 * blok jam. Bagian "Tenggat" memuat semua tugas bertenggat tanggal itu, kecuali yang sudah tampil
 * sebagai blok di tanggal yang sama; lewat tenggat dari hari sebelumnya tidak masuk. Slot rusak (data
 * impor) dilewati diam-diam. Tugas terhapus tidak pernah masuk.
 */
export function dayTasks(date: LocalDate, tasks: readonly Task[], today: LocalDate): DayTasks {
  const live = tasks.filter((t) => t.deletedAt === null);
  const scheduled: TaskDayItem[] = [];
  for (const task of live) {
    const { startTime, durationMin } = task;
    if (task.scheduledDate !== date || startTime === null || durationMin === null) continue;
    if (validateTimeSlot(startTime, durationMin) !== null) continue;
    const start = toMinutes(startTime);
    scheduled.push({
      task,
      date,
      title: task.title,
      startTime,
      durationMin,
      start,
      end: start + durationMin,
      done: task.status === 'done'
    });
  }
  scheduled.sort((a, b) => a.start - b.start || a.end - b.end || compareIds(a.task.id, b.task.id));

  const blocks = new Set(scheduled.map((i) => i.task.id));
  const due = live.filter((t) => t.dueDate === date && !blocks.has(t.id)).sort(compareTasks);
  const carriedOver =
    date === today ? live.filter((t) => isCarriedOver(t, today)).sort(compareCarriedOver) : [];
  return { scheduled, due, carriedOver };
}

/** Gabungan untuk tampilan Hari: rutin dulu jika mulai+selesai sama, lalu id. Bukan `DayEntry` di types.ts (entitas prioritas harian). */
export type DayRow =
  { type: 'routine'; key: string; item: DayItem } | { type: 'task'; key: string; item: TaskDayItem };

const rowId = (row: DayRow) => (row.type === 'routine' ? row.item.routine.id : row.item.task.id);

/** Kunci `routine:${id}:${skipped}` dan `task:${id}` agar ID rutin dan tugas tidak bertabrakan di keyed each. */
export function mergeDay(routines: readonly DayItem[], tasks: readonly TaskDayItem[]): DayRow[] {
  const rows: DayRow[] = [
    ...routines.map((item): DayRow => ({
      type: 'routine',
      key: `routine:${item.routine.id}:${item.skipped}`,
      item
    })),
    ...tasks.map((item): DayRow => ({ type: 'task', key: `task:${item.task.id}`, item }))
  ];
  const typeRank = (row: DayRow) => (row.type === 'routine' ? 0 : 1);
  return rows.sort(
    (a, b) =>
      a.item.start - b.item.start ||
      a.item.end - b.item.end ||
      typeRank(a) - typeRank(b) ||
      compareIds(rowId(a), rowId(b))
  );
}

// ---------- Agenda gabungan Hari Ini (F2) ----------

/** Rentang item sholat di agenda: [awal waktu, awal waktu + 15 menit), bukan rentang fikih. */
export const PRAYER_BLOCK_MIN = 15;

export interface AgendaSources {
  /** Sudah tanpa deletedAt. */
  routines: readonly Routine[];
  subjects: readonly Pick<Subject, 'id' | 'name'>[];
  tasks: readonly Task[];
  completions: readonly Completion[];
  prayerLogs: readonly PrayerLog[];
  /** null = lokasi belum dipilih → tanpa item sholat. */
  prayer: PrayerConfig | null;
  /** Zona perangkat (IANA), dari store now. */
  deviceTimeZone: string;
  /** Dari store today. */
  today: LocalDate;
}

interface Draft {
  item: Omit<AgendaItem, 'status' | 'conflict' | 'overlapsPrayer' | 'lane' | 'laneCount'>;
  done: boolean;
}

/**
 * Awal waktu sholat yang jatuh pada tanggal perangkat `date`. Jadwal tanggal lokasi D−1, D, dan D+1
 * diubah ke instan lalu ke zona perangkat, sehingga jumlahnya bisa ≠ 5 jika zonanya berbeda.
 */
function prayersOnDeviceDate(date: LocalDate, config: PrayerConfig, deviceTimeZone: string) {
  const tz = config.location.timeZone;
  const result: { locDate: LocalDate; prayer: PrayerName; start: Minutes }[] = [];
  for (const locDate of [addDays(date, -1), date, addDays(date, 1)]) {
    const t = prayerTimes(locDate, config);
    for (const prayer of PRAYERS) {
      const z = toZoned(fromZoned(locDate, t[prayer], tz), deviceTimeZone);
      if (z.date === date) result.push({ locDate, prayer, start: z.minutes });
    }
  }
  return result;
}

const sourceRank = (item: Pick<AgendaItem, 'source'>) =>
  item.source === 'prayer' ? 0 : item.source === 'task' ? 2 : 1;

const overlaps = (a: Span, b: Span) => a.start < b.end && b.start < a.end;

/**
 * Agenda satu tanggal (PRD §F2, §7.4, §7.5): kelas/rutin/kegiatan (tanpa kejadian yang dilewati), blok
 * jadwal tugas, dan sholat sebagai blok `PRAYER_BLOCK_MIN` menit di zona perangkat. `sourceId` sholat =
 * ID PrayerLog bertanggal lokasi. Urut mulai, selesai, sholat, kelas/rutin/kegiatan, tugas, lalu sourceId.
 * Status: done mengalahkan waktu; hari lalu = past, hari depan = upcoming; hari ini dihitung dari jam
 * perangkat, boleh lebih dari satu `now`, dan `next` = upcoming pertama hanya jika tidak ada `now`.
 */
export function agendaFor(date: LocalDate, sources: AgendaSources, now: Date): AgendaItem[] {
  const drafts: Draft[] = [];

  const completed = new Set(sources.completions.map((c) => `${c.routineId}:${c.date}`));
  for (const item of dayAgenda(date, sources)) {
    if (item.skipped) continue;
    const { routine } = item;
    drafts.push({
      item: {
        key: `routine:${routine.id}:${date}`,
        source: routine.kind,
        sourceId: routine.id,
        date,
        start: item.start,
        end: item.end,
        title: item.title,
        meta: routine.location ?? '',
        subjectId: routine.subjectId
      },
      done: completed.has(`${routine.id}:${date}`)
    });
  }

  for (const item of dayTasks(date, sources.tasks, sources.today).scheduled) {
    drafts.push({
      item: {
        key: `task:${item.task.id}`,
        source: 'task',
        sourceId: item.task.id,
        date,
        start: item.start,
        end: item.end,
        title: item.title,
        meta: '',
        subjectId: item.task.subjectId
      },
      done: item.done
    });
  }

  if (sources.prayer) {
    const logged = new Set(sources.prayerLogs.map((l) => prayerLogId(l.date, l.prayer)));
    for (const p of prayersOnDeviceDate(date, sources.prayer, sources.deviceTimeZone)) {
      const id = prayerLogId(p.locDate, p.prayer);
      drafts.push({
        item: {
          key: `prayer:${id}`,
          source: 'prayer',
          sourceId: id,
          date,
          start: p.start,
          end: Math.min(p.start + PRAYER_BLOCK_MIN, MINUTES_PER_DAY),
          title: p.prayer,
          meta: '',
          subjectId: null
        },
        done: logged.has(id)
      });
    }
  }

  drafts.sort(
    ({ item: a }, { item: b }) =>
      a.start - b.start ||
      a.end - b.end ||
      sourceRank(a) - sourceRank(b) ||
      compareIds(a.sourceId, b.sourceId)
  );

  const nowMin = toZoned(now, sources.deviceTimeZone).minutes;
  const statusOf = ({ item, done }: Draft): AgendaStatus => {
    if (done) return 'done';
    if (date < sources.today) return 'past';
    if (date > sources.today) return 'upcoming';
    if (item.start <= nowMin && nowMin < item.end) return 'now';
    return item.end <= nowMin ? 'past' : 'upcoming';
  };
  const statuses = drafts.map(statusOf);
  if (date === sources.today && !statuses.includes('now')) {
    const first = statuses.indexOf('upcoming');
    if (first !== -1) statuses[first] = 'next';
  }

  return markConflicts(
    drafts.map(({ item }, i): AgendaItem => ({
      ...item,
      status: statuses[i],
      conflict: false,
      overlapsPrayer: null,
      lane: 0,
      laneCount: 1
    }))
  );
}

/**
 * Sholat paling awal yang blok 15 menitnya beririsan dengan `item` (§7.4), atau null. Bersentuhan tidak
 * dihitung. Rentang fikih tidak dipakai: Dzuhur–Ashar akan menandai hampir semua kelas siang.
 */
export function prayerOverlap(item: Span, prayers: readonly AgendaItem[]): PrayerName | null {
  let hit: AgendaItem | null = null;
  for (const p of prayers) {
    if (p.source !== 'prayer' || !overlaps(item, p)) continue;
    if (hit === null || p.start < hit.start) hit = p;
  }
  return hit === null ? null : (parsePrayerLogId(hit.sourceId)?.prayer ?? null);
}

/**
 * Mengisi `conflict` (irisan dengan item non-sholat lain; bersentuhan bukan bentrok, item done tetap
 * dihitung), `overlapsPrayer`, dan lane untuk item non-sholat. Sholat selalu tanpa bentrok, lane 0 dari 1.
 * Urutan masukan dipertahankan.
 */
export function markConflicts<T extends AgendaItem>(items: readonly T[]): T[] {
  const prayers = items.filter((i) => i.source === 'prayer');
  const others = items.filter((i) => i.source !== 'prayer');
  const lanes = new Map(assignLanes(others).map((i) => [i.key, i]));
  return items.map((item) => {
    if (item.source === 'prayer') {
      return { ...item, conflict: false, overlapsPrayer: null, lane: 0, laneCount: 1 };
    }
    const lane = lanes.get(item.key);
    return {
      ...item,
      conflict: others.some((o) => o !== item && overlaps(o, item)),
      overlapsPrayer: prayerOverlap(item, prayers),
      lane: lane?.lane ?? 0,
      laneCount: lane?.laneCount ?? 1
    };
  });
}

export interface AgendaWindow {
  visible: AgendaItem[];
  hiddenCount: number;
  /** false jika semua item sudah tampil (tombol "Lihat semua" tidak dirender). */
  expandable: boolean;
}

/**
 * Jendela `size` item di sekitar jam sekarang untuk agenda hari ini. Jangkar: item `now` pertama; jika
 * tidak ada, item pertama dengan `end > nowMin` (item done yang masih berlangsung ikut dihitung); jika
 * semua sudah lewat, `size` item terakhir. Jendela mulai maksimal 2 item sebelum jangkar dan digeser
 * mundur di akhir daftar.
 */
export function agendaWindow(items: readonly AgendaItem[], nowMin: Minutes, size = 6): AgendaWindow {
  if (items.length <= size) return { visible: [...items], hiddenCount: 0, expandable: false };
  let anchor = items.findIndex((i) => i.status === 'now');
  if (anchor === -1) anchor = items.findIndex((i) => i.end > nowMin);
  const last = items.length - size;
  const start = anchor === -1 ? last : Math.min(Math.max(0, anchor - 2), last);
  return { visible: items.slice(start, start + size), hiddenCount: last, expandable: true };
}

/** Status fikih per ID PrayerLog untuk item sholat di agenda (tanggal lokasinya bisa D−1, D, atau D+1). */
export function agendaPrayerStatuses(
  items: readonly AgendaItem[],
  logs: readonly PrayerLog[],
  now: Date,
  config: PrayerConfig
): ReadonlyMap<string, PrayerStatus> {
  const byDate = new Map<LocalDate, Record<PrayerName, PrayerStatus>>();
  const result = new Map<string, PrayerStatus>();
  for (const item of items) {
    if (item.source !== 'prayer') continue;
    const id = parsePrayerLogId(item.sourceId);
    if (id === null) continue;
    let statuses = byDate.get(id.date);
    if (!statuses) {
      statuses = prayerStatus(id.date, logs, now, config);
      byDate.set(id.date, statuses);
    }
    result.set(item.sourceId, statuses[id.prayer]);
  }
  return result;
}

/**
 * Gaya pudar (PRD §F2, tanpa opacity pada teks). Non-sholat: pudar jika sudah lewat. Sholat mengikuti
 * fikih: pudar hanya jika sudah dicatat atau rentangnya habis, walau blok 15 menitnya sudah lewat.
 */
export function isFaded(item: AgendaItem, prayerStatuses: ReadonlyMap<string, PrayerStatus>): boolean {
  if (item.source !== 'prayer') return item.status === 'past';
  const status = prayerStatuses.get(item.sourceId);
  return status === 'done' || status === 'missed';
}
