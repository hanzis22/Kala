import { resolveTheme } from '$lib/domain/settings';
import type { ThemePreference } from '$lib/domain/types';
import { settings } from './settings.svelte';

/**
 * Salinan tema terakhir untuk skrip kecil di app.html, agar tema gelap terpasang
 * sebelum IndexedDB terbaca (mencegah kedipan terang). Sumber kebenaran tetap Settings.
 */
export const THEME_CACHE_KEY = 'kala:theme';

function apply(theme: 'light' | 'dark' | null) {
  const root = document.documentElement;
  if (theme) root.dataset.theme = theme;
  else delete root.dataset.theme;
  try {
    if (theme) localStorage.setItem(THEME_CACHE_KEY, theme);
    else localStorage.removeItem(THEME_CACHE_KEY);
  } catch {
    // localStorage bisa diblokir (mode privat); tema tetap terpasang.
  }
}

class ThemeStore {
  preference: ThemePreference = $derived(settings.current?.theme ?? 'system');
  /** Nilai `data-theme`; null = ikut sistem. */
  resolved = $derived(resolveTheme(this.preference));

  /** Dipanggil sekali dari root layout. Mengembalikan fungsi pembersih. */
  start(): () => void {
    return $effect.root(() => {
      $effect(() => {
        // Tunggu Settings terbaca agar cache dari app.html tidak dihapus terlalu dini.
        if (settings.current) apply(this.resolved);
      });
    });
  }
}

export const theme = new ThemeStore();
