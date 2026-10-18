import { describe, expect, it } from 'vitest';
import type { RecurrenceInput } from './recurrence';
import {
  buildWeekTimetable,
  hourRange,
  validateClassSession,
  visibleWeekDates,
  weekDates,
  weekStart
} from './timetable';

function routine(id: string, patch: Partial<RecurrenceInput> = {}): RecurrenceInput {
  return {
    id,
    rrule: 'FREQ=WEEKLY;BYDAY=MO,WE',
    dtstart: '2026-10-19',
    until: null,
    exdates: [],
    overrides: {},
    startTime: '07:00',
    durationMin: 90,
    ...patch
  };
}

describe('weekStart / weekDates', () => {
  it('minggu mulai Senin', () => {
    expect(weekStart('2026-10-21', 1)).toBe('2026-10-19');
    expect(weekStart('2026-10-19', 1)).toBe('2026-10-19');
    expect(weekStart('2026-10-25', 1)).toBe('2026-10-19');
    expect(weekDates('2026-10-21', 1)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25'
    ]);
  });

  it('minggu mulai Minggu', () => {
    expect(weekStart('2026-10-21', 0)).toBe('2026-10-18');
    expect(weekStart('2026-10-25', 0)).toBe('2026-10-25');
    expect(weekDates('2026-10-24', 0)[0]).toBe('2026-10-18');
  });

  it('melintasi bulan dan tahun', () => {
    expect(weekStart('2027-01-01', 1)).toBe('2026-12-28');
  });
});

describe('visibleWeekDates', () => {
  it('Senin–Sabtu tanpa Minggu', () => {
    expect(visibleWeekDates('2026-10-21', 1, false)).toHaveLength(6);
    expect(visibleWeekDates('2026-10-21', 1, false).at(-1)).toBe('2026-10-24');
  });

  it('dengan Minggu: di akhir (mulai Senin) atau di awal (mulai Minggu)', () => {
    expect(visibleWeekDates('2026-10-21', 1, true).at(-1)).toBe('2026-10-25');
    expect(visibleWeekDates('2026-10-21', 0, true)[0]).toBe('2026-10-18');
    expect(visibleWeekDates('2026-10-21', 0, false)[0]).toBe('2026-10-19');
  });
});

describe('hourRange', () => {
  it('bawaan 06–18', () => {
    expect(hourRange([])).toEqual({ startHour: 6, endHour: 18 });
    expect(hourRange([{ start: 420, end: 510 }])).toEqual({ startHour: 6, endHour: 18 });
  });

  it('melebar ke jam penuh terdekat', () => {
    expect(hourRange([{ start: 330, end: 400 }])).toEqual({ startHour: 5, endHour: 18 });
    expect(hourRange([{ start: 1140, end: 1230 }])).toEqual({ startHour: 6, endHour: 21 });
    expect(hourRange([{ start: 1380, end: 1440 }])).toEqual({ startHour: 6, endHour: 24 });
  });
});

describe('buildWeekTimetable', () => {
  const options = { weekStartsOn: 1 as const, showSunday: false };

  it('menaruh kejadian di hari yang benar', () => {
    const grid = buildWeekTimetable([routine('mtk')], '2026-10-22', options);
    expect(grid.days.map((d) => d.weekday)).toEqual(['MO', 'TU', 'WE', 'TH', 'FR', 'SA']);
    expect(grid.days.map((d) => d.slots.length)).toEqual([1, 0, 1, 0, 0, 0]);
    expect(grid.days[0].slots[0]).toMatchObject({ start: 420, end: 510 });
    expect(grid.days[0].slots[0].items).toEqual([
      expect.objectContaining({ routineId: 'mtk', date: '2026-10-19', start: 420, end: 510 })
    ]);
  });

  it('sesi bentrok di hari yang sama digabung jadi satu slot selebar rentangnya', () => {
    const grid = buildWeekTimetable(
      [
        routine('ipa', { rrule: 'FREQ=WEEKLY;BYDAY=MO', startTime: '08:00' }),
        routine('mtk'),
        routine('bin', { rrule: 'FREQ=WEEKLY;BYDAY=MO', startTime: '10:00', durationMin: 60 })
      ],
      '2026-10-19',
      options
    );
    expect(grid.days[0].slots.map((s) => [s.start, s.end, s.items.map((o) => o.routineId)])).toEqual([
      [420, 570, ['mtk', 'ipa']],
      [600, 660, ['bin']]
    ]);
  });

  it('sesi Minggu tersembunyi tidak memperlebar rentang jam', () => {
    const sunday = routine('les', { rrule: 'FREQ=WEEKLY;BYDAY=SU', startTime: '19:00' });
    expect(buildWeekTimetable([sunday], '2026-10-19', options)).toMatchObject({ endHour: 18 });
    const shown = buildWeekTimetable([sunday], '2026-10-19', { ...options, showSunday: true });
    expect(shown.endHour).toBe(21);
    expect(shown.days.at(-1)?.slots).toHaveLength(1);
  });

  it('menghormati exdate dan dtstart', () => {
    const grid = buildWeekTimetable(
      [routine('mtk', { exdates: ['2026-10-19'] }), routine('ipa', { dtstart: '2026-10-26' })],
      '2026-10-19',
      options
    );
    expect(grid.days.map((d) => d.slots.flatMap((s) => s.items.map((o) => o.routineId)))).toEqual([
      [],
      [],
      ['mtk'],
      [],
      [],
      []
    ]);
  });
});

describe('validateClassSession', () => {
  const valid = {
    subjectId: 's1',
    days: ['MO' as const],
    startTime: '07:00',
    durationMin: 90,
    location: null
  };

  it('valid', () => {
    expect(validateClassSession(valid)).toBeNull();
  });

  it('mapel dan hari wajib', () => {
    expect(validateClassSession({ ...valid, subjectId: null })).toBe('subject-required');
    expect(validateClassSession({ ...valid, days: [] })).toBe('days-required');
  });

  it('slot jam divalidasi (tidak melewati 24.00)', () => {
    expect(validateClassSession({ ...valid, startTime: '23:00', durationMin: 90 })).toBe('past-midnight');
    expect(validateClassSession({ ...valid, durationMin: 0 })).toBe('duration-range');
  });

  it('ruang maksimal 40 karakter', () => {
    expect(validateClassSession({ ...valid, location: 'x'.repeat(41) })).toBe('location-too-long');
  });
});
