import { ulid } from 'ulidx';
import { db } from '$lib/data/db';
import {
  isClearable,
  normalizeTaskInput,
  validateTaskInput,
  type TaskError,
  type TaskInput
} from '$lib/domain/tasks';
import type { Id, IsoDateTime, Task } from '$lib/domain/types';
import { ValidationError } from './errors';

/** Galat repo di luar validasi input: mapel tidak bisa dipakai, atau tugas tidak ada/sudah dihapus. */
export type TaskRepoError = 'subject-not-found' | 'not-found';

function cleanTaskInput(input: TaskInput): TaskInput {
  const clean = normalizeTaskInput(input);
  const error = validateTaskInput(clean);
  if (error) throw new ValidationError<TaskError>(error);
  return clean;
}

/**
 * Mapel harus aktif. Pengecualian: `kept` = mapel yang sudah tersimpan di tugas itu boleh dipertahankan
 * walau sudah dihapus (PRD §F4.4, label "(dihapus)").
 */
async function assertSubject(subjectId: Id | null, kept: Id | null = null): Promise<void> {
  if (subjectId === null || subjectId === kept) return;
  const subject = await db.subjects.get(subjectId);
  if (!subject || subject.deletedAt !== null) {
    throw new ValidationError<TaskRepoError>('subject-not-found');
  }
}

async function getActive(id: Id): Promise<Task> {
  const current = await db.tasks.get(id);
  if (!current || current.deletedAt !== null) throw new ValidationError<TaskRepoError>('not-found');
  return current;
}

/** Hanya field milik form; quadrant, status, completedAt, dan timestamp tidak bisa diubah lewat input. */
function inputFields(clean: TaskInput): TaskInput {
  return {
    title: clean.title,
    notes: clean.notes,
    type: clean.type,
    subjectId: clean.subjectId,
    dueDate: clean.dueDate,
    dueTime: clean.dueTime,
    scheduledDate: clean.scheduledDate,
    startTime: clean.startTime,
    durationMin: clean.durationMin,
    priority: clean.priority
  };
}

/** Semua tugas aktif, tanpa urutan (diurutkan domain). */
export function listActiveTasks(): Promise<Task[]> {
  return db.tasks.filter((t) => t.deletedAt === null).toArray();
}

export async function createTask(input: TaskInput, now: IsoDateTime): Promise<Task> {
  return db.transaction('rw', db.tasks, db.subjects, async () => {
    const clean = cleanTaskInput(input);
    await assertSubject(clean.subjectId);
    const task: Task = {
      id: ulid(),
      ...inputFields(clean),
      quadrant: null,
      status: 'todo',
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };
    await db.tasks.add(task);
    return task;
  });
}

/** Mengubah isi tugas. Selesai/batal lewat completeTask/reopenTask. */
export async function updateTask(id: Id, input: TaskInput, now: IsoDateTime): Promise<Task> {
  return db.transaction('rw', db.tasks, db.subjects, async () => {
    const current = await getActive(id);
    const clean = cleanTaskInput(input);
    await assertSubject(clean.subjectId, current.subjectId);
    const next: Task = { ...current, ...inputFields(clean), updatedAt: now };
    await db.tasks.put(next);
    return next;
  });
}

/** Tandai selesai. Idempoten: tugas yang sudah selesai tidak ditulis ulang (completedAt tetap). */
export async function completeTask(id: Id, now: IsoDateTime): Promise<Task> {
  return db.transaction('rw', db.tasks, async () => {
    const current = await getActive(id);
    if (current.status === 'done') return current;
    const next: Task = { ...current, status: 'done', completedAt: now, updatedAt: now };
    await db.tasks.put(next);
    return next;
  });
}

/** Batalkan selesai. Idempoten: tugas yang belum selesai tidak ditulis ulang. */
export async function reopenTask(id: Id, now: IsoDateTime): Promise<Task> {
  return db.transaction('rw', db.tasks, async () => {
    const current = await getActive(id);
    if (current.status === 'todo' && current.completedAt === null) return current;
    const next: Task = { ...current, status: 'todo', completedAt: null, updatedAt: now };
    await db.tasks.put(next);
    return next;
  });
}

/**
 * Soft delete. Mengembalikan token urungkan (= deletedAt). Tugas yang sudah dihapus tidak ditulis
 * ulang; token lamanya dikembalikan.
 */
export async function deleteTask(id: Id, now: IsoDateTime): Promise<IsoDateTime> {
  return db.transaction('rw', db.tasks, async () => {
    const current = await db.tasks.get(id);
    if (!current) throw new ValidationError<TaskRepoError>('not-found');
    if (current.deletedAt !== null) return current.deletedAt;
    await db.tasks.update(id, { deletedAt: now, updatedAt: now });
    return now;
  });
}

/** Urungkan hapus. Hanya jika token cocok dengan deletedAt (urungkan basi tidak memulihkan apa pun). */
export async function restoreTask(id: Id, token: IsoDateTime, now: IsoDateTime): Promise<boolean> {
  return db.transaction('rw', db.tasks, async () => {
    const current = await db.tasks.get(id);
    if (!current || current.deletedAt !== token) return false;
    await db.tasks.update(id, { deletedAt: null, updatedAt: now });
    return true;
  });
}

/** "Bersihkan yang selesai" (PRD §F6.5): soft delete tugas yang isClearable. Mengembalikan jumlahnya. */
export async function clearCompletedTasks(now: IsoDateTime): Promise<number> {
  return db.transaction('rw', db.tasks, () =>
    db.tasks
      .where('status')
      .equals('done')
      .filter((t) => isClearable(t, now))
      .modify({ deletedAt: now, updatedAt: now })
  );
}
