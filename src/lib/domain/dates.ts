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

/** Nomor hari sejak 1970-01-01 untuk sebuah LocalDate. Untuk membandingkan/menghitung selisih tanggal. */
export function dayNumber(date: LocalDate): number {
  if (!isValidLocalDate(date)) throw new RangeError(`LocalDate tidak valid: ${date}`);
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

const zonedFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Tanggal dan menit sejak tengah malam dari sebuah instan, di zona waktu IANA tertentu
 * (misal zona lokasi untuk hitungan sholat), tidak bergantung zona perangkat.
 */
export function toZoned(instant: Date, timeZone: string): { date: LocalDate; minutes: Minutes } {
  let fmt = zonedFormatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    });
    zonedFormatters.set(timeZone, fmt);
  }
  const p = Object.fromEntries(fmt.formatToParts(instant).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

/**
 * Offset zona waktu pada sebuah instan dalam menit = waktu lokal − UTC (timur positif), misal Asia/Jakarta
 * 420 dan America/New_York −300 (EST) / −240 (EDT). Kebalikan tanda `Date#getTimezoneOffset`.
 */
export function zoneOffsetMinutes(instant: Date, timeZone: string): number {
  const z = toZoned(instant, timeZone);
  return dayNumber(z.date) * MINUTES_PER_DAY + z.minutes - Math.floor(instant.getTime() / 60_000);
}

/**
 * Kebalikan `toZoned`: instan untuk jam dinding `minutes` pada `date` di zona `timeZone`, tidak bergantung
 * zona perangkat. Offset dicoba dari sebelum dan sesudah tanggal itu; yang dipakai adalah kandidat yang
 * kembali ke jam dinding yang sama. Jam ganda (DST mundur) → kejadian lebih awal; celah (DST maju) → jam
 * setelah celah, misal 02.30 New York saat DST mulai = 03.30 EDT (sama dengan Temporal 'compatible').
 */
export function fromZoned(date: LocalDate, minutes: Minutes, timeZone: string): Date {
  const wall = dayNumber(date) * MINUTES_PER_DAY + minutes;
  const offsetAt = (m: number) => zoneOffsetMinutes(new Date(m * 60_000), timeZone);
  const before = offsetAt(wall - MINUTES_PER_DAY);
  const after = offsetAt(wall + MINUTES_PER_DAY);
  const matches = [wall - before, wall - after].filter((m) => wall - offsetAt(m) === m);
  return new Date((matches.length > 0 ? Math.min(...matches) : wall - before) * 60_000);
}
