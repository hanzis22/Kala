import { ulid } from 'ulidx';
import { db } from '$lib/data/db';
import { isValidDateRange, weeklyRule } from '$lib/domain/recurrence';
import { validateClassSession, type ClassSessionError, type ClassSessionInput } from '$lib/domain/timetable';
import type { Id, IsoDateTime, LocalDate, Routine } from '$lib/domain/types';
import { ValidationError } from './errors';

/** Sesi kelas aktif (kind 'class'). */
export function listClassRoutines(): Promise<Routine[]> {
  return db.routines
    .where('kind')
    .equals('class')
    .filter((r) => r.deletedAt === null)
    .toArray();
}

const cleanLocation = (value: string | null) => (value ?? '').trim().replace(/\s+/g, ' ') || null;

async function assertValid(input: ClassSessionInput): Promise<ClassSessionInput> {
  const clean = { ...input, location: cleanLocation(input.location) };
  const error = validateClassSession(clean);
  if (error) throw new ValidationError<ClassSessionError>(error);
  const subject = clean.subjectId ? await db.subjects.get(clean.subjectId) : undefined;
  if (!subject || subject.deletedAt !== null)
    throw new ValidationError<ClassSessionError>('subject-required');
  return clean;
}

/**
 * Membuat sesi kelas mingguan. Satu Routine untuk semua hari yang dipilih (`BYDAY=MO,WE`).
 * `title` dikosongkan: nama selalu diambil dari Subject agar ikut berubah saat mapel diganti nama.
 */
export async function createClassRoutine(
  input: ClassSessionInput,
  dtstart: LocalDate,
  now: IsoDateTime
): Promise<Routine> {
  return db.transaction('rw', db.subjects, db.routines, async () => {
    if (!isValidDateRange(dtstart, null)) throw new ValidationError('invalid-dtstart');
    const clean = await assertValid(input);
    const routine: Routine = {
      id: ulid(),
      kind: 'class',
      title: '',
      subjectId: clean.subjectId,
      startTime: clean.startTime,
      durationMin: clean.durationMin,
      rrule: weeklyRule(clean.days),
      dtstart,
      until: null,
      exdates: [],
      overrides: {},
      location: clean.location,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };
    await db.routines.add(routine);
    return routine;
  });
}

/**
 * Mengubah seluruh seri (F4). dtstart, until, exdates, dan overrides dipertahankan;
 * pilihan "hanya tanggal ini / seterusnya" adalah F5.
 */
export async function updateClassRoutine(
  id: Id,
  input: ClassSessionInput,
  now: IsoDateTime
): Promise<Routine> {
  return db.transaction('rw', db.subjects, db.routines, async () => {
    const current = await db.routines.get(id);
    if (!current || current.deletedAt !== null || current.kind !== 'class') {
      throw new ValidationError('not-found');
    }
    const clean = await assertValid(input);
    const next: Routine = {
      ...current,
      subjectId: clean.subjectId,
      startTime: clean.startTime,
      durationMin: clean.durationMin,
      rrule: weeklyRule(clean.days),
      location: clean.location,
      updatedAt: now
    };
    await db.routines.put(next);
    return next;
  });
}

/** Soft delete satu rutin. Aman dipanggil dua kali. */
export async function deleteRoutine(id: Id, now: IsoDateTime): Promise<void> {
  await db.transaction('rw', db.routines, async () => {
    const current = await db.routines.get(id);
    if (!current || current.deletedAt !== null) return;
    await db.routines.update(id, { deletedAt: now, updatedAt: now });
  });
}
