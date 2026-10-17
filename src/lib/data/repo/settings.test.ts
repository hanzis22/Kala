import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '$lib/data/db';
import { defaultSettings } from '$lib/domain/settings';
import { completeOnboarding, ensureSettings, updateSettings } from './settings';

beforeEach(async () => {
  await db.settings.clear();
});

describe('ensureSettings', () => {
  it('membuat nilai default saat pertama kali', async () => {
    const s = await ensureSettings();
    expect(s).toEqual(defaultSettings());
    expect(await db.settings.get('app')).toEqual(defaultSettings());
  });

  it('tidak menimpa Settings yang sudah ada', async () => {
    await db.settings.put({ ...defaultSettings(), userName: 'Rani' });
    const s = await ensureSettings();
    expect(s.userName).toBe('Rani');
    expect(await db.settings.count()).toBe(1);
  });
});

describe('updateSettings', () => {
  it('menggabungkan patch dan mempertahankan kunci singleton', async () => {
    await ensureSettings();
    const s = await updateSettings({ theme: 'dark', hijriOffsetDays: 1 });
    expect(s.theme).toBe('dark');
    expect(s.hijriOffsetDays).toBe(1);
    expect(s.backupReminder).toBe(true);
    expect((await db.settings.get('app'))?.theme).toBe('dark');
  });

  it('membuat default dulu jika belum ada', async () => {
    const s = await updateSettings({ userName: 'Bima' });
    expect(s.userName).toBe('Bima');
    expect(s.prayer.ihtiyatMin).toBe(2);
  });
});

describe('completeOnboarding', () => {
  it('mengisi onboardedAt', async () => {
    const at = '2026-10-17T03:40:00.000Z';
    await completeOnboarding(at);
    expect((await db.settings.get('app'))?.onboardedAt).toBe(at);
  });
});
