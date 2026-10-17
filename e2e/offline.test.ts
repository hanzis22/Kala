import { expect, test } from '@playwright/test';
import { collectPageErrors, completeOnboarding } from './helpers';

test('app tetap terbuka setelah reload dalam mode offline', async ({ page, context }) => {
  const errors = collectPageErrors(page);
  await completeOnboarding(page);

  // Tunggu service worker aktif dan mengendalikan halaman (precache selesai saat install).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Hari Ini' })).toBeVisible();

  // Deep link yang diprerender.
  await page.goto('/tugas');
  await expect(page.getByRole('heading', { level: 1, name: 'Tugas' })).toBeVisible();

  // URL yang tidak ada: jatuh ke 404.html (shell SPA) lalu halaman galat app.
  await page.goto('/tidak-ada');
  await expect(page.getByRole('heading', { level: 1, name: 'Halaman tidak ditemukan' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' })).toBeVisible();

  expect(errors).toEqual([]);
});
