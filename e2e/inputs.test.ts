import { expect, test, type Page } from '@playwright/test';
import { completeOnboarding } from './helpers';

/**
 * Safari iOS memperbesar halaman jika kolom isian teks yang diketuk < 16px, dan karena Kala SPA,
 * zoom itu terbawa ke semua halaman. Semua kolom teks yang terlihat wajib ≥ 16px.
 */
async function textFieldFontSizes(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('input, textarea, select')]
      .filter((el) => {
        const type = el instanceof HTMLInputElement ? el.type : 'text';
        return ![
          'checkbox',
          'radio',
          'button',
          'submit',
          'reset',
          'hidden',
          'range',
          'color',
          'file'
        ].includes(type);
      })
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => ({
        field: el.getAttribute('aria-label') ?? el.getAttribute('name') ?? el.tagName,
        px: parseFloat(getComputedStyle(el).fontSize)
      }))
  );
}

test('kolom isian teks minimal 16px (mencegah auto-zoom Safari iOS)', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/ibadah');
  await page.getByRole('button', { name: 'Pilih lokasi' }).click();
  await expect(page.getByRole('searchbox', { name: 'Cari kota atau kabupaten' })).toBeVisible();

  const fields = await textFieldFontSizes(page);
  expect(fields.length).toBeGreaterThan(0);
  for (const f of fields) expect(f.px, f.field).toBeGreaterThanOrEqual(16);
});
