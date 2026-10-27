import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/data/db';
import type { TaskInput } from '$lib/domain/tasks';
import type { Subject, Task } from '$lib/domain/types';
import { ValidationError } from './errors';
import { createSubject, deleteSubject } from './subjects';
import {
  clearCompletedTasks,
  completeTask,
  createTask,
  deleteTask,
  listActiveTasks,
  reopenTask,
  restoreTask,
  updateTask
} from './tasks';

const T1 = '2026-10-19T01:00:00.000Z';
const T2 = '2026-10-19T02:00:00.000Z';
const T3 = '2026-10-19T03:00:00.000Z';

let mtk: Subject;
let ipa: Subject;

const input = (patch: Partial<TaskInput> = {}): TaskInput => ({
  title: 'PR Fisika',
  notes: null,
  type: 'pr',
  subjectId: null,
  dueDate: '2026-10-27',
  dueTime: null,
  scheduledDate: null,
  startTime: null,
  durationMin: null,
  priority: 'medium',
  ...patch
});

beforeEach(async () => {
  await Promise.all([db.subjects.clear(), db.routines.clear(), db.tasks.clear()]);
  mtk = await createSubject({ name: 'Matematika', abbr: null, teacher: null, room: null }, T1);
  ipa = await createSubject({ name: 'IPA', abbr: null, teacher: null, room: null }, T1);
});

describe('createTask', () => {
  it('menyimpan input yang sudah dinormalisasi dengan field turunan', async () => {
    const t = await createTask(
      input({
        title: '  PR   Fisika ',
        notes: '  baris 1\nbaris 2  ',
        dueTime: '',
        subjectId: mtk.id,
        scheduledDate: '2026-10-26',
        startTime: '16:00',
        durationMin: 60
      }),
      T1
    );
    expect(t).toEqual({
      id: t.id,
      title: 'PR Fisika',
      notes: 'baris 1\nbaris 2',
      type: 'pr',
      subjectId: mtk.id,
      dueDate: '2026-10-27',
      dueTime: null,
      scheduledDate: '2026-10-26',
      startTime: '16:00',
      durationMin: 60,
      priority: 'medium',
      quadrant: null,
      status: 'todo',
      completedAt: null,
      createdAt: T1,
      updatedAt: T1,
      deletedAt: null
    });
    expect(t.id).toMatch(/^[0-9A-Z]{26}$/);
    expect(await db.tasks.get(t.id)).toEqual(t);
  });

  it('catatan kosong menjadi null', async () => {
    expect((await createTask(input({ notes: '   ' }), T1)).notes).toBeNull();
  });

  it('field di luar TaskInput tidak ikut tersimpan', async () => {
    const dirty = { ...input(), status: 'done', quadrant: 'q1', completedAt: T1, extra: 'x' } as TaskInput;
    const t = await createTask(dirty, T1);
    expect(t).toMatchObject({ status: 'todo', quadrant: null, completedAt: null });
    expect(await db.tasks.get(t.id)).not.toHaveProperty('extra');
  });

  it.each<[string, Partial<TaskInput>]>([
    ['title-required', { title: '   ' }],
    ['title-too-long', { title: 'a'.repeat(101) }],
    ['invalid-type', { type: 'kuis' as TaskInput['type'] }],
    ['invalid-priority', { priority: 'urgent' as TaskInput['priority'] }],
    ['due-time-without-date', { dueDate: null, dueTime: '10:00' }],
    ['schedule-incomplete', { scheduledDate: '2026-10-26', startTime: '16:00' }],
    ['past-midnight', { scheduledDate: '2026-10-26', startTime: '23:00', durationMin: 61 }]
  ])('galat validasi %s → ValidationError, tidak ada yang tertulis', async (code, patch) => {
    const result = createTask(input(patch), T1);
    await expect(result).rejects.toBeInstanceOf(ValidationError);
    await expect(result).rejects.toMatchObject({ code });
    expect(await db.tasks.count()).toBe(0);
  });

  it('menolak mapel yang sudah dihapus atau tidak ada', async () => {
    await deleteSubject(mtk.id, T2);
    await expect(createTask(input({ subjectId: mtk.id }), T2)).rejects.toMatchObject({
      code: 'subject-not-found'
    });
    await expect(createTask(input({ subjectId: 'tidak-ada' }), T2)).rejects.toMatchObject({
      code: 'subject-not-found'
    });
    expect(await db.tasks.count()).toBe(0);
  });
});

describe('updateTask', () => {
  it('memperbarui isi dan updatedAt; quadrant, status, completedAt, createdAt tetap', async () => {
    const t = await createTask(input(), T1);
    // Data dari Fase 2 / impor: quadrant terisi dan sudah selesai.
    await db.tasks.update(t.id, { quadrant: 'q2', status: 'done', completedAt: T1 });
    const next = await updateTask(t.id, input({ title: ' PR  Kimia ', priority: 'high' }), T2);
    expect(next).toMatchObject({
      title: 'PR Kimia',
      priority: 'high',
      quadrant: 'q2',
      status: 'done',
      completedAt: T1,
      createdAt: T1,
      updatedAt: T2
    });
    expect(await db.tasks.get(t.id)).toEqual(next);
  });

  it('updatedAt diperbarui walau isinya sama', async () => {
    const t = await createTask(input(), T1);
    expect((await updateTask(t.id, input(), T2)).updatedAt).toBe(T2);
  });

  it('galat validasi tidak mengubah record', async () => {
    const t = await createTask(input(), T1);
    await expect(updateTask(t.id, input({ title: '' }), T2)).rejects.toMatchObject({
      code: 'title-required'
    });
    expect(await db.tasks.get(t.id)).toEqual(t);
  });

  it('mapel terhapus boleh dipertahankan, tapi tidak boleh dipilih ulang dari mapel lain', async () => {
    const t = await createTask(input({ subjectId: mtk.id }), T1);
    const other = await createTask(input({ subjectId: ipa.id }), T1);
    await deleteSubject(mtk.id, T2);

    expect((await updateTask(t.id, input({ subjectId: mtk.id, title: 'Ubah' }), T2)).subjectId).toBe(mtk.id);
    await expect(updateTask(other.id, input({ subjectId: mtk.id }), T2)).rejects.toMatchObject({
      code: 'subject-not-found'
    });
    expect((await db.tasks.get(other.id))?.subjectId).toBe(ipa.id);
  });

  it('boleh ganti dari mapel terhapus ke mapel aktif atau tanpa mapel', async () => {
    const t = await createTask(input({ subjectId: mtk.id }), T1);
    await deleteSubject(mtk.id, T2);
    expect((await updateTask(t.id, input({ subjectId: ipa.id }), T2)).subjectId).toBe(ipa.id);
    expect((await updateTask(t.id, input({ subjectId: null }), T3)).subjectId).toBeNull();
    // Setelah dilepas, mapel terhapus tidak bisa dipasang lagi.
    await expect(updateTask(t.id, input({ subjectId: mtk.id }), T3)).rejects.toMatchObject({
      code: 'subject-not-found'
    });
  });
});

describe('not-found', () => {
  it('update, complete, reopen menolak tugas yang tidak ada atau sudah dihapus', async () => {
    const t = await createTask(input(), T1);
    await deleteTask(t.id, T2);
    for (const id of [t.id, 'tidak-ada']) {
      await expect(updateTask(id, input(), T3)).rejects.toMatchObject({ code: 'not-found' });
      await expect(completeTask(id, T3)).rejects.toMatchObject({ code: 'not-found' });
      await expect(reopenTask(id, T3)).rejects.toMatchObject({ code: 'not-found' });
    }
    await expect(deleteTask('tidak-ada', T3)).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('completeTask / reopenTask', () => {
  it('complete mengisi status, completedAt, updatedAt', async () => {
    const t = await createTask(input(), T1);
    const done = await completeTask(t.id, T2);
    expect(done).toMatchObject({ status: 'done', completedAt: T2, updatedAt: T2 });
    expect(await db.tasks.get(t.id)).toEqual(done);
  });

  it('complete dua kali tidak menggeser completedAt maupun updatedAt', async () => {
    const t = await createTask(input(), T1);
    await completeTask(t.id, T2);
    const again = await completeTask(t.id, T3);
    expect(again).toMatchObject({ completedAt: T2, updatedAt: T2 });
    expect(await db.tasks.get(t.id)).toEqual(again);
  });

  it('complete bersamaan (ketukan ganda) menghasilkan completedAt yang sama', async () => {
    const t = await createTask(input(), T1);
    const [a, b] = await Promise.all([completeTask(t.id, T2), completeTask(t.id, T3)]);
    expect(a.completedAt).toBe(b.completedAt);
    expect((await db.tasks.get(t.id))?.completedAt).toBe(a.completedAt);
  });

  it('reopen mengosongkan completedAt; reopen kedua tidak menulis', async () => {
    const t = await createTask(input(), T1);
    await completeTask(t.id, T2);
    const open = await reopenTask(t.id, T3);
    expect(open).toMatchObject({ status: 'todo', completedAt: null, updatedAt: T3 });
    const again = await reopenTask(t.id, '2026-10-19T04:00:00.000Z');
    expect(again.updatedAt).toBe(T3);
  });

  it('reopen pada tugas belum selesai tidak menulis', async () => {
    const t = await createTask(input(), T1);
    expect(await reopenTask(t.id, T2)).toEqual(t);
  });
});

describe('deleteTask / restoreTask', () => {
  it('soft delete: hilang dari listActiveTasks, record tetap ada, token = now', async () => {
    const keep = await createTask(input({ title: 'Tetap' }), T1);
    const t = await createTask(input(), T1);
    expect(await deleteTask(t.id, T2)).toBe(T2);
    expect((await listActiveTasks()).map((x) => x.id)).toEqual([keep.id]);
    expect(await db.tasks.get(t.id)).toMatchObject({ deletedAt: T2, updatedAt: T2 });
  });

  it('delete dua kali mengembalikan token lama tanpa menulis, dan token itu bisa diurungkan', async () => {
    const t = await createTask(input(), T1);
    const token = await deleteTask(t.id, T2);
    expect(await deleteTask(t.id, T3)).toBe(token);
    expect(await db.tasks.get(t.id)).toMatchObject({ deletedAt: T2, updatedAt: T2 });

    expect(await restoreTask(t.id, token, T3)).toBe(true);
    expect((await listActiveTasks()).map((x) => x.id)).toEqual([t.id]);
  });

  it('restore dengan token benar memulihkan dan memperbarui updatedAt', async () => {
    const t = await createTask(input(), T1);
    const token = await deleteTask(t.id, T2);
    expect(await restoreTask(t.id, token, T3)).toBe(true);
    expect(await db.tasks.get(t.id)).toEqual({ ...t, deletedAt: null, updatedAt: T3 });
  });

  it('token salah, dipanggil dua kali, atau tugas tidak ada → false', async () => {
    const t = await createTask(input(), T1);
    const token = await deleteTask(t.id, T2);
    expect(await restoreTask(t.id, T1, T3)).toBe(false);
    expect((await db.tasks.get(t.id))?.deletedAt).toBe(T2);
    expect(await restoreTask(t.id, token, T3)).toBe(true);
    expect(await restoreTask(t.id, token, T3)).toBe(false);
    expect(await restoreTask('tidak-ada', token, T3)).toBe(false);
  });

  it('urungkan basi tidak memulihkan penghapusan berikutnya', async () => {
    const t = await createTask(input(), T1);
    const stale = await deleteTask(t.id, T2);
    await restoreTask(t.id, stale, T2);
    await deleteTask(t.id, T3);
    expect(await restoreTask(t.id, stale, T3)).toBe(false);
    expect((await db.tasks.get(t.id))?.deletedAt).toBe(T3);
  });
});

describe('clearCompletedTasks', () => {
  const NOW = '2026-10-26T03:00:00.000Z';
  const WEEK_AGO = '2026-10-19T03:00:00.000Z';

  async function doneAt(title: string, completedAt: string): Promise<Task> {
    const t = await createTask(input({ title }), T1);
    return completeTask(t.id, completedAt);
  }

  it('hanya yang isClearable, mengembalikan jumlah, tidak menyentuh yang lain', async () => {
    const exact = await doneAt('Tepat 7 hari', WEEK_AGO);
    const over = await doneAt('7 hari + 1 ms', '2026-10-19T02:59:59.999Z');
    const old = await doneAt('Lama', '2026-10-01T00:00:00.000Z');
    const todo = await createTask(input({ title: 'Belum' }), T1);
    // Selesai lama lalu dibuka lagi: completedAt null, tidak pernah dibersihkan.
    const reopened = await doneAt('Dibuka lagi', '2026-10-01T00:00:00.000Z');
    await reopenTask(reopened.id, T2);
    const gone = await doneAt('Sudah dihapus', '2026-10-01T00:00:00.000Z');
    await deleteTask(gone.id, T2);

    expect(await clearCompletedTasks(NOW)).toBe(2);

    const active = (await listActiveTasks()).map((t) => t.id).sort();
    expect(active).toEqual([exact.id, todo.id, reopened.id].sort());
    expect(await db.tasks.get(over.id)).toMatchObject({ deletedAt: NOW, updatedAt: NOW });
    expect(await db.tasks.get(old.id)).toMatchObject({ deletedAt: NOW, updatedAt: NOW });
    expect(await db.tasks.get(gone.id)).toMatchObject({ deletedAt: T2 });
    expect(await db.tasks.get(todo.id)).toEqual(todo);
  });

  it('tidak ada yang bisa dibersihkan → 0', async () => {
    await createTask(input(), T1);
    expect(await clearCompletedTasks(NOW)).toBe(0);
  });
});

describe('mapel dihapus (PRD §F4.4)', () => {
  it('deleteSubject tidak mengubah tugas yang menunjuk mapel itu', async () => {
    const t = await createTask(input({ subjectId: mtk.id }), T1);
    await deleteSubject(mtk.id, T2);
    expect(await db.tasks.get(t.id)).toEqual(t);
    expect((await listActiveTasks()).map((x) => x.id)).toEqual([t.id]);
  });
});
