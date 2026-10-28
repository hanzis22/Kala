const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Jam sekarang yang reaktif, diperbarui setiap pergantian menit dan saat tab kembali terlihat.
 * Dipakai untuk status sholat dan hitung mundur. Komponen tidak memanggil `new Date()` sendiri.
 */
class NowStore {
  #now = $state<Date | null>(null);
  #timeZone = $state<string | null>(null);

  get current(): Date {
    return this.#now ?? new Date();
  }

  /** Zona IANA perangkat (bisa berubah saat bepergian). Satu-satunya tempat Intl dibaca. */
  get timeZone(): string {
    return this.#timeZone ?? deviceTimeZone();
  }

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      const now = new Date();
      this.#now = now;
      this.#timeZone = deviceTimeZone();
      clearTimeout(timer);
      // Jatuh tepat setelah detik ke-0 menit berikutnya.
      timer = setTimeout(tick, 60_000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') tick();
    };

    tick();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }
}

export const now = new NowStore();
