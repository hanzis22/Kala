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
 * Mode 'prayer' (PRD §F8.4): gelap dari Isya sampai Subuh (`night`, dihitung dari jadwal sholat
 * lokasi), selain itu mengikuti sistem. Tanpa lokasi (`night` tidak diketahui) = mengikuti sistem.
 */
export function resolveTheme(
  preference: ThemePreference,
  context: { night?: boolean } = {}
): 'light' | 'dark' | null {
  switch (preference) {
    case 'light':
    case 'dark':
      return preference;
    case 'system':
      return null;
    case 'prayer':
      return context.night ? 'dark' : null;
  }
}
