import { expect, type Page } from '@playwright/test';

export const TABS = [
  { label: 'Hari Ini', path: '/' },
  { label: 'Jadwal', path: '/jadwal' },
  { label: 'Tugas', path: '/tugas' },
  { label: 'Ibadah', path: '/ibadah' },
  { label: 'Lainnya', path: '/lainnya' }
] as const;

export function nav(page: Page) {
  return page.getByRole('navigation', { name: 'Navigasi utama' });
}

/** Membuka app dan menyelesaikan onboarding placeholder. */
export async function completeOnboarding(page: Page) {
  await page.goto('/');
  await expect(page).toHaveURL('/onboarding');
  await page.getByRole('button', { name: 'Mulai' }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Hari Ini' })).toBeVisible();
}

/** Mengumpulkan galat JS halaman agar test bisa memastikan tidak ada yang terjadi. */
export function collectPageErrors(page: Page): Error[] {
  const errors: Error[] = [];
  page.on('pageerror', (err) => errors.push(err));
  return errors;
}
