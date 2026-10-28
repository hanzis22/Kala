import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/data/db';
import { getDayEntry, setPriorities } from './dayEntries';

const T1 = '2026-10-26T01:00:00.000Z';
const T2 = '2026-10-26T02:00:00.000Z';
const D = '2026-10-26';

beforeEach(async () => {
  await db.dayEntries.clear();
});

describe('setPriorities', () => {
  it('U43 membuat entri baru dengan updatedAt', async () => {
    const entry = await setPriorities(D, [{ text: ' Latihan soal ', done: false }], T1);
    expect(entry).toEqual({
      date: D,
      priorities: [{ text: 'Latihan soal', done: false }],
      mood: null,
      note: null,
      gratitude: [],
      updatedAt: T1
    });
    expect(await getDayEntry(D)).toEqual(entry);
  });

  it('U43 update hanya mengganti priorities; mood/note/gratitude utuh', async () => {
    await db.dayEntries.put({
      date: D,
      priorities: [{ text: 'Lama', done: true }],
      mood: 'tenang',
      note: 'Catatan',
      gratitude: ['Keluarga'],
      updatedAt: T1
    });
    await setPriorities(D, [{ text: 'Baru', done: false }], T2);
    expect(await getDayEntry(D)).toEqual({
      date: D,
      priorities: [{ text: 'Baru', done: false }],
      mood: 'tenang',
      note: 'Catatan',
      gratitude: ['Keluarga'],
      updatedAt: T2
    });
  });

  it('baris kosong dibuang tanpa celah, done ikut barisnya', async () => {
    const entry = await setPriorities(
      D,
      [
        { text: 'Satu', done: false },
        { text: '   ', done: true },
        { text: 'Tiga', done: true }
      ],
      T1
    );
    expect(entry.priorities).toEqual([
      { text: 'Satu', done: false },
      { text: 'Tiga', done: true }
    ]);
  });

  it('U44 galat validasi tidak menulis', async () => {
    const four = ['a', 'b', 'c', 'd'].map((text) => ({ text, done: false }));
    await expect(setPriorities(D, four, T1)).rejects.toMatchObject({
      name: 'ValidationError',
      code: 'too-many'
    });
    await expect(setPriorities(D, [{ text: 'x'.repeat(81), done: false }], T1)).rejects.toMatchObject({
      code: 'too-long'
    });
    expect(await db.dayEntries.count()).toBe(0);

    await setPriorities(D, [{ text: 'Ada', done: false }], T1);
    await expect(setPriorities(D, four, T2)).rejects.toMatchObject({ code: 'too-many' });
    expect(await getDayEntry(D)).toMatchObject({ priorities: [{ text: 'Ada', done: false }], updatedAt: T1 });
  });
});
