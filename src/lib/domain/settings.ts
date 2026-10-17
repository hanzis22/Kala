import type { Settings, ThemePreference } from './types';

/** Versi skema data yang ditulis ke Settings (sama dengan versi Dexie terbaru). */
export const SCHEMA_VERSION = 1;

/** Nilai Settings saat app pertama kali dibuka. */
export function defaultSettings(): Settings {
  return {
    key: 'app',
    schemaVersion: SCHEMA_VERSION,
    userName: '',
    location: null,
    prayer: {
      method: 'kemenag',
      ihtiyatMin: 2,
      adjustMin: { subuh: 0, dzuhur: 0, ashar: 0, maghrib: 0, isya: 0 }
    },
    hijriOffsetDays: 0,
    theme: 'system',
    weekStartsOn: 1,
    showSundayInTimetable: false,
    onboardedAt: null,
    installPromptDismissedAt: null,
    lastExportAt: null,
    backupReminder: true
  };
}

/**
 * Nilai atribut `data-theme` di <html>. `null` = tanpa atribut, CSS mengikuti
 * `prefers-color-scheme` (lihat app.css).
 *
 * Mode 'prayer' (gelap dari Isya sampai Subuh) butuh jadwal sholat dari F3.
 * Sampai F3 selesai, mode ini berperilaku seperti 'system'.
 */
export function resolveTheme(preference: ThemePreference): 'light' | 'dark' | null {
  switch (preference) {
    case 'light':
    case 'dark':
      return preference;
    case 'system':
    case 'prayer':
      return null;
  }
}
