import { msUntilNextMidnight, toLocalDate } from '$lib/domain/dates';
import type { LocalDate } from '$lib/domain/types';

/**
 * "Hari ini" yang reaktif (PRD §7.1). Berganti saat 00.00 lewat timer dan saat
 * tab kembali terlihat (`visibilitychange`), karena timer bisa tertunda saat HP tidur.
 * Satu-satunya sumber "hari ini" di app.
 */
class TodayStore {
  #date = $state<LocalDate | null>(null);

  get current(): LocalDate {
    return this.#date ?? toLocalDate(new Date());
  }

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const refresh = () => {
      const now = new Date();
      this.#date = toLocalDate(now);
      clearTimeout(timer);
      // +50 ms agar timer pasti jatuh setelah 00.00, bukan sesaat sebelumnya.
      timer = setTimeout(refresh, msUntilNextMidnight(now) + 50);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    refresh();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }
}

export const today = new TodayStore();
