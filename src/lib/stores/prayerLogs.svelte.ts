import { liveQuery } from 'dexie';
import { prayerLogsBetween } from '$lib/data/repo/prayerLogs';
import { addDays } from '$lib/domain/dates';
import type { PrayerLog } from '$lib/domain/types';
import { today } from './today.svelte';

/**
 * Catatan sholat 7 hari terakhir sampai hari ini (cukup untuk grid konsistensi dan hari ini/kemarin),
 * lewat liveQuery sehingga ikut berubah saat dicatat atau dari tab lain.
 */
class PrayerLogsStore {
  items = $state<PrayerLog[]>([]);
  loaded = $state(false);

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    return $effect.root(() => {
      $effect(() => {
        const to = today.current;
        const from = addDays(to, -6);
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
