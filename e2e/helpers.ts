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

const dayLabel = new Intl.DateTimeFormat('id-ID', {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'short'
});

/** 'YYYY-MM-DD' → label judul tampilan Hari, misal 'Selasa, 3 Nov'. */
export function dayHeading(date: string): string {
  return dayLabel.format(new Date(`${date}T12:00:00Z`)).replace(/\.$/, '');
}

/**
 * Pindah tampilan Hari di /jadwal ke `date` dengan mengetuk ‹ / › (tanpa date picker).
 * Gagal dengan pesan jelas jika tanggal belum tercapai setelah `maxSteps` ketukan.
 */
export async function gotoDay(page: Page, date: string, maxSteps = 120) {
  const heading = page.locator('#day-heading');
  for (let step = 0; ; step++) {
    const current = await heading.getAttribute('data-date');
    if (current === date) break;
    if (step >= maxSteps) {
      throw new Error(`gotoDay: ${date} belum tercapai setelah ${maxSteps} ketukan (sekarang ${current})`);
    }
    const name = current !== null && current > date ? 'Hari sebelumnya' : 'Hari berikutnya';
    await page.getByRole('button', { name, exact: true }).click();
    await expect(heading).not.toHaveAttribute('data-date', current ?? '');
  }
  await expect(heading).toHaveText(dayHeading(date));
}
