import { ulid } from 'ulidx';
import { db } from '$lib/data/db';
import {
  buildRule,
  clearOverrideOn,
  isValidDateRange,
  moveOn,
  restoreOn,
  skipOn,
  splitSeries,
  truncateSeries,
  validateTimeSlot,
  weeklyRule,
  type SeriesPatch,
  type SlotError
} from '$lib/domain/recurrence';
import { validateRoutineInput, type RoutineError, type RoutineInput } from '$lib/domain/routines';
import { validateClassSession, type ClassSessionError, type ClassSessionInput } from '$lib/domain/timetable';
import type { Completion, Id, IsoDateTime, LocalDate, LocalTime, Routine } from '$lib/domain/types';
import { ValidationError } from './errors';

/** Semua rutin aktif (kelas, rutin, kegiatan). */
export function listActiveRoutines(): Promise<Routine[]> {
  return db.routines.filter((r) => r.deletedAt === null).toArray();
}

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

// ---------- Rutin umum (F5) ----------

/** Galat edit per tanggal: tanggal bukan kejadian (atau tidak sedang dilewati), atau rutin tidak ada. */
export type OccurrenceError = 'not-occurrence' | 'not-found';

function cleanRoutineInput(input: RoutineInput): RoutineInput {
  const clean = {
    ...input,
    title: input.title.trim().replace(/\s+/g, ' '),
    location: cleanLocation(input.location)
  };
  const error = validateRoutineInput(clean);
  if (error) throw new ValidationError<RoutineError>(error);
  return clean;
}

async function getEditable(
  id: Id,
  kinds: readonly Routine['kind'][] = ['routine', 'class']
): Promise<Routine> {
  const current = await db.routines.get(id);
  if (!current || current.deletedAt !== null || !kinds.includes(current.kind)) {
    throw new ValidationError<OccurrenceError>('not-found');
  }
  return current;
}

/** Fungsi domain melempar RangeError untuk tanggal yang bukan kejadian; dipetakan ke ValidationError. */
function onOccurrence<T>(change: () => T): T {
  try {
    return change();
  } catch (err) {
    if (err instanceof RangeError) throw new ValidationError<OccurrenceError>('not-occurrence');
    throw err;
  }
}

/** Membuat rutin umum (kind 'routine'). */
export async function createRoutine(input: RoutineInput, now: IsoDateTime): Promise<Routine> {
  return db.transaction('rw', db.routines, async () => {
    const clean = cleanRoutineInput(input);
    const routine: Routine = {
      id: ulid(),
      kind: 'routine',
      title: clean.title,
      subjectId: null,
      startTime: clean.startTime,
      durationMin: clean.durationMin,
      rrule: buildRule(clean.spec),
      dtstart: clean.dtstart,
      until: clean.until,
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

/** Mengubah seluruh seri rutin umum. exdates dan overrides dipertahankan. */
export async function updateRoutine(id: Id, input: RoutineInput, now: IsoDateTime): Promise<Routine> {
  return db.transaction('rw', db.routines, async () => {
    const current = await getEditable(id, ['routine']);
    const clean = cleanRoutineInput(input);
    const next: Routine = {
      ...current,
      title: clean.title,
      startTime: clean.startTime,
      durationMin: clean.durationMin,
      rrule: buildRule(clean.spec),
      dtstart: clean.dtstart,
      until: clean.until,
      location: clean.location,
      updatedAt: now
    };
    await db.routines.put(next);
    return next;
  });
}

async function editOccurrence(id: Id, change: (r: Routine) => Routine): Promise<Routine> {
  return db.transaction('rw', db.routines, async () => {
    const current = await getEditable(id);
    const next = onOccurrence(() => change(current));
    await db.routines.put(next);
    return next;
  });
}

/** Lewati satu tanggal (PRD §F5.3). */
export function skipOccurrence(id: Id, date: LocalDate, now: IsoDateTime): Promise<Routine> {
  return editOccurrence(id, (r) => skipOn(r, date, now));
}

/** Kembalikan tanggal yang dilewati, di jam induk. */
export function restoreOccurrence(id: Id, date: LocalDate, now: IsoDateTime): Promise<Routine> {
  return editOccurrence(id, (r) => restoreOn(r, date, now));
}

/** Pindah jam/durasi satu tanggal. Slot tidak valid → ValidationError dengan kode SlotError. */
export async function moveOccurrence(
  id: Id,
  date: LocalDate,
  slot: { startTime: LocalTime; durationMin: number },
  now: IsoDateTime
): Promise<Routine> {
  const error = validateTimeSlot(slot.startTime, slot.durationMin);
  if (error) throw new ValidationError<SlotError>(error);
  return editOccurrence(id, (r) => moveOn(r, date, slot, now));
}

/** Kembalikan jam semula untuk satu tanggal. */
export function clearOverride(id: Id, date: LocalDate, now: IsoDateTime): Promise<Routine> {
  return editOccurrence(id, (r) => clearOverrideOn(r, date, now));
}

/** Isi form "Tanggal ini dan seterusnya", sesuai jenis rutin. Tanggal mulai selalu `date`. */
export type FromDateInput =
  { kind: 'class'; session: ClassSessionInput } | { kind: 'routine'; routine: Omit<RoutineInput, 'dtstart'> };

/**
 * "Tanggal ini dan seterusnya" (PRD §F5.4) dalam satu transaksi: validasi lebih dulu, lalu split seri
 * dan pindahkan centang (Completion) mulai `date` ke seri baru. Di kejadian pertama seri, seluruh seri
 * diubah tanpa membuat rutin baru.
 */
export async function editFromDate(
  id: Id,
  date: LocalDate,
  input: FromDateInput,
  now: IsoDateTime
): Promise<{ old: Routine; next: Routine | null }> {
  return db.transaction('rw', db.routines, db.completions, db.subjects, async () => {
    const current = await getEditable(id, [input.kind]);

    let patch: SeriesPatch;
    if (input.kind === 'class') {
      const clean = await assertValid(input.session);
      patch = {
        subjectId: clean.subjectId,
        startTime: clean.startTime,
        durationMin: clean.durationMin,
        rrule: weeklyRule(clean.days),
        location: clean.location
      };
    } else {
      const clean = cleanRoutineInput({ ...input.routine, dtstart: date });
      patch = {
        title: clean.title,
        startTime: clean.startTime,
        durationMin: clean.durationMin,
        rrule: buildRule(clean.spec),
        location: clean.location,
        until: clean.until
      };
    }
    const { old, next } = onOccurrence(() => splitSeries(current, date, patch, ulid(), now));

    await db.routines.put(old);
    if (next) {
      await db.routines.add(next);
      const moved = await db.completions
        .where('routineId')
        .equals(id)
        .filter((c) => c.date >= date)
        .toArray();
      await db.completions.bulkDelete(moved.map((c) => c.id));
      await db.completions.bulkPut(
        moved.map((c): Completion => ({ ...c, id: `${next.id}:${c.date}`, routineId: next.id }))
      );
    }
    return { old, next };
  });
}

/**
 * "Hapus mulai tanggal ini": seri berakhir di date−1. Di kejadian pertama seri, seluruh seri
 * di-soft delete. Completion ≥ date dibiarkan (tidak punya kejadian lagi, jadi tidak tampil).
 */
export async function endFromDate(id: Id, date: LocalDate, now: IsoDateTime): Promise<Routine> {
  return db.transaction('rw', db.routines, db.completions, db.subjects, async () => {
    const current = await getEditable(id);
    const truncated = onOccurrence(() => truncateSeries(current, date, now));
    const next: Routine = truncated ?? { ...current, deletedAt: now, updatedAt: now };
    await db.routines.put(next);
    return next;
  });
}
