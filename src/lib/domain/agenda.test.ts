import { describe, expect, it } from 'vitest';
import { CITIES } from '$lib/data/cities';
import {
  agendaFor,
  agendaPrayerStatuses,
  agendaWindow,
  assignLanes,
  dayAgenda,
  dayTasks,
  groupOverlaps,
  isFaded,
  markConflicts,
  mergeDay,
  PRAYER_BLOCK_MIN,
  prayerOverlap,
  type AgendaSources,
  type AgendaWindow
} from './agenda';
import { addDays, fromMinutes } from './dates';
import { prayerLogId, prayerTimes, type PrayerConfig } from './prayer';
import { defaultSettings } from './settings';
import type {
  AgendaItem,
  AgendaStatus,
  Completion,
  LocalDate,
  PrayerLog,
  PrayerName,
  Routine,
  Task
} from './types';

const span = (id: string, start: number, end: number) => ({ id, start, end });
const lanes = (items: ReturnType<typeof assignLanes<ReturnType<typeof span>>>) =>
  items.map((i) => `${i.id}:${i.lane}/${i.laneCount}`);

describe('assignLanes', () => {
  it('kosong', () => {
    expect(assignLanes([])).toEqual([]);
  });

  it('tanpa bentrok: semua lane 0 dari 1', () => {
    expect(lanes(assignLanes([span('b', 600, 660), span('a', 420, 510)]))).toEqual(['a:0/1', 'b:0/1']);
  });

  it('bersentuhan bukan bentrok', () => {
    expect(lanes(assignLanes([span('a', 420, 510), span('b', 510, 600)]))).toEqual(['a:0/1', 'b:0/1']);
  });

  it('dua item bentrok berdampingan', () => {
    expect(lanes(assignLanes([span('a', 420, 510), span('b', 450, 540)]))).toEqual(['a:0/2', 'b:1/2']);
  });

  it('lane dipakai ulang di dalam klaster yang sama', () => {
    // a dan b bentrok, c mulai setelah a selesai tapi masih beririsan dengan b.
    const result = assignLanes([span('a', 420, 480), span('b', 450, 540), span('c', 480, 520)]);
    expect(lanes(result)).toEqual(['a:0/2', 'b:1/2', 'c:0/2']);
  });

  it('klaster terpisah punya laneCount sendiri', () => {
    const result = assignLanes([
      span('a', 420, 480),
      span('b', 430, 470),
      span('c', 440, 460),
      span('d', 600, 660)
    ]);
    expect(lanes(result)).toEqual(['a:0/3', 'b:1/3', 'c:2/3', 'd:0/1']);
  });

  it('tidak mengubah input', () => {
    const input = [span('a', 420, 510)];
    assignLanes(input);
    expect(input).toEqual([{ id: 'a', start: 420, end: 510 }]);
  });
});

describe('groupOverlaps', () => {
  const groups = (items: ReturnType<typeof span>[]) =>
    groupOverlaps(items).map((g) => `${g.items.map((i) => i.id).join('+')}@${g.start}-${g.end}`);

  it('kosong', () => {
    expect(groupOverlaps([])).toEqual([]);
  });

  it('tanpa bentrok: satu grup per item, urut mulai', () => {
    expect(groups([span('b', 600, 660), span('a', 420, 510)])).toEqual(['a@420-510', 'b@600-660']);
  });

  it('bersentuhan bukan bentrok', () => {
    expect(groups([span('a', 420, 510), span('b', 510, 600)])).toEqual(['a@420-510', 'b@510-600']);
  });

  it('dua item bentrok jadi satu grup selebar rentang gabungan', () => {
    expect(groups([span('b', 630, 675), span('a', 600, 690)])).toEqual(['a+b@600-690']);
  });

  it('bentrok berantai ikut satu grup, grup berikutnya terpisah', () => {
    // a–b beririsan, b–c beririsan, a–c tidak: tetap satu grup. d terpisah.
    const result = groups([
      span('a', 420, 480),
      span('b', 470, 540),
      span('c', 530, 560),
      span('d', 560, 600)
    ]);
    expect(result).toEqual(['a+b+c@420-560', 'd@560-600']);
  });

  it('item di dalam item lain', () => {
    expect(groups([span('a', 420, 600), span('b', 450, 480), span('c', 500, 520)])).toEqual([
      'a+b+c@420-600'
    ]);
  });

  it('tidak mengubah input', () => {
    const input = [span('a', 420, 510), span('b', 450, 480)];
    groupOverlaps(input);
    expect(input).toEqual([
      { id: 'a', start: 420, end: 510 },
      { id: 'b', start: 450, end: 480 }
    ]);
  });
});

describe('dayAgenda', () => {
  const base: Routine = {
    id: 'mtk',
    kind: 'class',
    title: '',
    subjectId: 's1',
    startTime: '07:00',
    durationMin: 90,
    rrule: 'FREQ=WEEKLY;BYDAY=MO,WE',
    dtstart: '2026-10-19',
    until: null,
    exdates: [],
    overrides: {},
    location: 'R. 12',
    createdAt: '2026-10-19T00:00:00.000Z',
    updatedAt: '2026-10-19T00:00:00.000Z',
    deletedAt: null
  };
  const subjects = [{ id: 's1', name: 'Matematika' }];
  const les: Routine = {
    ...base,
    id: 'les',
    kind: 'routine',
    title: 'Les',
    subjectId: null,
    startTime: '16:00',
    rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=MO',
    location: null
  };
  const rapat: Routine = {
    ...base,
    id: 'rapat',
    kind: 'event',
    title: 'Rapat OSIS',
    subjectId: null,
    startTime: '06:30',
    durationMin: 30,
    rrule: null
  };
  const summary = (items: ReturnType<typeof dayAgenda>) =>
    items.map((i) => `${i.startTime} ${i.title}${i.overridden ? ' *' : ''}${i.skipped ? ' (dilewati)' : ''}`);

  it('kelas (judul dari mapel), rutin, dan kegiatan, urut jam mulai', () => {
    const items = dayAgenda('2026-10-19', { routines: [les, base, rapat], subjects });
    expect(summary(items)).toEqual(['06:30 Rapat OSIS', '07:00 Matematika', '16:00 Les']);
    expect(items[1]).toMatchObject({ start: 420, end: 510, date: '2026-10-19', skipped: false });
    expect(items[1].routine.kind).toBe('class');
  });

  it('urut mulai lalu selesai', () => {
    const short = {
      ...les,
      id: 'pendek',
      title: 'Pendek',
      startTime: '07:00',
      durationMin: 30,
      rrule: 'FREQ=DAILY'
    };
    expect(summary(dayAgenda('2026-10-19', { routines: [base, short], subjects }))).toEqual([
      '07:00 Pendek',
      '07:00 Matematika'
    ]);
  });

  it('override dan kejadian yang dilewati', () => {
    const moved = { ...base, overrides: { '2026-10-19': { startTime: '09:00' } } };
    const skipped = { ...les, exdates: ['2026-10-19'] };
    expect(summary(dayAgenda('2026-10-19', { routines: [moved, skipped], subjects }))).toEqual([
      '09:00 Matematika *',
      '16:00 Les (dilewati)'
    ]);
  });

  it('pola tak dikenal, kelas tanpa mapel aktif, dan hari tanpa kejadian tidak masuk', () => {
    const weird = { ...les, id: 'weird', rrule: 'FREQ=DAILY;COUNT=3' };
    const orphan = { ...base, id: 'orphan', subjectId: 'hilang' };
    expect(dayAgenda('2026-10-19', { routines: [weird, orphan], subjects })).toEqual([]);
    expect(dayAgenda('2026-10-26', { routines: [les], subjects })).toEqual([]);
  });
});

describe('dayTasks', () => {
  // Senin 26 Okt 2026.
  const TODAY = '2026-10-26';
  const task = (over: Partial<Task> = {}): Task => ({
    id: 't',
    title: 'Tugas',
    notes: null,
    type: 'pr',
    subjectId: null,
    dueDate: null,
    dueTime: null,
    scheduledDate: null,
    startTime: null,
    durationMin: null,
    priority: 'medium',
    quadrant: null,
    status: 'todo',
    completedAt: null,
    createdAt: '2026-10-20T00:00:00.000Z',
    updatedAt: '2026-10-20T00:00:00.000Z',
    deletedAt: null,
    ...over
  });
  const slot = (date: string, startTime = '16:00', durationMin = 90) => ({
    scheduledDate: date,
    startTime,
    durationMin
  });
  const ids = (tasks: readonly Task[]) => tasks.map((t) => t.id);
  const blocks = (result: ReturnType<typeof dayTasks>) =>
    result.scheduled.map((i) => `${i.task.id}@${i.start}-${i.end}${i.done ? ' (selesai)' : ''}`);

  it('tenggat saja → bagian Tenggat, bukan blok', () => {
    const result = dayTasks(TODAY, [task({ id: 'pr', dueDate: TODAY, dueTime: '13:00' })], TODAY);
    expect(ids(result.due)).toEqual(['pr']);
    expect(result.scheduled).toEqual([]);
  });

  it('jadwal saja → blok', () => {
    const result = dayTasks(TODAY, [task({ id: 'rangkuman', title: 'Rangkuman', ...slot(TODAY) })], TODAY);
    expect(blocks(result)).toEqual(['rangkuman@960-1050']);
    expect(result.scheduled[0]).toMatchObject({
      date: TODAY,
      title: 'Rangkuman',
      startTime: '16:00',
      durationMin: 90,
      done: false
    });
    expect(result.due).toEqual([]);
  });

  it('tenggat + jadwal di hari yang sama → hanya blok', () => {
    const result = dayTasks(TODAY, [task({ id: 'x', dueDate: TODAY, ...slot(TODAY) })], TODAY);
    expect(blocks(result)).toEqual(['x@960-1050']);
    expect(result.due).toEqual([]);
  });

  it('tenggat hari ini + jadwal kemarin → Tenggat hari ini, blok kemarin', () => {
    const tasks = [task({ id: 'x', dueDate: TODAY, ...slot('2026-10-25') })];
    expect(ids(dayTasks(TODAY, tasks, TODAY).due)).toEqual(['x']);
    expect(blocks(dayTasks(TODAY, tasks, TODAY))).toEqual([]);
    expect(blocks(dayTasks('2026-10-25', tasks, TODAY))).toEqual(['x@960-1050']);
  });

  it('tugas selesai tetap tampil dengan done: true', () => {
    const done = { status: 'done' as const, completedAt: '2026-10-26T05:00:00.000Z' };
    const result = dayTasks(
      TODAY,
      [task({ id: 'blok', ...slot(TODAY), ...done }), task({ id: 'tenggat', dueDate: TODAY, ...done })],
      TODAY
    );
    expect(blocks(result)).toEqual(['blok@960-1050 (selesai)']);
    expect(ids(result.due)).toEqual(['tenggat']);
  });

  it('tugas terhapus tidak pernah ada', () => {
    const deletedAt = '2026-10-26T05:00:00.000Z';
    const result = dayTasks(
      TODAY,
      [
        task({ id: 'blok', ...slot(TODAY), deletedAt }),
        task({ id: 'tenggat', dueDate: TODAY, deletedAt }),
        task({ id: 'sebelumnya', ...slot('2026-10-25'), deletedAt })
      ],
      TODAY
    );
    expect(result).toEqual({ scheduled: [], due: [], carriedOver: [] });
  });

  it('slot rusak dilewati', () => {
    const result = dayTasks(
      TODAY,
      [
        task({ id: 'jam', ...slot(TODAY, '25:00') }),
        task({ id: 'durasi', ...slot(TODAY, '16:00', 0) }),
        task({ id: 'tengah-malam', ...slot(TODAY, '23:30', 60) })
      ],
      TODAY
    );
    expect(result.scheduled).toEqual([]);
  });

  it('tenggat kemarin tidak masuk Tenggat hari ini', () => {
    expect(dayTasks(TODAY, [task({ id: 'x', dueDate: '2026-10-25' })], TODAY).due).toEqual([]);
  });

  it('blok urut mulai, selesai, lalu id; Tenggat urut compareTasks', () => {
    const result = dayTasks(
      TODAY,
      [
        task({ id: 'b', ...slot(TODAY, '16:00', 60) }),
        task({ id: 'a', ...slot(TODAY, '16:00', 60) }),
        task({ id: 'c', ...slot(TODAY, '16:00', 30) }),
        task({ id: 'd', ...slot(TODAY, '07:00', 60) }),
        task({ id: 'tanpa-jam', dueDate: TODAY }),
        task({ id: 'pagi', dueDate: TODAY, dueTime: '08:00' })
      ],
      TODAY
    );
    expect(blocks(result)).toEqual(['d@420-480', 'c@960-990', 'a@960-1020', 'b@960-1020']);
    expect(ids(result.due)).toEqual(['pagi', 'tanpa-jam']);
  });

  it('carriedOver hanya terisi saat tanggalnya hari ini', () => {
    const tasks = [
      task({ id: 'sore', ...slot('2026-10-25', '16:00') }),
      task({ id: 'pagi', ...slot('2026-10-25', '08:00'), dueDate: '2026-10-30' }),
      task({ id: 'lewat', ...slot('2026-10-25'), dueDate: '2026-10-25' })
    ];
    expect(ids(dayTasks(TODAY, tasks, TODAY).carriedOver)).toEqual(['pagi', 'sore']);
    expect(dayTasks('2026-10-27', tasks, TODAY).carriedOver).toEqual([]);
    expect(dayTasks('2026-10-25', tasks, TODAY).carriedOver).toEqual([]);
  });
});

describe('mergeDay', () => {
  const les: Routine = {
    id: 'x',
    kind: 'routine',
    title: 'Les',
    subjectId: null,
    startTime: '16:00',
    durationMin: 60,
    rrule: 'FREQ=DAILY',
    dtstart: '2026-10-19',
    until: null,
    exdates: [],
    overrides: {},
    location: null,
    createdAt: '2026-10-19T00:00:00.000Z',
    updatedAt: '2026-10-19T00:00:00.000Z',
    deletedAt: null
  };
  const task = (id: string, startTime: string, durationMin: number): Task => ({
    id,
    title: id,
    notes: null,
    type: 'tugas',
    subjectId: null,
    dueDate: null,
    dueTime: null,
    scheduledDate: '2026-10-26',
    startTime,
    durationMin,
    priority: 'medium',
    quadrant: null,
    status: 'todo',
    completedAt: null,
    createdAt: '2026-10-20T00:00:00.000Z',
    updatedAt: '2026-10-20T00:00:00.000Z',
    deletedAt: null
  });

  it('urut mulai lalu selesai; rutin dulu jika sama; kunci unik walau id sama', () => {
    const date = '2026-10-26';
    const routines = dayAgenda(date, { routines: [les], subjects: [] });
    const tasks = dayTasks(date, [task('x', '16:00', 60), task('pagi', '07:00', 30)], date).scheduled;
    const rows = mergeDay(routines, tasks);
    expect(rows.map((r) => r.key)).toEqual(['task:pagi', 'routine:x:false', 'task:x']);
    expect(rows.map((r) => r.type)).toEqual(['task', 'routine', 'task']);
  });

  it('kejadian dilewati punya kunci sendiri; id memutus urutan sesama jenis', () => {
    const date = '2026-10-26';
    const skipped = { ...les, id: 'w', exdates: [date] };
    const rows = mergeDay(dayAgenda(date, { routines: [les, skipped], subjects: [] }), []);
    expect(rows.map((r) => r.key)).toEqual(['routine:w:true', 'routine:x:false']);
  });
});

// ---------- F2: agenda gabungan ----------

const jakarta = CITIES.find((c) => c.code === '3173')!;
const JKT: PrayerConfig = {
  location: {
    mode: 'city',
    cityId: jakarta.id,
    label: jakarta.name,
    lat: jakarta.lat,
    lng: jakarta.lng,
    timeZone: jakarta.timeZone
  },
  prayer: defaultSettings().prayer
};
// Senin 26 Okt 2026.
const D: LocalDate = '2026-10-26';
const T = prayerTimes(D, JKT);

/** Instan untuk jam dinding WIB. */
const wib = (date: LocalDate, minutes: number) => new Date(`${date}T${fromMinutes(minutes)}:00+07:00`);
const hm = (h: number, m = 0) => h * 60 + m;

const routine = (over: Partial<Routine> = {}): Routine => ({
  id: 'r',
  kind: 'routine',
  title: 'Rutin',
  subjectId: null,
  startTime: '16:00',
  durationMin: 60,
  rrule: 'FREQ=DAILY',
  dtstart: '2026-10-01',
  until: null,
  exdates: [],
  overrides: {},
  location: null,
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  deletedAt: null,
  ...over
});
const kelas = (id: string, startTime: string, durationMin: number, over: Partial<Routine> = {}) =>
  routine({ id, kind: 'class', title: '', subjectId: 's1', startTime, durationMin, ...over });
const agendaTask = (over: Partial<Task> = {}): Task => ({
  id: 't',
  title: 'Tugas',
  notes: null,
  type: 'tugas',
  subjectId: null,
  dueDate: null,
  dueTime: null,
  scheduledDate: D,
  startTime: '13:00',
  durationMin: 60,
  priority: 'medium',
  quadrant: null,
  status: 'todo',
  completedAt: null,
  createdAt: '2026-10-20T00:00:00.000Z',
  updatedAt: '2026-10-20T00:00:00.000Z',
  deletedAt: null,
  ...over
});
const prayerLog = (date: LocalDate, prayer: PrayerName): PrayerLog => ({
  id: prayerLogId(date, prayer),
  date,
  prayer,
  congregation: false,
  at: '2026-10-26T00:00:00.000Z'
});
const completion = (routineId: string, date: LocalDate): Completion => ({
  id: `${routineId}:${date}`,
  routineId,
  date,
  at: '2026-10-26T00:00:00.000Z'
});
const sources = (over: Partial<AgendaSources> = {}): AgendaSources => ({
  routines: [],
  subjects: [{ id: 's1', name: 'Matematika' }],
  tasks: [],
  completions: [],
  prayerLogs: [],
  prayer: JKT,
  deviceTimeZone: 'Asia/Jakarta',
  today: D,
  ...over
});
const noPrayer = (over: Partial<AgendaSources> = {}) => sources({ prayer: null, ...over });
const byKey = <V>(items: readonly AgendaItem[], pick: (i: AgendaItem) => V) =>
  Object.fromEntries(items.map((i) => [i.key, pick(i)]));
const prayerStarts = (items: readonly AgendaItem[]) =>
  items.filter((i) => i.source === 'prayer').map((i) => `${i.sourceId}@${i.start}`);

describe('agendaFor: isi dan urutan', () => {
  it('gabungan kelas, rutin, kegiatan, tugas berjadwal, dan 5 sholat, urut jam; sholat dulu di jam sama', () => {
    const rapat = routine({
      id: 'rapat',
      kind: 'event',
      title: 'Rapat OSIS',
      rrule: null,
      dtstart: D,
      startTime: fromMinutes(T.dzuhur),
      durationMin: PRAYER_BLOCK_MIN
    });
    const items = agendaFor(
      D,
      sources({
        routines: [
          routine({ id: 'les', title: 'Les', location: 'Gedung B' }),
          kelas('mtk', '07:00', 90),
          rapat
        ],
        tasks: [agendaTask({ id: 'rangkuman', title: 'Rangkuman', startTime: '16:00' })]
      }),
      wib(D, hm(3))
    );
    expect(items.map((i) => i.key)).toEqual([
      `prayer:${D}:subuh`,
      `routine:mtk:${D}`,
      `prayer:${D}:dzuhur`,
      `routine:rapat:${D}`,
      `prayer:${D}:ashar`,
      `routine:les:${D}`,
      'task:rangkuman',
      `prayer:${D}:maghrib`,
      `prayer:${D}:isya`
    ]);
    expect(items[1]).toMatchObject({
      source: 'class',
      sourceId: 'mtk',
      date: D,
      start: 420,
      end: 510,
      title: 'Matematika',
      meta: '',
      subjectId: 's1'
    });
    expect(items[2]).toMatchObject({
      source: 'prayer',
      sourceId: `${D}:dzuhur`,
      title: 'dzuhur',
      meta: '',
      subjectId: null,
      start: T.dzuhur,
      end: T.dzuhur + PRAYER_BLOCK_MIN
    });
    expect(items[3]).toMatchObject({ source: 'event', title: 'Rapat OSIS' });
    expect(items[5]).toMatchObject({ source: 'routine', meta: 'Gedung B', subjectId: null });
    expect(items[6]).toMatchObject({ source: 'task', sourceId: 'rangkuman', title: 'Rangkuman', meta: '' });
  });

  it('kejadian dilewati tidak masuk; override memakai jam override', () => {
    const items = agendaFor(
      D,
      noPrayer({
        routines: [
          routine({ id: 'les', exdates: [D] }),
          kelas('mtk', '07:00', 90, { overrides: { [D]: { startTime: '09:00' } } })
        ]
      }),
      wib(D, hm(3))
    );
    expect(items.map((i) => `${i.key}@${i.start}-${i.end}`)).toEqual([`routine:mtk:${D}@540-630`]);
  });

  it('item sholat [awal, awal + 15) dan dipotong di 1440', () => {
    const items = agendaFor(D, sources(), wib(D, hm(3)));
    expect(items.filter((i) => i.source === 'prayer').map((i) => [i.start, i.end])).toEqual(
      [T.subuh, T.dzuhur, T.ashar, T.maghrib, T.isya].map((t) => [t, t + PRAYER_BLOCK_MIN])
    );
    // Isya Jakarta 18.59 WIB = 23.59 di UTC+12.
    const late = agendaFor(D, sources({ deviceTimeZone: 'Etc/GMT-12' }), wib(D, hm(3)));
    const isya = late.find((i) => i.sourceId === `${D}:isya`)!;
    expect(isya.start).toBe(T.isya + 300);
    expect(isya.start).toBeGreaterThan(1440 - PRAYER_BLOCK_MIN);
    expect(isya.end).toBe(1440);
  });

  it('tanpa lokasi: tanpa item sholat', () => {
    const items = agendaFor(D, noPrayer({ routines: [routine()] }), wib(D, hm(3)));
    expect(items.map((i) => i.source)).toEqual(['routine']);
  });

  it('kelas/rutin sebelum tugas di jam yang sama, lalu sourceId', () => {
    const items = agendaFor(
      D,
      noPrayer({
        routines: [routine({ id: 'z' }), routine({ id: 'a' })],
        tasks: [agendaTask({ id: 'b', startTime: '16:00' }), agendaTask({ id: 'a', startTime: '16:00' })]
      }),
      wib(D, hm(3))
    );
    expect(items.map((i) => i.key)).toEqual([`routine:a:${D}`, `routine:z:${D}`, 'task:a', 'task:b']);
  });
});

describe('agendaFor: status', () => {
  it('Completion `${id}:${date}` → done; Completion tanggal lain tidak berpengaruh', () => {
    const items = agendaFor(
      D,
      noPrayer({
        routines: [routine({ id: 'a' }), routine({ id: 'b', startTime: '18:00' })],
        completions: [completion('a', D), completion('b', '2026-10-25')]
      }),
      wib(D, hm(3))
    );
    expect(byKey(items, (i) => i.status)).toEqual({ [`routine:a:${D}`]: 'done', [`routine:b:${D}`]: 'next' });
  });

  it('tugas selesai → done; PrayerLog → sholat done', () => {
    const items = agendaFor(
      D,
      sources({
        tasks: [agendaTask({ id: 'x', status: 'done', completedAt: '2026-10-26T01:00:00.000Z' })],
        prayerLogs: [prayerLog(D, 'subuh'), prayerLog('2026-10-25', 'dzuhur')]
      }),
      wib(D, hm(3))
    );
    const s = byKey(items, (i) => i.status);
    expect(s['task:x']).toBe('done');
    expect(s[`prayer:${D}:subuh`]).toBe('done');
    expect(s[`prayer:${D}:dzuhur`]).toBe('next');
  });

  it('now/past/upcoming di tepi mulai dan selesai', () => {
    const src = noPrayer({ routines: [kelas('mtk', '07:00', 90)] });
    const at = (m: number) => agendaFor(D, src, wib(D, m))[0].status;
    expect(at(hm(6, 59))).toBe('next');
    expect(at(hm(7))).toBe('now');
    expect(at(hm(8, 29))).toBe('now');
    expect(at(hm(8, 30))).toBe('past');
  });

  it('dua item bertumpuk sama-sama now, tanpa next', () => {
    const items = agendaFor(
      D,
      noPrayer({
        routines: [kelas('a', '07:00', 90), routine({ id: 'b', startTime: '08:00' }), routine({ id: 'c' })]
      }),
      wib(D, hm(8, 15))
    );
    expect(items.map((i) => i.status)).toEqual(['now', 'now', 'upcoming']);
  });

  it('tanpa now: item pertama yang belum lewat = next, termasuk sholat', () => {
    const items = agendaFor(
      D,
      sources({ routines: [kelas('mtk', '07:00', 90), kelas('ipa', '13:00', 60)] }),
      wib(D, hm(11, 30))
    );
    const s = byKey(items, (i) => i.status);
    expect(s[`routine:mtk:${D}`]).toBe('past');
    expect(s[`prayer:${D}:dzuhur`]).toBe('next');
    expect(s[`routine:ipa:${D}`]).toBe('upcoming');
    expect(items.filter((i) => i.status === 'next')).toHaveLength(1);
  });

  it('item now yang sudah done tidak menghalangi next', () => {
    const items = agendaFor(
      D,
      noPrayer({
        routines: [kelas('a', '07:00', 90), routine({ id: 'b', startTime: '09:00' })],
        completions: [completion('a', D)]
      }),
      wib(D, hm(8))
    );
    expect(items.map((i) => i.status)).toEqual(['done', 'next']);
  });

  it('tanggal lalu: semua past kecuali done; tanggal depan: upcoming tanpa next', () => {
    const prev = addDays(D, -1);
    const src = sources({ routines: [routine({ id: 'a' })], prayerLogs: [prayerLog(prev, 'subuh')] });
    const past = agendaFor(prev, src, wib(D, hm(3)));
    expect(byKey(past, (i) => i.status)).toEqual({
      [`prayer:${prev}:subuh`]: 'done',
      [`prayer:${prev}:dzuhur`]: 'past',
      [`prayer:${prev}:ashar`]: 'past',
      [`routine:a:${prev}`]: 'past',
      [`prayer:${prev}:maghrib`]: 'past',
      [`prayer:${prev}:isya`]: 'past'
    });
    const future = agendaFor(addDays(D, 1), src, wib(D, hm(23)));
    expect(new Set(future.map((i) => i.status))).toEqual(new Set(['upcoming']));
  });
});

describe('agendaFor: bentrok, bertepatan sholat, lane', () => {
  it('dua kelas beririsan → conflict; bersentuhan → tidak; kelas vs sholat → tidak', () => {
    const items = agendaFor(
      D,
      sources({
        routines: [
          kelas('a', '07:00', 90),
          kelas('b', '08:00', 60),
          kelas('c', '09:00', 30),
          kelas('d', fromMinutes(T.dzuhur - 10), 30)
        ]
      }),
      wib(D, hm(3))
    );
    const conflict = byKey(items, (i) => i.conflict);
    expect(conflict[`routine:a:${D}`]).toBe(true);
    expect(conflict[`routine:b:${D}`]).toBe(true);
    expect(conflict[`routine:c:${D}`]).toBe(false);
    expect(conflict[`routine:d:${D}`]).toBe(false);
    expect(conflict[`prayer:${D}:dzuhur`]).toBe(false);
  });

  it('bertepatan dengan blok 15 menit sholat, bukan rentang fikih', () => {
    const items = agendaFor(
      D,
      sources({ routines: [kelas('siang', '11:30', 60), kelas('sore', '13:00', 60)] }),
      wib(D, hm(3))
    );
    const overlap = byKey(items, (i) => i.overlapsPrayer);
    expect(overlap[`routine:siang:${D}`]).toBe('dzuhur');
    expect(overlap[`routine:sore:${D}`]).toBeNull();
    expect(overlap[`prayer:${D}:dzuhur`]).toBeNull();
  });

  it('beririsan dengan dua blok sholat → yang paling awal; bersentuhan tidak dihitung', () => {
    const prayers = [...agendaFor(D, sources(), wib(D, hm(3)))].reverse();
    expect(prayerOverlap({ start: hm(11), end: hm(16) }, prayers)).toBe('dzuhur');
    expect(prayerOverlap({ start: T.ashar - 10, end: T.ashar }, prayers)).toBeNull();
    expect(prayerOverlap({ start: T.ashar + 14, end: T.ashar + 20 }, prayers)).toBe('ashar');
  });

  it('lane: kelas bertumpuk 0/1 dari 2; sholat 0 dari 1', () => {
    const items = agendaFor(
      D,
      sources({ routines: [kelas('a', '07:00', 90), kelas('b', '08:00', 60)] }),
      wib(D, hm(3))
    );
    const lanes = byKey(items, (i) => `${i.lane}/${i.laneCount}`);
    expect(lanes[`routine:a:${D}`]).toBe('0/2');
    expect(lanes[`routine:b:${D}`]).toBe('1/2');
    expect(lanes[`prayer:${D}:subuh`]).toBe('0/1');
  });

  it('markConflicts mempertahankan urutan masukan', () => {
    const items = agendaFor(D, sources({ routines: [kelas('a', '07:00', 90)] }), wib(D, hm(3)));
    const reversed = [...items].reverse();
    expect(markConflicts(reversed).map((i) => i.key)).toEqual(reversed.map((i) => i.key));
  });
});

describe('agendaFor: zona perangkat ≠ zona lokasi (§7.5)', () => {
  const NEXT = addDays(D, 1);
  const T2 = prayerTimes(NEXT, JKT);

  it('lokasi Jakarta, perangkat New York (EDT, −11 jam): jam New York, sourceId tanggal Jakarta', () => {
    const items = agendaFor(
      D,
      sources({ deviceTimeZone: 'America/New_York' }),
      new Date('2026-10-26T12:00:00-04:00')
    );
    expect(prayerStarts(items)).toEqual([
      `${D}:dzuhur@${T.dzuhur - 660}`,
      `${D}:ashar@${T.ashar - 660}`,
      `${D}:maghrib@${T.maghrib - 660}`,
      `${D}:isya@${T.isya - 660}`,
      `${NEXT}:subuh@${T2.subuh - 660 + 1440}`
    ]);
  });

  it('New York: log Subuh Jakarta D+1 → item agenda tanggal D berstatus done', () => {
    const src = sources({ deviceTimeZone: 'America/New_York', prayerLogs: [prayerLog(NEXT, 'subuh')] });
    const items = agendaFor(D, src, new Date('2026-10-26T18:00:00-04:00'));
    expect(items.find((i) => i.sourceId === `${NEXT}:subuh`)!.status).toBe('done');
  });

  it('New York saat DST berakhir: jumlah sholat per tanggal perangkat ≠ 5', () => {
    const nov1 = agendaFor(
      '2026-11-01',
      sources({ deviceTimeZone: 'America/New_York', today: '2026-11-01' }),
      new Date('2026-11-01T12:00:00-05:00')
    );
    expect(nov1.filter((i) => i.source === 'prayer').map((i) => i.sourceId)).toEqual([
      '2026-11-01:dzuhur',
      '2026-11-01:ashar',
      '2026-11-01:maghrib',
      '2026-11-01:isya',
      '2026-11-02:subuh',
      '2026-11-02:dzuhur'
    ]);
    const nov2 = agendaFor(
      '2026-11-02',
      sources({ deviceTimeZone: 'America/New_York', today: '2026-11-02' }),
      new Date('2026-11-02T12:00:00-05:00')
    );
    expect(nov2.filter((i) => i.source === 'prayer').map((i) => i.sourceId)).toEqual([
      '2026-11-02:ashar',
      '2026-11-02:maghrib',
      '2026-11-02:isya',
      '2026-11-03:subuh',
      '2026-11-03:dzuhur'
    ]);
  });

  it('lokasi Jakarta, perangkat Kiritimati (UTC+14, +7 jam)', () => {
    const PREV = addDays(D, -1);
    const T0 = prayerTimes(PREV, JKT);
    const src = sources({ deviceTimeZone: 'Pacific/Kiritimati', prayerLogs: [prayerLog(PREV, 'isya')] });
    const items = agendaFor(D, src, new Date('2026-10-26T12:00:00+14:00'));
    expect(prayerStarts(items)).toEqual([
      `${PREV}:maghrib@${T0.maghrib + 420 - 1440}`,
      `${PREV}:isya@${T0.isya + 420 - 1440}`,
      `${D}:subuh@${T.subuh + 420}`,
      `${D}:dzuhur@${T.dzuhur + 420}`,
      `${D}:ashar@${T.ashar + 420}`
    ]);
    expect(items.find((i) => i.sourceId === `${PREV}:isya`)!.status).toBe('done');
  });

  it('zona perangkat = zona lokasi (atau offset sama) → identik dengan prayerTimes(D)', () => {
    const expected = (['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'] as const).map(
      (p) => `${D}:${p}@${T[p]}`
    );
    expect(prayerStarts(agendaFor(D, sources(), wib(D, hm(3))))).toEqual(expected);
    expect(prayerStarts(agendaFor(D, sources({ deviceTimeZone: 'Asia/Pontianak' }), wib(D, hm(3))))).toEqual(
      expected
    );
  });
});

describe('agendaWindow', () => {
  const item = (i: number, status: AgendaStatus): AgendaItem => ({
    key: `k${i}`,
    source: 'routine',
    sourceId: `r${i}`,
    date: D,
    start: hm(7 + i),
    end: hm(8 + i),
    title: `Item ${i}`,
    meta: '',
    subjectId: null,
    status,
    conflict: false,
    overlapsPrayer: null,
    lane: 0,
    laneCount: 1
  });
  const list = (statuses: AgendaStatus[]) => statuses.map((s, i) => item(i, s));
  const keys = (w: AgendaWindow) => w.visible.map((i) => i.key);
  const upcoming = (n: number) => Array<AgendaStatus>(n).fill('upcoming');

  it('≤ 6 item → semua, tidak bisa diperluas', () => {
    const items = list(['past', 'now', ...upcoming(4)]);
    expect(agendaWindow(items, hm(8, 30))).toEqual({ visible: items, hiddenCount: 0, expandable: false });
  });

  it('semua belum → 6 pertama', () => {
    const w = agendaWindow(list(['next', ...upcoming(8)]), hm(6));
    expect(keys(w)).toEqual(['k0', 'k1', 'k2', 'k3', 'k4', 'k5']);
    expect(w).toMatchObject({ hiddenCount: 3, expandable: true });
  });

  it('semua lewat → 6 terakhir', () => {
    const w = agendaWindow(list(Array<AgendaStatus>(9).fill('past')), hm(23));
    expect(keys(w)).toEqual(['k3', 'k4', 'k5', 'k6', 'k7', 'k8']);
  });

  it('now di tengah → 2 sebelum + jangkar + 3 sesudah', () => {
    const w = agendaWindow(list(['past', 'past', 'past', 'past', 'now', ...upcoming(4)]), hm(11, 30));
    expect(keys(w)).toEqual(['k2', 'k3', 'k4', 'k5', 'k6', 'k7']);
  });

  it('jangkar dekat akhir → digeser mundur, tetap 6', () => {
    const w = agendaWindow(list([...Array<AgendaStatus>(8).fill('past'), 'now']), hm(15, 30));
    expect(keys(w)).toEqual(['k3', 'k4', 'k5', 'k6', 'k7', 'k8']);
  });

  it('item done yang masih berlangsung menjadi jangkar; next sesudahnya tetap terlihat', () => {
    // k3 = 10.00–11.00 done, sekarang 10.30, k4 = next.
    const w = agendaWindow(list(['past', 'past', 'past', 'done', 'next', ...upcoming(4)]), hm(10, 30));
    expect(keys(w)).toEqual(['k1', 'k2', 'k3', 'k4', 'k5', 'k6']);
  });

  it('kasus tepi yang diterima: next di jangkar+4 tidak terlihat', () => {
    // k3 berlangsung dan done, k4–k6 sudah done lebih awal, k7 = next.
    const statuses: AgendaStatus[] = [
      'past',
      'past',
      'past',
      'done',
      'done',
      'done',
      'done',
      'next',
      'upcoming'
    ];
    const w = agendaWindow(list(statuses), hm(10, 30));
    expect(keys(w)).toEqual(['k1', 'k2', 'k3', 'k4', 'k5', 'k6']);
    expect(w.expandable).toBe(true);
  });
});

describe('isFaded dan agendaPrayerStatuses', () => {
  const faded = (date: LocalDate, now: Date, logs: PrayerLog[] = []) => {
    const items = agendaFor(date, sources({ prayerLogs: logs }), now);
    const statuses = agendaPrayerStatuses(items, logs, now, JKT);
    return Object.fromEntries(items.map((i) => [i.sourceId, isFaded(i, statuses)]));
  };

  it('sholat mengikuti fikih, bukan blok 15 menit', () => {
    expect(T.dzuhur + PRAYER_BLOCK_MIN).toBeLessThanOrEqual(hm(12));
    expect(faded(D, wib(D, hm(12)))[`${D}:dzuhur`]).toBe(false);
    expect(faded(D, wib(D, hm(12)), [prayerLog(D, 'dzuhur')])[`${D}:dzuhur`]).toBe(true);
    expect(faded(D, wib(D, T.ashar))[`${D}:dzuhur`]).toBe(true);
    expect(faded(D, wib(D, hm(6)))[`${D}:subuh`]).toBe(true);
  });

  it('Isya kemarin pada 01.00 belum dicatat → tidak pudar', () => {
    const prev = addDays(D, -1);
    expect(faded(prev, wib(D, hm(1)))[`${prev}:isya`]).toBe(false);
    expect(faded(prev, wib(D, hm(1)))[`${prev}:maghrib`]).toBe(true);
  });

  it('non-sholat: past → pudar; done belum lewat, now, upcoming → tidak', () => {
    const at = (m: number, done = false) => {
      const src = noPrayer({
        routines: [kelas('mtk', '07:00', 90)],
        completions: done ? [completion('mtk', D)] : []
      });
      return isFaded(agendaFor(D, src, wib(D, m))[0], new Map());
    };
    expect(at(hm(9))).toBe(true);
    expect(at(hm(8), true)).toBe(false);
    expect(at(hm(8))).toBe(false);
    expect(at(hm(6))).toBe(false);
  });

  it('perangkat New York: status diambil dari tanggal lokasi tiap item', () => {
    const next = addDays(D, 1);
    const now = new Date('2026-10-26T18:00:00-04:00'); // = 27 Okt 05.00 WIB
    const logs = [prayerLog(D, 'maghrib')];
    const items = agendaFor(D, sources({ deviceTimeZone: 'America/New_York', prayerLogs: logs }), now);
    expect(Object.fromEntries(agendaPrayerStatuses(items, logs, now, JKT))).toEqual({
      [`${D}:dzuhur`]: 'missed',
      [`${D}:ashar`]: 'missed',
      [`${D}:maghrib`]: 'done',
      [`${D}:isya`]: 'missed',
      [`${next}:subuh`]: 'now'
    });
  });
});
