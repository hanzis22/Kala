import { expect, test } from '@playwright/test';
import { completeOnboarding } from './helpers';

// Server uji (scripts/serve-build.mjs) mengirim header dari build/_headers, sama seperti Cloudflare Workers.
test('CSP dari _headers aktif dan tidak memblokir app', async ({ page }) => {
  const response = await page.goto('/');
  const csp = response?.headers()['content-security-policy'] ?? '';
  expect(csp).toContain("default-src 'self'");
  expect(csp).toMatch(/script-src 'self' 'sha256-/);
  expect(csp).not.toContain('__INLINE_SCRIPT_HASHES__');

  await page.addInitScript(() => {
    const w = window as unknown as { __cspViolations: string[] };
    w.__cspViolations = [];
    document.addEventListener('securitypolicyviolation', (e) => {
      w.__cspViolations.push(`${e.violatedDirective} ${e.blockedURI}`);
    });
  });

  await completeOnboarding(page);
  await page
    .getByRole('navigation', { name: 'Navigasi utama' })
    .getByRole('link', { name: 'Ibadah' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ibadah' })).toBeVisible();
  await page.goto('/tidak-ada');
  await expect(page.getByRole('heading', { level: 1, name: 'Halaman tidak ditemukan' })).toBeVisible();

  const violations = await page.evaluate(
    () => (window as unknown as { __cspViolations: string[] }).__cspViolations
  );
  expect(violations).toEqual([]);
});
