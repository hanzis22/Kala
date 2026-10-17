/**
 * Helper tanggal dan jam lokal. Fungsi murni: tidak ada `new Date()` tanpa argumen.
 * Jangan pernah `new Date('2026-10-17')` (diparse sebagai UTC); pakai `parseLocalDate`.
 */
import { addDays as addDaysFns, format, isValid, parse } from 'date-fns';
import type { LocalDate, LocalTime, Minutes } from './types';

const LOCAL_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LOCAL_TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const MINUTES_PER_DAY = 1440;

export function isValidLocalDate(value: string): value is LocalDate {
  if (!LOCAL_DATE_RE.test(value)) return false;
  const date = parse(value, 'yyyy-MM-dd', new Date(0));
  return isValid(date) && format(date, 'yyyy-MM-dd') === value;
}

export function isValidLocalTime(value: string): value is LocalTime {
  return LOCAL_TIME_RE.test(value);
}

/** Tanggal kalender lokal dari sebuah instan. */
export function toLocalDate(instant: Date): LocalDate {
  return format(instant, 'yyyy-MM-dd');
}

/** Jam lokal 'HH:mm' dari sebuah instan. */
export function toLocalTime(instant: Date): LocalTime {
  return format(instant, 'HH:mm');
}

/** Tengah malam waktu lokal pada tanggal tersebut. */
export function parseLocalDate(value: LocalDate): Date {
  if (!isValidLocalDate(value)) throw new RangeError(`LocalDate tidak valid: ${value}`);
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return toLocalDate(addDaysFns(parseLocalDate(date), days));
}

/** 'HH:mm' → menit sejak tengah malam. */
export function toMinutes(time: LocalTime): Minutes {
  if (!isValidLocalTime(time)) throw new RangeError(`LocalTime tidak valid: ${time}`);
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Menit sejak tengah malam (0–1439) → 'HH:mm'. */
export function fromMinutes(minutes: Minutes): LocalTime {
  if (!Number.isInteger(minutes) || minutes < 0 || minutes >= MINUTES_PER_DAY) {
    throw new RangeError(`Menit di luar 0–1439: ${minutes}`);
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function minutesSinceMidnight(instant: Date): Minutes {
  return instant.getHours() * 60 + instant.getMinutes();
}

/** Milidetik sampai pukul 00.00 berikutnya (waktu lokal). Selalu > 0. */
export function msUntilNextMidnight(now: Date): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next.getTime() - now.getTime();
}
