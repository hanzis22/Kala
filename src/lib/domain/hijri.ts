/**
 * Tanggal Hijriah (PRD §6, §F8.3). Kalender Umm al-Qura dari Intl, ditambah penyesuaian −2..+2 hari
 * karena bisa berbeda sehari dengan keputusan Kemenag. Hari Hijriah mengikuti hari Masehi (§7.6).
 */
import { dayNumber } from './dates';
import type { LocalDate } from './types';

export interface HijriDate {
  day: number;
  month: number;
  year: number;
  /** Nama bulan dalam bahasa Indonesia, misal 'Jumadilawal'. */
  monthName: string;
  /** Misal '6 Jumadilawal 1448 H'. */
  label: string;
}

const nameFormatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric'
});
const numberFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura-nu-latn', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric'
});

export function toHijri(date: LocalDate, offsetDays = 0): HijriDate {
  if (!Number.isInteger(offsetDays) || offsetDays < -2 || offsetDays > 2) {
    throw new RangeError(`offset Hijriah di luar −2..+2: ${offsetDays}`);
  }
  // Tengah hari UTC dari hari Masehi yang sudah digeser, agar tidak terpengaruh zona waktu.
  const instant = new Date((dayNumber(date) + offsetDays) * 86_400_000 + 12 * 3_600_000);
  const num = Object.fromEntries(numberFormatter.formatToParts(instant).map((p) => [p.type, p.value]));
  const named = Object.fromEntries(nameFormatter.formatToParts(instant).map((p) => [p.type, p.value]));
  const day = Number(num.day);
  const month = Number(num.month);
  const year = Number(num.year.replace(/\D/g, ''));
  return { day, month, year, monthName: named.month, label: `${day} ${named.month} ${year} H` };
}
