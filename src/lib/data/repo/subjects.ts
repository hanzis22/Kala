import { ulid } from 'ulidx';
import { db } from '$lib/data/db';
import {
  compareSubjects,
  normalizeSubjectInput,
  validateSubjectInput,
  type SubjectError,
  type SubjectInput
} from '$lib/domain/subjects';
import type { Id, IsoDateTime, Subject } from '$lib/domain/types';
import { ValidationError } from './errors';

/** Mapel aktif, urut nama. */
export async function listSubjects(): Promise<Subject[]> {
  const all = await db.subjects.filter((s) => s.deletedAt === null).toArray();
  return all.sort(compareSubjects);
}

/** Termasuk yang sudah dihapus, agar data lama (tugas) tetap bisa menampilkan namanya. */
export function getSubject(id: Id): Promise<Subject | undefined> {
  return db.subjects.get(id);
}

export async function createSubject(input: SubjectInput, now: IsoDateTime): Promise<Subject> {
  return db.transaction('rw', db.subjects, async () => {
    const clean = normalizeSubjectInput(input);
    const error = validateSubjectInput(clean, await db.subjects.toArray());
    if (error) throw new ValidationError<SubjectError>(error);
    const subject: Subject = { id: ulid(), ...clean, createdAt: now, updatedAt: now, deletedAt: null };
    await db.subjects.add(subject);
    return subject;
  });
}

export async function updateSubject(id: Id, input: SubjectInput, now: IsoDateTime): Promise<Subject> {
  return db.transaction('rw', db.subjects, async () => {
    const current = await db.subjects.get(id);
    if (!current || current.deletedAt !== null) throw new ValidationError('not-found');
    const clean = normalizeSubjectInput(input);
    const error = validateSubjectInput(clean, await db.subjects.toArray(), id);
    if (error) throw new ValidationError<SubjectError>(error);
    const next: Subject = { ...current, ...clean, updatedAt: now };
    await db.subjects.put(next);
    return next;
  });
}

/**
 * Soft delete mapel beserta semua sesi kelasnya dalam satu transaksi (PRD §F4.4).
 * Tugas tidak disentuh: tetap ada dan menampilkan mapel sebagai "(dihapus)" (F6).
 * Mengembalikan jumlah sesi kelas yang ikut dihapus.
 */
export async function deleteSubject(id: Id, now: IsoDateTime): Promise<number> {
  return db.transaction('rw', db.subjects, db.routines, async () => {
    const current = await db.subjects.get(id);
    if (!current || current.deletedAt !== null) return 0;
    await db.subjects.update(id, { deletedAt: now, updatedAt: now });
    return db.routines
      .where('subjectId')
      .equals(id)
      .filter((r) => r.kind === 'class' && r.deletedAt === null)
      .modify({ deletedAt: now, updatedAt: now });
  });
}
