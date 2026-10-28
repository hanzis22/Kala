import { expect, test } from '@playwright/test';
import { completeOnboarding, expectTab, TABS } from './helpers';

for (const width of [360, 390]) {
  for (const colorScheme of ['light', 'dark'] as const) {
    test(`tampil tanpa scroll horizontal di ${width}px, tema ${colorScheme}`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ colorScheme });
      await completeOnboarding(page);

      for (const tab of TABS) {
        await page.goto(tab.path);
        await expectTab(page, tab);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, `${tab.path} melebar`).toBeLessThanOrEqual(0);
      }

      // Tema ikut sistem: tanpa data-theme, latar mengikuti token Senja.
      await page.goto('/');
      await expect(page.locator('html')).not.toHaveAttribute('data-theme');
      const bg = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
      expect(bg).toBe(colorScheme === 'light' ? 'rgb(247, 239, 230)' : 'rgb(23, 17, 14)');

      await page.screenshot({ path: info.outputPath(`hari-ini-${width}-${colorScheme}.png`) });
    });
  }
}
