import { isNightForTheme, toPrayerConfig } from '$lib/domain/prayer';
import { resolveTheme } from '$lib/domain/settings';
import type { ThemePreference } from '$lib/domain/types';
import { now } from './now.svelte';
import { settings } from './settings.svelte';

/**
 * Salinan tema terakhir untuk skrip kecil di app.html, agar tema gelap terpasang
 * sebelum IndexedDB terbaca (mencegah kedipan terang). Sumber kebenaran tetap Settings.
 * Hanya pilihan eksplisit terang/gelap yang disalin; mode "ikuti waktu sholat" berubah
 * menurut jam, jadi tidak disalin agar tidak membuka app siang hari dalam keadaan gelap.
 */
export const THEME_CACHE_KEY = 'kala:theme';

function apply(theme: 'light' | 'dark' | null, preference: ThemePreference) {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
  try {
    if (preference === 'light' || preference === 'dark') localStorage.setItem(THEME_CACHE_KEY, preference);
    else localStorage.removeItem(THEME_CACHE_KEY);
  } catch {
    // localStorage bisa diblokir (mode privat); tema tetap terpasang.
  }
}

class ThemeStore {
  preference: ThemePreference = $derived(settings.current?.theme ?? 'system');
  /** Malam (Isya–Subuh) di lokasi tersimpan; undefined jika lokasi belum ada. */
  night = $derived.by(() => {
    const config = settings.current ? toPrayerConfig(settings.current) : null;
    return config ? isNightForTheme(now.current, config) : undefined;
  });
  /** Nilai `data-theme`; null = ikut sistem. */
  resolved = $derived(resolveTheme(this.preference, { night: this.night }));

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    return $effect.root(() => {
      $effect(() => {
        // Tunggu Settings terbaca agar cache dari app.html tidak dihapus terlalu dini.
        if (settings.current) apply(this.resolved, this.preference);
      });
    });
  }
}

export const theme = new ThemeStore();
