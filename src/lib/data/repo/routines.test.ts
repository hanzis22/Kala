import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/data/db';
import type { RoutineInput } from '$lib/domain/routines';
import type { Subject } from '$lib/domain/types';
import {
  clearOverride,
  createClassRoutine,
  createRoutine,
  deleteRoutine,
  editFromDate,
  endFromDate,
  listActiveRoutines,
  listClassRoutines,
  moveOccurrence,
  restoreOccurrence,
  skipOccurrence,
  updateClassRoutine,
  updateRoutine
} from './routines';
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
  mtk = await createSubject({ name: 'Matematika', abbr: null, teacher: null, room: '7B' }, T1);
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

// ---------- F5 ----------

const lesInput = (patch: Partial<RoutineInput> = {}): RoutineInput => ({
  title: '  Les   Inggris ',
  spec: { freq: 'weekly', interval: 2, days: ['TU'] },
  startTime: '16:00',
  durationMin: 90,
  dtstart: '2026-10-19',
  until: null,
  location: null,
  ...patch
});

const fromDateRoutine = (patch: Partial<RoutineInput> = {}) => {
  const routine: Partial<RoutineInput> = lesInput(patch);
  delete routine.dtstart;
  return { kind: 'routine' as const, routine: routine as Omit<RoutineInput, 'dtstart'> };
};

const counts = async () => ({
  routines: await db.routines.count(),
  completions: await db.completions.count()
});

async function tick(routineId: string, date: string) {
  await db.completions.put({ id: `${routineId}:${date}`, routineId, date, at: T1 });
}

describe('createRoutine / updateRoutine / listActiveRoutines', () => {
  beforeEach(() => db.completions.clear());

  it('rutin umum dengan RRULE kanonik dan judul dirapikan', async () => {
    const r = await createRoutine(lesInput(), T1);
    expect(r).toMatchObject({
      kind: 'routine',
      title: 'Les Inggris',
      subjectId: null,
      rrule: 'FREQ=WEEKLY;INTERVAL=2;BYDAY=TU',
      dtstart: '2026-10-19',
      until: null,
      createdAt: T1,
      updatedAt: T1,
      deletedAt: null
    });
    expect(await db.routines.get(r.id)).toEqual(r);
  });

  it('menolak input tidak valid', async () => {
    await expect(createRoutine(lesInput({ title: ' ' }), T1)).rejects.toMatchObject({
      code: 'title-required'
    });
    await expect(createRoutine(lesInput({ until: '2026-10-01' }), T1)).rejects.toMatchObject({
      code: 'until-before-start'
    });
    expect(await db.routines.count()).toBe(0);
  });

  it('ubah seri penuh mempertahankan exdates; kelas tidak bisa diubah lewat updateRoutine', async () => {
    const r = await createRoutine(lesInput(), T1);
    await db.routines.update(r.id, { exdates: ['2026-11-03'] });
    const next = await updateRoutine(
      r.id,
      lesInput({ title: 'Les', spec: { freq: 'daily', interval: 1 } }),
      T2
    );
    expect(next).toMatchObject({ title: 'Les', rrule: 'FREQ=DAILY', exdates: ['2026-11-03'], updatedAt: T2 });
    const kelas = await createClassRoutine(session(), '2026-10-19', T1);
    await expect(updateRoutine(kelas.id, lesInput(), T2)).rejects.toMatchObject({ code: 'not-found' });
  });

  it('listActiveRoutines memuat semua jenis yang aktif', async () => {
    const r = await createRoutine(lesInput(), T1);
    const kelas = await createClassRoutine(session(), '2026-10-19', T1);
    const gone = await createRoutine(lesInput({ title: 'Lama' }), T1);
    await deleteRoutine(gone.id, T2);
    expect((await listActiveRoutines()).map((x) => x.id).sort()).toEqual([r.id, kelas.id].sort());
  });
});

describe('edit per tanggal', () => {
  beforeEach(() => db.completions.clear());

  it('skip lalu restore', async () => {
    const r = await createRoutine(lesInput(), T1);
    expect((await skipOccurrence(r.id, '2026-11-03', T2)).exdates).toEqual(['2026-11-03']);
    const restored = await restoreOccurrence(r.id, '2026-11-03', T2);
    expect(restored).toMatchObject({ exdates: [], updatedAt: T2 });
  });

  it('move lalu clear; kelas juga bisa', async () => {
    const r = await createRoutine(lesInput(), T1);
    const moved = await moveOccurrence(r.id, '2026-11-17', { startTime: '18:00', durationMin: 90 }, T2);
    expect(moved.overrides).toEqual({ '2026-11-17': { startTime: '18:00', durationMin: 90 } });
    expect((await clearOverride(r.id, '2026-11-17', T2)).overrides).toEqual({});
    const kelas = await createClassRoutine(session(), '2026-10-19', T1);
    const k = await moveOccurrence(kelas.id, '2026-10-19', { startTime: '09:00', durationMin: 90 }, T2);
    expect(k.overrides['2026-10-19']).toEqual({ startTime: '09:00', durationMin: 90 });
  });

  it('move yang melewati 24.00 ditolak; tanggal bukan kejadian ditolak', async () => {
    const r = await createRoutine(lesInput(), T1);
    await expect(
      moveOccurrence(r.id, '2026-11-17', { startTime: '23:00', durationMin: 90 }, T2)
    ).rejects.toMatchObject({ code: 'past-midnight' });
    await expect(skipOccurrence(r.id, '2026-10-27', T2)).rejects.toMatchObject({ code: 'not-occurrence' });
    expect((await db.routines.get(r.id))?.updatedAt).toBe(T1);
  });

  it('kegiatan sekali (event) ditolak', async () => {
    const r = await createRoutine(lesInput(), T1);
    await db.routines.add({ ...r, id: 'rapat', kind: 'event', rrule: null });
    await expect(skipOccurrence('rapat', '2026-10-19', T2)).rejects.toMatchObject({ code: 'not-found' });
    await expect(endFromDate('rapat', '2026-10-19', T2)).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('editFromDate', () => {
  beforeEach(() => db.completions.clear());

  it('split: centang ≥ tanggal pindah ke ID baru, centang < tanggal tetap', async () => {
    const r = await createRoutine(lesInput(), T1);
    await tick(r.id, '2026-11-17');
    await tick(r.id, '2026-12-01');
    await tick(r.id, '2026-12-15');

    const { old, next } = await editFromDate(r.id, '2026-12-01', fromDateRoutine({ startTime: '17:00' }), T2);
    expect(old).toMatchObject({ id: r.id, until: '2026-11-30', startTime: '16:00' });
    expect(next).toMatchObject({ dtstart: '2026-12-01', startTime: '17:00', title: 'Les Inggris' });

    const all = await db.completions.toArray();
    expect(all.map((c) => c.id).sort()).toEqual(
      [`${r.id}:2026-11-17`, `${next!.id}:2026-12-01`, `${next!.id}:2026-12-15`].sort()
    );
    expect(all.find((c) => c.date === '2026-12-15')?.routineId).toBe(next!.id);
    expect(await db.routines.count()).toBe(2);
  });

  it('rollback: validasi gagal tidak mengubah jumlah routines dan completions', async () => {
    const r = await createRoutine(lesInput(), T1);
    await tick(r.id, '2026-12-01');
    const before = await counts();

    await expect(editFromDate(r.id, '2026-12-01', fromDateRoutine({ title: '' }), T2)).rejects.toMatchObject({
      code: 'title-required'
    });
    await expect(
      editFromDate(r.id, '2026-12-08', fromDateRoutine({ startTime: '17:00' }), T2)
    ).rejects.toMatchObject({ code: 'not-occurrence' });
    await expect(
      editFromDate(r.id, '2026-12-01', fromDateRoutine({ until: '2026-11-01' }), T2)
    ).rejects.toMatchObject({ code: 'until-before-start' });

    expect(await counts()).toEqual(before);
    expect(await db.routines.get(r.id)).toMatchObject({ until: null, updatedAt: T1 });
    expect((await db.completions.toArray())[0].routineId).toBe(r.id);
  });

  it('di kejadian pertama: tidak membuat rutin baru, centang tetap', async () => {
    const r = await createRoutine(lesInput(), T1);
    await tick(r.id, '2026-10-20');
    const { old, next } = await editFromDate(r.id, '2026-10-20', fromDateRoutine({ startTime: '17:00' }), T2);
    expect(next).toBeNull();
    expect(old).toMatchObject({ id: r.id, dtstart: '2026-10-20', startTime: '17:00' });
    expect(await listActiveRoutines()).toHaveLength(1);
    expect((await db.completions.toArray())[0].id).toBe(`${r.id}:2026-10-20`);
  });

  it('kelas: validasi sesi dan mapel aktif; kejadian pertama tidak menyisakan entri', async () => {
    const kelas = await createClassRoutine(session({ days: ['MO', 'WE'] }), '2026-10-19', T1);
    const before = await counts();
    await expect(
      editFromDate(kelas.id, '2026-10-21', { kind: 'class', session: session({ subjectId: 'hilang' }) }, T2)
    ).rejects.toMatchObject({ code: 'subject-required' });
    expect(await counts()).toEqual(before);

    const split = await editFromDate(
      kelas.id,
      '2026-10-21',
      { kind: 'class', session: session({ startTime: '08:00' }) },
      T2
    );
    expect(split.next).toMatchObject({ kind: 'class', subjectId: mtk.id, startTime: '08:00', title: '' });

    const tue = await createClassRoutine(session({ days: ['TU', 'TH'] }), '2026-10-19', T1);
    const first = await editFromDate(
      tue.id,
      '2026-10-20',
      { kind: 'class', session: session({ days: ['TU'] }) },
      T2
    );
    expect(first.next).toBeNull();
    expect(first.old).toMatchObject({ dtstart: '2026-10-20', rrule: 'FREQ=WEEKLY;BYDAY=TU' });
    // Hanya seri lama Senin & Rabu (hasil split di atas) yang punya until.
    expect((await listActiveRoutines()).filter((x) => x.until !== null).map((x) => x.id)).toEqual([kelas.id]);
  });

  it('jenis yang tidak cocok ditolak', async () => {
    const r = await createRoutine(lesInput(), T1);
    await expect(
      editFromDate(r.id, '2026-12-01', { kind: 'class', session: session() }, T2)
    ).rejects.toMatchObject({ code: 'not-found' });
  });
});

describe('endFromDate', () => {
  beforeEach(() => db.completions.clear());

  it('tengah seri: until = tanggal−1; centang dibiarkan', async () => {
    const r = await createRoutine(lesInput(), T1);
    await tick(r.id, '2026-12-15');
    const t = await endFromDate(r.id, '2026-12-01', T2);
    expect(t).toMatchObject({ until: '2026-11-30', deletedAt: null, updatedAt: T2 });
    expect(await db.completions.count()).toBe(1);
  });

  it('kejadian pertama: soft delete seluruh seri, tidak tersisa di listActiveRoutines', async () => {
    const r = await createRoutine(lesInput(), T1);
    const t = await endFromDate(r.id, '2026-10-20', T2);
    expect(t).toMatchObject({ deletedAt: T2, updatedAt: T2 });
    expect(await listActiveRoutines()).toHaveLength(0);
  });

  it('tanggal bukan kejadian ditolak tanpa menulis', async () => {
    const r = await createRoutine(lesInput(), T1);
    await expect(endFromDate(r.id, '2026-10-27', T2)).rejects.toMatchObject({ code: 'not-occurrence' });
    expect(await db.routines.get(r.id)).toMatchObject({ until: null, updatedAt: T1 });
  });
});
