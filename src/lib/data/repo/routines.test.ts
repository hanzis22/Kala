import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/data/db';
import type { Subject } from '$lib/domain/types';
import { createClassRoutine, deleteRoutine, listClassRoutines, updateClassRoutine } from './routines';
import { createSubject, deleteSubject } from './subjects';

const T1 = '2026-10-19T01:00:00.000Z';
const T2 = '2026-10-19T02:00:00.000Z';

let mtk: Subject;

const session = (patch: Partial<Parameters<typeof createClassRoutine>[0]> = {}) => ({
  subjectId: mtk.id,
  days: ['WE' as const, 'MO' as const],
  startTime: '07:00',
  durationMin: 90,
  location: '  Lab  IPA ',
  ...patch
});

beforeEach(async () => {
  await Promise.all([db.subjects.clear(), db.routines.clear()]);
  mtk = await createSubject({ name: 'Matematika', teacher: null, room: '7B' }, T1);
});

describe('createClassRoutine', () => {
  it('satu Routine kind class dengan RRULE mingguan', async () => {
    const r = await createClassRoutine(session(), '2026-10-19', T1);
    expect(r).toMatchObject({
      kind: 'class',
      title: '',
      subjectId: mtk.id,
      startTime: '07:00',
      durationMin: 90,
      rrule: 'FREQ=WEEKLY;BYDAY=MO,WE',
      dtstart: '2026-10-19',
      until: null,
      exdates: [],
      overrides: {},
      location: 'Lab IPA',
      createdAt: T1,
      updatedAt: T1,
      deletedAt: null
    });
    expect(await db.routines.get(r.id)).toEqual(r);
  });

  it('ruang kosong disimpan sebagai null', async () => {
    expect((await createClassRoutine(session({ location: '  ' }), '2026-10-19', T1)).location).toBeNull();
  });

  it('menolak slot yang melewati 24.00, hari kosong, dan mapel terhapus', async () => {
    await expect(
      createClassRoutine(session({ startTime: '23:00', durationMin: 90 }), '2026-10-19', T1)
    ).rejects.toMatchObject({ code: 'past-midnight' });
    await expect(createClassRoutine(session({ days: [] }), '2026-10-19', T1)).rejects.toMatchObject({
      code: 'days-required'
    });
    await deleteSubject(mtk.id, T2);
    await expect(createClassRoutine(session(), '2026-10-19', T1)).rejects.toMatchObject({
      code: 'subject-required'
    });
    expect(await db.routines.count()).toBe(0);
  });

  it('menolak dtstart tidak valid', async () => {
    await expect(createClassRoutine(session(), '2026-02-30', T1)).rejects.toMatchObject({
      code: 'invalid-dtstart'
    });
  });
});

describe('updateClassRoutine', () => {
  it('mengubah seri; dtstart, exdates, overrides, createdAt tetap', async () => {
    const r = await createClassRoutine(session(), '2026-10-19', T1);
    await db.routines.update(r.id, {
      exdates: ['2026-10-21'],
      overrides: { '2026-10-26': { startTime: '08:00' } }
    });

    const next = await updateClassRoutine(
      r.id,
      session({ days: ['FR'], startTime: '09:00', durationMin: 45 }),
      T2
    );
    expect(next).toMatchObject({
      rrule: 'FREQ=WEEKLY;BYDAY=FR',
      startTime: '09:00',
      durationMin: 45,
      dtstart: '2026-10-19',
      exdates: ['2026-10-21'],
      overrides: { '2026-10-26': { startTime: '08:00' } },
      createdAt: T1,
      updatedAt: T2
    });
  });

  it('menolak rutin yang sudah dihapus', async () => {
    const r = await createClassRoutine(session(), '2026-10-19', T1);
    await deleteRoutine(r.id, T2);
    await expect(updateClassRoutine(r.id, session(), T2)).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('deleteRoutine / listClassRoutines', () => {
  it('soft delete; daftar hanya berisi sesi kelas aktif', async () => {
    const a = await createClassRoutine(session(), '2026-10-19', T1);
    const b = await createClassRoutine(session({ days: ['TU'] }), '2026-10-19', T1);
    await db.routines.add({ ...a, id: 'rutin-umum', kind: 'routine', subjectId: null });

    await deleteRoutine(a.id, T2);
    await deleteRoutine(a.id, T2);

    expect((await listClassRoutines()).map((r) => r.id)).toEqual([b.id]);
    expect(await db.routines.get(a.id)).toMatchObject({ deletedAt: T2, updatedAt: T2 });
  });
});
