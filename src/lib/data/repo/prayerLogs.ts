import { db } from '$lib/data/db';
import { prayerLogId } from '$lib/domain/prayer';
import type { IsoDateTime, LocalDate, PrayerLog, PrayerName } from '$lib/domain/types';

/**
 * Catatan sholat. ID deterministik `date:prayer` → upsert, tidak pernah duplikat.
 * PrayerLog tidak punya deletedAt (bukan entitas yang bisa diedit), jadi membatalkan = menghapus.
 * Validasi kapan boleh mencatat ada di domain (`canLogPrayer`), dipanggil UI sebelum menulis.
 */
export async function logPrayer(date: LocalDate, prayer: PrayerName, now: IsoDateTime): Promise<PrayerLog> {
  return db.transaction('rw', db.prayerLogs, async () => {
    const id = prayerLogId(date, prayer);
    const existing = await db.prayerLogs.get(id);
    if (existing) return existing;
    const entry: PrayerLog = { id, date, prayer, congregation: false, at: now };
    await db.prayerLogs.put(entry);
    return entry;
  });
}

export async function removePrayerLog(date: LocalDate, prayer: PrayerName): Promise<void> {
  await db.prayerLogs.delete(prayerLogId(date, prayer));
}

/**
 * Urungkan hapus: memulihkan snapshot apa adanya (at + congregation). Hanya jika belum ada catatan dengan
 * id itu; jika sudah dicatat ulang → false tanpa menimpa. Sengaja tanpa `canLogPrayer`: memulihkan
 * bukan mencatat baru, jadi tidak tunduk pada batas waktu §F3.4 (Usulan F2 #2).
 */
export async function restorePrayerLog(snapshot: PrayerLog): Promise<boolean> {
  return db.transaction('rw', db.prayerLogs, async () => {
    if (await db.prayerLogs.get(snapshot.id)) return false;
    await db.prayerLogs.put({ ...snapshot });
    return true;
  });
}

/** Mengubah status berjamaah pada catatan yang sudah ada. Tanpa catatan = tidak ada yang diubah. */
export async function setCongregation(
  date: LocalDate,
  prayer: PrayerName,
  congregation: boolean
): Promise<void> {
  await db.prayerLogs.update(prayerLogId(date, prayer), { congregation });
}

/** Semua catatan dengan tanggal dalam [from, to] (inklusif). */
export function prayerLogsBetween(from: LocalDate, to: LocalDate): Promise<PrayerLog[]> {
  return db.prayerLogs.where('date').between(from, to, true, true).toArray();
}
