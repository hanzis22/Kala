import { db } from '$lib/data/db';
import { defaultSettings } from '$lib/domain/settings';
import type { IsoDateTime, Settings } from '$lib/domain/types';

export type SettingsPatch = Partial<Omit<Settings, 'key'>>;

/** Membaca Settings; membuat nilai default jika belum ada (pertama kali app dibuka). */
export async function ensureSettings(): Promise<Settings> {
  return db.transaction('rw', db.settings, async () => {
    const existing = await db.settings.get('app');
    if (existing) return existing;
    const fresh = defaultSettings();
    await db.settings.add(fresh);
    return fresh;
  });
}

export async function updateSettings(patch: SettingsPatch): Promise<Settings> {
  return db.transaction('rw', db.settings, async () => {
    const current = await ensureSettings();
    const next: Settings = { ...current, ...patch, key: 'app' };
    await db.settings.put(next);
    return next;
  });
}

export async function completeOnboarding(now: IsoDateTime): Promise<Settings> {
  return updateSettings({ onboardedAt: now });
}
