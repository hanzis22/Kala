import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/data/db';
import {
  logPrayer,
  prayerLogsBetween,
  removePrayerLog,
  restorePrayerLog,
  setCongregation
} from './prayerLogs';

const AT = '2026-10-17T05:00:00.000Z';

beforeEach(async () => {
  await db.prayerLogs.clear();
});

describe('logPrayer', () => {
  it('menyimpan dengan ID deterministik date:prayer', async () => {
    const entry = await logPrayer('2026-10-17', 'subuh', AT);
    expect(entry).toEqual({
      id: '2026-10-17:subuh',
      date: '2026-10-17',
      prayer: 'subuh',
      congregation: false,
      at: AT
    });
    expect(await db.prayerLogs.get('2026-10-17:subuh')).toEqual(entry);
  });

  it('mencatat dua kali tidak membuat duplikat dan tidak menimpa berjamaah', async () => {
    await logPrayer('2026-10-17', 'dzuhur', AT);
    await setCongregation('2026-10-17', 'dzuhur', true);
    await logPrayer('2026-10-17', 'dzuhur', '2026-10-17T06:00:00.000Z');
    expect(await db.prayerLogs.count()).toBe(1);
    expect((await db.prayerLogs.get('2026-10-17:dzuhur'))?.congregation).toBe(true);
  });
});

describe('removePrayerLog', () => {
  it('menghapus catatan; aman jika tidak ada', async () => {
    await logPrayer('2026-10-17', 'ashar', AT);
    await removePrayerLog('2026-10-17', 'ashar');
    await removePrayerLog('2026-10-17', 'ashar');
    expect(await db.prayerLogs.count()).toBe(0);
  });
});

describe('setCongregation', () => {
  it('mengubah status berjamaah', async () => {
    await logPrayer('2026-10-17', 'maghrib', AT);
    await setCongregation('2026-10-17', 'maghrib', true);
    expect((await db.prayerLogs.get('2026-10-17:maghrib'))?.congregation).toBe(true);
    await setCongregation('2026-10-17', 'maghrib', false);
    expect((await db.prayerLogs.get('2026-10-17:maghrib'))?.congregation).toBe(false);
  });

  it('tanpa catatan tidak membuat catatan baru', async () => {
    await setCongregation('2026-10-17', 'isya', true);
    expect(await db.prayerLogs.count()).toBe(0);
  });
});

describe('prayerLogsBetween', () => {
  it('rentang tanggal inklusif', async () => {
    await logPrayer('2026-10-10', 'subuh', AT);
    await logPrayer('2026-10-11', 'subuh', AT);
    await logPrayer('2026-10-17', 'isya', AT);
    await logPrayer('2026-10-18', 'subuh', AT);
    const logs = await prayerLogsBetween('2026-10-11', '2026-10-17');
    expect(logs.map((l) => l.id).sort()).toEqual(['2026-10-11:subuh', '2026-10-17:isya']);
  });
});

describe('restorePrayerLog', () => {
  it('U45 memulihkan snapshot apa adanya: at + congregation utuh', async () => {
    await logPrayer('2026-10-17', 'ashar', AT);
    await setCongregation('2026-10-17', 'ashar', true);
    const snapshot = await db.prayerLogs.get('2026-10-17:ashar');
    await removePrayerLog('2026-10-17', 'ashar');
    expect(await restorePrayerLog(snapshot!)).toBe(true);
    expect(await db.prayerLogs.get('2026-10-17:ashar')).toEqual({
      id: '2026-10-17:ashar',
      date: '2026-10-17',
      prayer: 'ashar',
      congregation: true,
      at: AT
    });
  });

  it('U46 sudah dicatat ulang → false tanpa menimpa', async () => {
    const snapshot = await logPrayer('2026-10-17', 'maghrib', AT);
    await removePrayerLog('2026-10-17', 'maghrib');
    const later = '2026-10-17T11:00:00.000Z';
    await logPrayer('2026-10-17', 'maghrib', later);
    expect(await restorePrayerLog({ ...snapshot, congregation: true })).toBe(false);
    expect(await db.prayerLogs.get('2026-10-17:maghrib')).toMatchObject({ at: later, congregation: false });
    expect(await db.prayerLogs.count()).toBe(1);
  });

  it('U47 snapshot 3 hari lalu (di luar batas §F3.4) tetap dipulihkan', async () => {
    // Tidak ada `now` sama sekali: restore tidak memakai canLogPrayer.
    const snapshot = await logPrayer('2026-10-14', 'isya', AT);
    await removePrayerLog('2026-10-14', 'isya');
    expect(await restorePrayerLog(snapshot)).toBe(true);
    expect(await db.prayerLogs.get('2026-10-14:isya')).toEqual(snapshot);
  });
});
