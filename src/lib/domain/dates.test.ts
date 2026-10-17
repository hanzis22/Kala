import { describe, expect, it } from 'vitest';
import {
  addDays,
  dayNumber,
  fromMinutes,
  isValidLocalDate,
  isValidLocalTime,
  minutesSinceMidnight,
  msUntilNextMidnight,
  parseLocalDate,
  toLocalDate,
  toLocalTime,
  toMinutes,
  toZoned
} from './dates';

describe('isValidLocalDate', () => {
  it.each(['2026-10-17', '2024-02-29', '2026-12-31', '2026-01-01'])('menerima %s', (v) => {
    expect(isValidLocalDate(v)).toBe(true);
  });
  it.each(['2026-02-29', '2026-13-01', '2026-10-32', '2026-1-7', '17-10-2026', '', '2026-10-17T00:00'])(
    'menolak %s',
    (v) => {
      expect(isValidLocalDate(v)).toBe(false);
    }
  );
});

describe('isValidLocalTime', () => {
  it.each(['00:00', '07:05', '23:59', '12:30'])('menerima %s', (v) => {
    expect(isValidLocalTime(v)).toBe(true);
  });
  it.each(['24:00', '7:05', '12:60', '1230', '', '12:30:00'])('menolak %s', (v) => {
    expect(isValidLocalTime(v)).toBe(false);
  });
});

describe('parseLocalDate / toLocalDate', () => {
  it('memparse sebagai tengah malam lokal, bukan UTC', () => {
    const d = parseLocalDate('2026-10-17');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9);
    expect(d.getDate()).toBe(17);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it('bolak-balik tanpa bergeser', () => {
    for (const v of ['2026-10-17', '2024-02-29', '2026-12-31', '2027-01-01']) {
      expect(toLocalDate(parseLocalDate(v))).toBe(v);
    }
  });

  it('toLocalDate memakai waktu lokal di detik terakhir hari', () => {
    expect(toLocalDate(new Date(2026, 9, 17, 23, 59, 59, 999))).toBe('2026-10-17');
    expect(toLocalDate(new Date(2026, 9, 18, 0, 0, 0, 0))).toBe('2026-10-18');
  });

  it('menolak input tidak valid', () => {
    expect(() => parseLocalDate('2026-02-30')).toThrow(RangeError);
  });
});

describe('addDays', () => {
  it('melewati akhir bulan dan tahun', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31');
  });

  it('menghormati tahun kabisat', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });

  it('nol hari = tanggal sama', () => {
    expect(addDays('2026-10-17', 0)).toBe('2026-10-17');
  });
});

describe('toMinutes / fromMinutes', () => {
  it('mengonversi batas hari', () => {
    expect(toMinutes('00:00')).toBe(0);
    expect(toMinutes('23:59')).toBe(1439);
    expect(fromMinutes(0)).toBe('00:00');
    expect(fromMinutes(1439)).toBe('23:59');
  });

  it('bolak-balik', () => {
    expect(fromMinutes(toMinutes('07:05'))).toBe('07:05');
    expect(toMinutes(fromMinutes(605))).toBe(605);
  });

  it('menolak nilai di luar rentang', () => {
    expect(() => toMinutes('24:00')).toThrow(RangeError);
    expect(() => fromMinutes(1440)).toThrow(RangeError);
    expect(() => fromMinutes(-1)).toThrow(RangeError);
    expect(() => fromMinutes(1.5)).toThrow(RangeError);
  });
});

describe('minutesSinceMidnight / toLocalTime', () => {
  it('memakai jam lokal', () => {
    const d = new Date(2026, 9, 17, 10, 40, 30);
    expect(minutesSinceMidnight(d)).toBe(640);
    expect(toLocalTime(d)).toBe('10:40');
  });
});

describe('msUntilNextMidnight', () => {
  it('menghitung sampai 00.00 berikutnya', () => {
    expect(msUntilNextMidnight(new Date(2026, 9, 17, 23, 59, 0))).toBe(60_000);
    expect(msUntilNextMidnight(new Date(2026, 9, 17, 12, 0, 0))).toBe(12 * 3_600_000);
  });

  it('tepat 00.00 menunggu satu hari penuh', () => {
    expect(msUntilNextMidnight(new Date(2026, 9, 18, 0, 0, 0))).toBe(24 * 3_600_000);
  });

  it('melewati akhir tahun', () => {
    expect(msUntilNextMidnight(new Date(2026, 11, 31, 23, 0, 0))).toBe(3_600_000);
  });
});

describe('dayNumber', () => {
  it('berurutan dan tahan pergantian bulan/tahun', () => {
    expect(dayNumber('1970-01-01')).toBe(0);
    expect(dayNumber('2026-10-18') - dayNumber('2026-10-17')).toBe(1);
    expect(dayNumber('2027-01-01') - dayNumber('2026-12-31')).toBe(1);
    expect(dayNumber('2024-03-01') - dayNumber('2024-02-28')).toBe(2);
  });
});

describe('toZoned', () => {
  // 2026-10-17T21:30:00Z = 18 Okt 04.30 WIB = 05.30 WITA = 06.30 WIT
  const instant = new Date('2026-10-17T21:30:00Z');

  it('memakai zona yang diminta, bukan zona perangkat', () => {
    expect(toZoned(instant, 'Asia/Jakarta')).toEqual({ date: '2026-10-18', minutes: 4 * 60 + 30 });
    expect(toZoned(instant, 'Asia/Makassar')).toEqual({ date: '2026-10-18', minutes: 5 * 60 + 30 });
    expect(toZoned(instant, 'Asia/Jayapura')).toEqual({ date: '2026-10-18', minutes: 6 * 60 + 30 });
  });

  it('tengah malam = menit 0', () => {
    expect(toZoned(new Date('2026-10-17T17:00:00Z'), 'Asia/Jakarta')).toEqual({
      date: '2026-10-18',
      minutes: 0
    });
  });
});
