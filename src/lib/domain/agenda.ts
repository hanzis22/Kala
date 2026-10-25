/**
 * Logika agenda (PRD §6). Grid timetable F4 memakai `groupOverlaps`; tampilan Hari F5 memakai
 * `dayAgenda`; `assignLanes` disiapkan untuk tampilan bertumpuk. `agendaFor` dan `markConflicts`
 * menyusul di F2 dan memanggil `dayAgenda` untuk memilih kejadian kelas/rutin/kegiatan.
 */
import { toMinutes } from './dates';
import { isSupportedRoutine, occurrencesBetween, skippedBetween } from './recurrence';
import type { LocalDate, LocalTime, Minutes, Routine, Subject } from './types';

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
