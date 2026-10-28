/**
 * Header dan 3 prioritas Hari Ini (PRD §F2.1, §F2.4). Fungsi murni.
 * Panjang teks dihitung dalam UTF-16 code unit (`.length`), sama dengan `maxlength` input.
 */
import type { DayEntry, IsoDateTime, LocalDate, Minutes, Priority3Item } from './types';

export const MAX_PRIORITIES = 3;
export const MAX_PRIORITY_TEXT = 80;

export type PriorityError = 'too-many' | 'too-long';
export type Greeting = 'pagi' | 'siang' | 'sore' | 'malam';

/** Pagi < 11.00, siang < 15.00, sore < 18.00, malam sisanya. `minutes` = jam perangkat. */
export function greetingFor(minutes: Minutes): Greeting {
  if (minutes < 660) return 'pagi';
  if (minutes < 900) return 'siang';
  if (minutes < 1080) return 'sore';
  return 'malam';
}

/** Teks di-trim, baris kosong dibuang tanpa celah; `done` ikut barisnya. */
export function normalizePriorities(items: readonly Priority3Item[]): Priority3Item[] {
  return items.map((i) => ({ text: i.text.trim(), done: i.done })).filter((i) => i.text !== '');
}

/** Dicek pada hasil normalisasi: jumlah dulu, lalu panjang teks. */
export function validatePriorities(items: readonly Priority3Item[]): PriorityError | null {
  const normalized = normalizePriorities(items);
  if (normalized.length > MAX_PRIORITIES) return 'too-many';
  if (normalized.some((i) => i.text.length > MAX_PRIORITY_TEXT)) return 'too-long';
  return null;
}

export function emptyDayEntry(date: LocalDate, now: IsoDateTime): DayEntry {
  return { date, priorities: [], mood: null, note: null, gratitude: [], updatedAt: now };
}
