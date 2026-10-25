import { describe, expect, it } from 'vitest';
import { defaultMonthlyOptions, validateRoutineInput, type RoutineInput } from './routines';

function input(patch: Partial<RoutineInput> = {}): RoutineInput {
  return {
    title: 'Les',
    spec: { freq: 'weekly', interval: 2, days: ['TU'] },
    startTime: '16:00',
    durationMin: 90,
    dtstart: '2026-10-19',
    until: null,
    location: null,
    ...patch
  };
}

describe('validateRoutineInput', () => {
  it('input valid → null', () => {
    expect(validateRoutineInput(input())).toBeNull();
    expect(validateRoutineInput(input({ until: '2026-10-19' }))).toBeNull();
    expect(validateRoutineInput(input({ spec: { freq: 'daily', interval: 99 } }))).toBeNull();
  });

  it('judul wajib, maksimal 60 karakter setelah di-trim', () => {
    expect(validateRoutineInput(input({ title: '   ' }))).toBe('title-required');
    expect(validateRoutineInput(input({ title: 'a'.repeat(61) }))).toBe('title-too-long');
    expect(validateRoutineInput(input({ title: ` ${'a'.repeat(60)} ` }))).toBeNull();
  });

  it('pola mingguan butuh hari', () => {
    expect(validateRoutineInput(input({ spec: { freq: 'weekly', interval: 1, days: [] } }))).toBe(
      'days-required'
    );
  });

  it('interval 1–99, bilangan bulat', () => {
    for (const interval of [0, 100, 1.5, Number.NaN]) {
      expect(validateRoutineInput(input({ spec: { freq: 'daily', interval } })), String(interval)).toBe(
        'interval-range'
      );
    }
  });

  it('opsi bulanan di luar batas', () => {
    const monthday = (day: number) =>
      input({ spec: { freq: 'monthly', interval: 1, by: { kind: 'monthday', day } } });
    expect(validateRoutineInput(monthday(0))).toBe('monthday-range');
    expect(validateRoutineInput(monthday(32))).toBe('monthday-range');
    expect(validateRoutineInput(monthday(-2))).toBe('monthday-range');
    expect(validateRoutineInput(monthday(-1))).toBeNull();
    const nth = (n: number) =>
      input({ spec: { freq: 'monthly', interval: 1, by: { kind: 'nth', nth: n, weekday: 'MO' } } });
    expect(validateRoutineInput(nth(6))).toBe('monthday-range');
    expect(validateRoutineInput(nth(0))).toBe('monthday-range');
    expect(validateRoutineInput(nth(-1))).toBeNull();
  });

  it('slot jam', () => {
    expect(validateRoutineInput(input({ startTime: '' }))).toBe('invalid-time');
    expect(validateRoutineInput(input({ durationMin: 4 }))).toBe('duration-range');
    expect(validateRoutineInput(input({ startTime: '23:00', durationMin: 61 }))).toBe('past-midnight');
  });

  it('ruang maksimal 40 karakter', () => {
    expect(validateRoutineInput(input({ location: 'a'.repeat(41) }))).toBe('location-too-long');
  });

  it('tanggal mulai wajib valid, tanggal akhir tidak sebelum mulai', () => {
    expect(validateRoutineInput(input({ dtstart: '' }))).toBe('invalid-dtstart');
    expect(validateRoutineInput(input({ dtstart: '2026-02-30' }))).toBe('invalid-dtstart');
    expect(validateRoutineInput(input({ until: '2026-10-18' }))).toBe('until-before-start');
    expect(validateRoutineInput(input({ until: 'besok' }))).toBe('until-before-start');
  });
});

describe('defaultMonthlyOptions', () => {
  it('tanggal X, hari ke-N, hari terakhir', () => {
    expect(defaultMonthlyOptions('2026-10-19')).toEqual({
      monthday: { kind: 'monthday', day: 19 },
      nth: { kind: 'nth', nth: 3, weekday: 'MO' },
      last: { kind: 'monthday', day: -1 }
    });
  });

  it('tanggal 29–31 → urutan kelima', () => {
    expect(defaultMonthlyOptions('2026-10-30').nth).toEqual({ kind: 'nth', nth: 5, weekday: 'FR' });
    expect(defaultMonthlyOptions('2026-10-01').nth).toEqual({ kind: 'nth', nth: 1, weekday: 'TH' });
  });
});
