import { liveQuery } from 'dexie';
import { completionsOn } from '$lib/data/repo/completions';
import { getDayEntry } from '$lib/data/repo/dayEntries';
import type { Completion, DayEntry, LocalDate } from '$lib/domain/types';
import { today } from './today.svelte';

/**
 * Centang rutin (Completion) dan DayEntry (3 prioritas) untuk hari ini, lewat liveQuery.
 * Berbeda dengan prayerLogs, isinya satu tanggal dan pemakainya tidak menyaring per tanggal. Karena itu,
 * saat tanggal berganti, data langsung dikosongkan (loaded = false) dan emisi dari query tanggal lama
 * diabaikan (Usulan F2 #22). `date` = tanggal data yang sedang dimuat.
 */
class DayStore {
  date = $state<LocalDate | null>(null);
  completions = $state<Completion[]>([]);
  entry = $state<DayEntry | null>(null);
  loaded = $state(false);

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    return $effect.root(() => {
      $effect(() => {
        const date = today.current;
        this.date = date;
        this.completions = [];
        this.entry = null;
        this.loaded = false;
        const sub = liveQuery(async () => ({
          completions: await completionsOn(date),
          entry: (await getDayEntry(date)) ?? null
        })).subscribe({
          next: (data) => {
            // Emisi terlambat dari query tanggal lama (tengah malam) tidak menimpa tanggal baru.
            if (date !== today.current) return;
            this.completions = data.completions;
            this.entry = data.entry;
            this.loaded = true;
          },
          error: (err: unknown) => console.error('[day] liveQuery gagal', err)
        });
        return () => sub.unsubscribe();
      });
    });
  }
}

export const day = new DayStore();
