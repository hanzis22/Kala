import { liveQuery } from 'dexie';
import { db } from '$lib/data/db';
import { ensureSettings } from '$lib/data/repo/settings';
import type { Settings } from '$lib/domain/types';

/**
 * Settings dari IndexedDB lewat liveQuery, sehingga perubahan dari tab lain ikut
 * tampil (PRD §7.9). `current` undefined sampai baca pertama selesai.
 */
class SettingsStore {
  current = $state<Settings | undefined>(undefined);

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    let unsubscribe = () => {};
    let stopped = false;

    ensureSettings()
      .then((initial) => {
        if (stopped) return;
        this.current = initial;
        const sub = liveQuery(() => db.settings.get('app')).subscribe({
          next: (value) => {
            if (value) this.current = value;
          },
          error: (err: unknown) => console.error('[settings] liveQuery gagal', err)
        });
        unsubscribe = () => sub.unsubscribe();
      })
      .catch((err: unknown) => console.error('[settings] gagal membaca', err));

    return () => {
      stopped = true;
      unsubscribe();
    };
  }
}

export const settings = new SettingsStore();
