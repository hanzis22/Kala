import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/data/db';
import type { Routine } from '$lib/domain/types';
import { completionsOn, setCompletion } from './completions';
import { createRoutine, deleteRoutine, skipOccurrence } from './routines';

const T1 = '2026-10-20T01:00:00.000Z';
const T2 = '2026-10-20T02:00:00.000Z';

// Selasa mingguan mulai Senin 19 Okt 2026: kejadian 20 dan 27 Okt.
let les: Routine;

beforeEach(async () => {
  await Promise.all([db.routines.clear(), db.completions.clear()]);
  les = await createRoutine(
    {
      title: 'Les Inggris',
      spec: { freq: 'weekly', interval: 1, days: ['TU'] },
      startTime: '16:00',
      durationMin: 90,
      dtstart: '2026-10-19',
      until: null,
      location: null
    },
    T1
  );
});

describe('setCompletion', () => {
  it('U40 centang → satu record ID deterministik; centang ulang mempertahankan at pertama', async () => {
    await setCompletion(les.id, '2026-10-20', true, T1);
    await setCompletion(les.id, '2026-10-20', true, T2);
    expect(await db.completions.toArray()).toEqual([
      { id: `${les.id}:2026-10-20`, routineId: les.id, date: '2026-10-20', at: T1 }
    ]);
  });

  it('U41 batal centang menghapus; batal tanpa record = no-op', async () => {
    await setCompletion(les.id, '2026-10-20', true, T1);
    await setCompletion(les.id, '2026-10-20', false, T2);
    expect(await db.completions.count()).toBe(0);
    await setCompletion(les.id, '2026-10-27', false, T2);
    expect(await db.completions.count()).toBe(0);
  });

  it('U42 tanggal bukan kejadian → not-occurrence', async () => {
    await expect(setCompletion(les.id, '2026-10-21', true, T1)).rejects.toMatchObject({
      name: 'ValidationError',
      code: 'not-occurrence'
    });
    await expect(setCompletion(les.id, '2026-10-21', false, T1)).rejects.toMatchObject({
      code: 'not-occurrence'
    });
    expect(await db.completions.count()).toBe(0);
  });

  it('U42 tanggal yang dilewati (exdates) → not-occurrence', async () => {
    await skipOccurrence(les.id, '2026-10-27', T2);
    await expect(setCompletion(les.id, '2026-10-27', true, T2)).rejects.toMatchObject({
      code: 'not-occurrence'
    });
    expect(await db.completions.count()).toBe(0);
  });

  it('U42 pola tidak didukung → not-occurrence', async () => {
    await db.routines.update(les.id, { rrule: 'FREQ=YEARLY;BYMONTH=10' });
    await expect(setCompletion(les.id, '2026-10-20', true, T1)).rejects.toMatchObject({
      code: 'not-occurrence'
    });
  });

  it('U42 rutin terhapus atau tidak ada → not-found', async () => {
    await expect(setCompletion('tidak-ada', '2026-10-20', true, T1)).rejects.toMatchObject({
      code: 'not-found'
    });
    await deleteRoutine(les.id, T2);
    await expect(setCompletion(les.id, '2026-10-20', true, T2)).rejects.toMatchObject({
      code: 'not-found'
    });
    expect(await db.completions.count()).toBe(0);
  });

  it('tidak menolak tanggal selain hari ini (UI yang membatasi)', async () => {
    await setCompletion(les.id, '2026-10-27', true, T1);
    expect(await db.completions.count()).toBe(1);
  });
});

describe('completionsOn', () => {
  it('hanya centang bertanggal itu', async () => {
    await setCompletion(les.id, '2026-10-20', true, T1);
    await setCompletion(les.id, '2026-10-27', true, T1);
    expect((await completionsOn('2026-10-27')).map((c) => c.id)).toEqual([`${les.id}:2026-10-27`]);
  });
});
