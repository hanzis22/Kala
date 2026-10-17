import { describe, expect, it } from 'vitest';
import { toHijri } from './hijri';

describe('toHijri', () => {
  it('17 Okt 2026 = 6 Jumadilawal 1448 H (Umm al-Qura)', () => {
    expect(toHijri('2026-10-17')).toEqual({
      day: 6,
      month: 5,
      year: 1448,
      monthName: 'Jumadilawal',
      label: '6 Jumadilawal 1448 H'
    });
  });

  it('awal Ramadan dan Syawal 1447 H', () => {
    expect(toHijri('2026-02-18')).toMatchObject({ day: 1, month: 9, year: 1447 });
    expect(toHijri('2026-03-20')).toMatchObject({ day: 1, month: 10, year: 1447 });
  });

  it('offset menggeser hari, termasuk melewati batas bulan', () => {
    expect(toHijri('2026-10-17', 1)).toMatchObject({ day: 7, month: 5 });
    expect(toHijri('2026-10-17', -2)).toMatchObject({ day: 4, month: 5 });
    expect(toHijri('2026-02-18', -1)).toMatchObject({ month: 8, year: 1447 });
  });

  it('menolak offset di luar −2..+2', () => {
    expect(() => toHijri('2026-10-17', 3)).toThrow(RangeError);
    expect(() => toHijri('2026-10-17', 0.5)).toThrow(RangeError);
  });
});
