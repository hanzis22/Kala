import { describe, expect, it } from 'vitest';
import { defaultSettings, resolveTheme, SCHEMA_VERSION } from './settings';

describe('defaultSettings', () => {
  it('berisi nilai default sesuai PRD', () => {
    const s = defaultSettings();
    expect(s.key).toBe('app');
    expect(s.schemaVersion).toBe(SCHEMA_VERSION);
    expect(s.userName).toBe('');
    expect(s.location).toBeNull();
    expect(s.prayer).toEqual({
      method: 'kemenag',
      ihtiyatMin: 2,
      adjustMin: { subuh: 0, dzuhur: 0, ashar: 0, maghrib: 0, isya: 0 }
    });
    expect(s.hijriOffsetDays).toBe(0);
    expect(s.theme).toBe('system');
    expect(s.weekStartsOn).toBe(1);
    expect(s.showSundayInTimetable).toBe(false);
    expect(s.onboardedAt).toBeNull();
    expect(s.installPromptDismissedAt).toBeNull();
  });

  it('pengingat backup aktif dan belum pernah ekspor (PRD §F9.5)', () => {
    const s = defaultSettings();
    expect(s.lastExportAt).toBeNull();
    expect(s.backupReminder).toBe(true);
  });

  it('mengembalikan objek baru setiap kali', () => {
    const a = defaultSettings();
    a.prayer.adjustMin.subuh = 5;
    expect(defaultSettings().prayer.adjustMin.subuh).toBe(0);
  });
});

describe('resolveTheme', () => {
  it('terang dan gelap memaksa atribut', () => {
    expect(resolveTheme('light')).toBe('light');
    expect(resolveTheme('dark')).toBe('dark');
  });

  it('sistem tidak memasang atribut', () => {
    expect(resolveTheme('system')).toBeNull();
  });

  it('mode waktu sholat: gelap saat malam (Isya–Subuh), selain itu ikut sistem', () => {
    expect(resolveTheme('prayer', { night: true })).toBe('dark');
    expect(resolveTheme('prayer', { night: false })).toBeNull();
  });

  it('mode waktu sholat tanpa lokasi (malam tidak diketahui) = ikut sistem', () => {
    expect(resolveTheme('prayer')).toBeNull();
  });

  it('pilihan terang/gelap/sistem tidak terpengaruh malam', () => {
    expect(resolveTheme('light', { night: true })).toBe('light');
    expect(resolveTheme('system', { night: true })).toBeNull();
  });
});
