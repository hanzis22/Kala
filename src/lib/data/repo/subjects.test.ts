import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/data/db';
import { ValidationError } from './errors';
import { createClassRoutine, listClassRoutines } from './routines';
import { createSubject, deleteSubject, getSubject, listSubjects, updateSubject } from './subjects';

const T1 = '2026-10-19T01:00:00.000Z';
const T2 = '2026-10-19T02:00:00.000Z';

const input = (name: string, room: string | null = null) => ({ name, abbr: null, teacher: null, room });
const session = (subjectId: string) => ({
  subjectId,
  days: ['MO' as const, 'WE' as const],
  startTime: '07:00',
  durationMin: 90,
  location: null
});

beforeEach(async () => {
  await Promise.all([db.subjects.clear(), db.routines.clear()]);
});

describe('createSubject', () => {
  it('menyimpan input yang sudah dinormalisasi dengan timestamp', async () => {
    const s = await createSubject(
      { name: '  Matematika ', abbr: ' MTK ', teacher: ' Bu Sari ', room: '' },
      T1
    );
    expect(s).toMatchObject({
      name: 'Matematika',
      abbr: 'MTK',
      teacher: 'Bu Sari',
      room: null,
      createdAt: T1,
      updatedAt: T1,
      deletedAt: null
    });
    expect(s.id).toMatch(/^[0-9A-Z]{26}$/);
    expect(await getSubject(s.id)).toEqual(s);
  });

  it('menolak nama kosong dan duplikat', async () => {
    await createSubject(input('Matematika'), T1);
    await expect(createSubject(input('  '), T1)).rejects.toMatchObject({ code: 'name-required' });
    await expect(createSubject(input('matematika'), T1)).rejects.toBeInstanceOf(ValidationError);
    expect(await db.subjects.count()).toBe(1);
  });
});

describe('listSubjects', () => {
  it('hanya yang aktif, urut nama', async () => {
    await createSubject(input('Matematika'), T1);
    const fisika = await createSubject(input('Fisika'), T1);
    await createSubject(input('Biologi'), T1);
    await deleteSubject(fisika.id, T2);
    expect((await listSubjects()).map((s) => s.name)).toEqual(['Biologi', 'Matematika']);
  });
});

describe('data lama tanpa abbr (sebelum singkatan ditambahkan)', () => {
  // Bentuk record yang ditulis versi F4 awal: tidak ada field abbr sama sekali.
  const legacy = {
    id: '01JAAAAAAAAAAAAAAAAAAAAAAA',
    name: 'Matematika',
    teacher: null,
    room: '7B',
    createdAt: T1,
    updatedAt: T1,
    deletedAt: null
  };

  beforeEach(async () => {
    await db.table('subjects').add(legacy);
  });

  it('listSubjects dan getSubject membacanya dengan abbr null', async () => {
    expect(await listSubjects()).toEqual([{ ...legacy, abbr: null }]);
    expect(await getSubject(legacy.id)).toEqual({ ...legacy, abbr: null });
  });

  it('updateSubject bisa menambahkan singkatan', async () => {
    const next = await updateSubject(legacy.id, { ...input('Matematika', '7B'), abbr: 'MTK' }, T2);
    expect(next).toEqual({ ...legacy, abbr: 'MTK', updatedAt: T2 });
    expect(await getSubject(legacy.id)).toEqual(next);
  });

  it('updateSubject tanpa singkatan menyimpan abbr null secara eksplisit', async () => {
    await updateSubject(legacy.id, input('Matematika', '7B'), T2);
    expect(await db.subjects.get(legacy.id)).toHaveProperty('abbr', null);
  });
});

describe('updateSubject', () => {
  it('memperbarui isi dan updatedAt, createdAt tetap', async () => {
    const s = await createSubject(input('Mtk'), T1);
    const next = await updateSubject(s.id, input('Matematika', '7B'), T2);
    expect(next).toMatchObject({ name: 'Matematika', room: '7B', createdAt: T1, updatedAt: T2 });
    expect(await getSubject(s.id)).toEqual(next);
  });

  it('menolak mapel yang tidak ada atau sudah dihapus', async () => {
    const s = await createSubject(input('Mtk'), T1);
    await deleteSubject(s.id, T2);
    await expect(updateSubject(s.id, input('Lagi'), T2)).rejects.toMatchObject({ code: 'not-found' });
    await expect(updateSubject('tidak-ada', input('Lagi'), T2)).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('deleteSubject', () => {
  it('soft delete mapel beserta sesi kelasnya saja', async () => {
    const mtk = await createSubject(input('Matematika'), T1);
    const ipa = await createSubject(input('IPA'), T1);
    await createClassRoutine(session(mtk.id), '2026-10-19', T1);
    await createClassRoutine({ ...session(mtk.id), days: ['FR'] }, '2026-10-19', T1);
    const keep = await createClassRoutine(session(ipa.id), '2026-10-19', T1);

    expect(await deleteSubject(mtk.id, T2)).toBe(2);

    expect(await getSubject(mtk.id)).toMatchObject({ deletedAt: T2, updatedAt: T2 });
    expect((await listClassRoutines()).map((r) => r.id)).toEqual([keep.id]);
    // Tetap ada di database (soft delete), dengan updatedAt baru.
    const removed = await db.routines.where('subjectId').equals(mtk.id).toArray();
    expect(removed).toHaveLength(2);
    expect(removed.every((r) => r.deletedAt === T2 && r.updatedAt === T2)).toBe(true);
  });

  it('aman dipanggil dua kali', async () => {
    const s = await createSubject(input('Matematika'), T1);
    await deleteSubject(s.id, T1);
    expect(await deleteSubject(s.id, T2)).toBe(0);
    expect((await getSubject(s.id))?.deletedAt).toBe(T1);
  });
});
