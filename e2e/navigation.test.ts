import { expect, test } from '@playwright/test';
import { collectPageErrors, completeOnboarding, nav, TABS } from './helpers';

test('belum onboarding diarahkan ke /onboarding, BottomNav tersembunyi', async ({ page }) => {
  await page.goto('/tugas');
  await expect(page).toHaveURL('/onboarding');
  await expect(page.getByRole('heading', { level: 1, name: 'Selamat datang di Kala' })).toBeVisible();
  await expect(nav(page)).toHaveCount(0);
});

test('kelima tab bisa dibuka lewat BottomNav', async ({ page }) => {
  const errors = collectPageErrors(page);
  await completeOnboarding(page);

  for (const tab of [...TABS.slice(1), TABS[0]]) {
    await nav(page).getByRole('link', { name: tab.label }).click();
    await expect(page).toHaveURL(tab.path);
    await expect(page.getByRole('heading', { level: 1, name: tab.label })).toBeVisible();
    await expect(nav(page).getByRole('link', { name: tab.label })).toHaveAttribute('aria-current', 'page');
    await expect(nav(page).locator('[aria-current="page"]')).toHaveCount(1);
  }

  expect(errors).toEqual([]);
});

test('sudah onboarding tidak bisa kembali ke /onboarding', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/onboarding');
  await expect(page).toHaveURL('/');
});

test('deep link /tugas langsung terbuka', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/tugas');
  await expect(page.getByRole('heading', { level: 1, name: 'Tugas' })).toBeVisible();
});

test('BottomNav bisa dipakai dengan keyboard', async ({ page }) => {
  await completeOnboarding(page);
  const link = nav(page).getByRole('link', { name: 'Jadwal' });
  await link.focus();
  await expect(link).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/jadwal');
});
