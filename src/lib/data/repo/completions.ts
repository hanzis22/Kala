import { db } from '$lib/data/db';
import { isSupportedRoutine, occursOn } from '$lib/domain/recurrence';
import type { Completion, Id, IsoDateTime, LocalDate } from '$lib/domain/types';
import { ValidationError } from './errors';

/** Rutin tidak ada/sudah dihapus, atau tanggal itu bukan kejadiannya (termasuk tanggal yang dilewati). */
export type CompletionRepoError = 'not-found' | 'not-occurrence';

export const completionId = (routineId: Id, date: LocalDate) => `${routineId}:${date}`;

/**
 * Centang (done) atau batalkan centang satu kejadian rutin/kelas/kegiatan. ID deterministik → upsert.
 * Idempoten: centang ulang mempertahankan `at` pertama; batal tanpa centang = tidak ada yang ditulis.
 * Repo tidak membatasi tanggal ke hari ini; UI yang membatasi (Usulan F2 #3).
 */
export async function setCompletion(
  routineId: Id,
  date: LocalDate,
  done: boolean,
  now: IsoDateTime
): Promise<void> {
  await db.transaction('rw', db.routines, db.completions, async () => {
    const routine = await db.routines.get(routineId);
    if (!routine || routine.deletedAt !== null) {
      throw new ValidationError<CompletionRepoError>('not-found');
    }
    if (!isSupportedRoutine(routine) || !occursOn(routine, date)) {
      throw new ValidationError<CompletionRepoError>('not-occurrence');
    }
    const id = completionId(routineId, date);
    if (!done) {
      await db.completions.delete(id);
      return;
    }
    if (await db.completions.get(id)) return;
    const entry: Completion = { id, routineId, date, at: now };
    await db.completions.put(entry);
  });
}

/** Semua centang bertanggal `date`. */
export function completionsOn(date: LocalDate): Promise<Completion[]> {
  return db.completions.where('date').equals(date).toArray();
}
