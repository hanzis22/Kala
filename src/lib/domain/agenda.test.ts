import { describe, expect, it } from 'vitest';
import { assignLanes, dayAgenda, dayTasks, groupOverlaps, mergeDay } from './agenda';
import type { Routine, Task } from './types';

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
