import { liveQuery } from 'dexie';
import { prayerLogsBetween } from '$lib/data/repo/prayerLogs';
import { addDays } from '$lib/domain/dates';
import type { PrayerLog } from '$lib/domain/types';
import { today } from './today.svelte';

/**
 * Catatan sholat [hari ini − 6, hari ini + 1]: grid konsistensi, hari ini/kemarin, dan besok untuk sholat
 * bertanggal lokasi D+1 yang tampil di agenda perangkat D (perangkat di belakang zona lokasi, rencana F2 §2).
 * Pemakai menyaring per tanggal. Lewat liveQuery sehingga ikut berubah saat dicatat atau dari tab lain.
 */
class PrayerLogsStore {
  items = $state<PrayerLog[]>([]);
  loaded = $state(false);

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    return $effect.root(() => {
      $effect(() => {
        const from = addDays(today.current, -6);
        const to = addDays(today.current, 1);
        const sub = liveQuery(() => prayerLogsBetween(from, to)).subscribe({
          next: (logs) => {
            this.items = logs;
            this.loaded = true;
          },
          error: (err: unknown) => console.error('[prayerLogs] liveQuery gagal', err)
        });
        return () => sub.unsubscribe();
      });
    });
  }
}

export const prayerLogs = new PrayerLogsStore();
