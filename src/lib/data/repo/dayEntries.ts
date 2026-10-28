import { db } from '$lib/data/db';
import { emptyDayEntry, normalizePriorities, validatePriorities, type PriorityError } from '$lib/domain/day';
import type { DayEntry, IsoDateTime, LocalDate, Priority3Item } from '$lib/domain/types';
import { ValidationError } from './errors';

export function getDayEntry(date: LocalDate): Promise<DayEntry | undefined> {
  return db.dayEntries.get(date);
}

/**
 * Mengganti 3 prioritas tanggal `date`. Input dinormalisasi (trim, baris kosong dibuang tanpa celah)
 * lalu divalidasi sebelum menulis. Field lain (mood, note, gratitude) tidak disentuh.
 */
export async function setPriorities(
  date: LocalDate,
  items: readonly Priority3Item[],
  now: IsoDateTime
): Promise<DayEntry> {
  const priorities = normalizePriorities(items);
  const error = validatePriorities(priorities);
  if (error) throw new ValidationError<PriorityError>(error);
  return db.transaction('rw', db.dayEntries, async () => {
    const current = (await db.dayEntries.get(date)) ?? emptyDayEntry(date, now);
    const next: DayEntry = { ...current, priorities, updatedAt: now };
    await db.dayEntries.put(next);
    return next;
  });
}
