import { describe, expect, it } from 'vitest';
import { assignLanes, dayAgenda, groupOverlaps } from './agenda';
import type { Routine } from './types';

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
