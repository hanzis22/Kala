import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, completeOnboarding, nav } from './helpers';

// Rencana F2 §10 e2e. Tanggal acuan Senin 26 Okt 2026; jam sholat dibaca dari UI (/ibadah), tidak di-hardcode.
const at = (time: string, date = '2026-10-26') => new Date(`${date}T${time}:00+07:00`);

const skyCard = (page: Page) => page.locator('section[aria-labelledby="sky-heading"]');
const skyHeading = (page: Page) => page.locator('#sky-heading');
const cta = (page: Page) => page.getByRole('button', { name: /^Tandai sudah sholat / });
const banner = (page: Page) => page.getByRole('region', { name: 'Zona waktu' });
const ibadahRow = (page: Page, prayer: string) => page.locator(`li[data-prayer="${prayer}"]`);

async function pickCity(page: Page, query: string, name: string) {
  const sheet = page.getByRole('dialog', { name: 'Pilih lokasi' });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('searchbox', { name: 'Cari kota atau kabupaten' }).fill(query);
  await sheet
    .getByRole('button', { name: new RegExp(`^${name}`) })
    .first()
    .click();
  await expect(sheet).toBeHidden();
}

/** Jam dipatok, onboarding, lalu pilih Jakarta Pusat lewat kartu tanpa lokasi di Hari Ini. */
async function openToday(page: Page, now: Date) {
  await page.clock.setFixedTime(now);
  await completeOnboarding(page);
  await expect(page.getByRole('heading', { name: 'Pilih lokasimu dulu' })).toBeVisible();
  await page.getByRole('button', { name: 'Pilih lokasi' }).click();
  await pickCity(page, 'jakarta pusat', 'Jakarta Pusat');
  await expect(skyCard(page)).toBeVisible();
}

async function gotoTab(page: Page, label: 'Hari Ini' | 'Ibadah') {
  await nav(page).getByRole('link', { name: label }).click();
  if (label === 'Ibadah') await expect(page.getByRole('heading', { level: 1, name: 'Ibadah' })).toBeVisible();
  else await expect(skyCard(page)).toBeVisible();
}

/** Awal waktu sholat hari ini (menit) dari baris /ibadah. */
async function prayerMinutes(page: Page, prayer: string): Promise<number> {
  await gotoTab(page, 'Ibadah');
  const text = await ibadahRow(page, prayer).innerText();
  const m = /(\d{2})\.(\d{2})/.exec(text);
  if (!m) throw new Error(`jam ${prayer} tidak terbaca: ${text}`);
  await gotoTab(page, 'Hari Ini');
  return Number(m[1]) * 60 + Number(m[2]);
}

const clock = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}.${String(minutes % 60).padStart(2, '0')}`;

function countdown(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0
    ? { visual: `${m} m`, spoken: `${m} menit lagi` }
    : { visual: `${h} j ${String(m).padStart(2, '0')} m`, spoken: `${h} jam ${m} menit lagi` };
}

test.describe('perangkat Asia/Jakarta', () => {
  test.use({ timezoneId: 'Asia/Jakarta' });

  test('1. pagi: sapaan, tanggal Masehi + Hijriah, menuju Dzuhur tanpa CTA, footer, tanpa banner', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('07:00'));

    await expect(page).toHaveTitle('Hari Ini · Kala');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Selamat pagi/);
    await expect(page.getByText('Senin, 26 Oktober 2026', { exact: true })).toBeVisible();
    await expect(page.getByText(/^\d{1,2} \S+ \d{4} H$/)).toBeVisible();

    await expect(skyHeading(page)).toHaveText('Menuju Dzuhur');
    await expect(cta(page)).toHaveCount(0);
    await expect(skyCard(page)).toContainText('Jakarta Pusat · Metode Kemenag');
    await expect(skyCard(page)).toContainText('Sekarang 07.00');
    await expect(skyCard(page).locator('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(banner(page)).toHaveCount(0);

    expect(errors).toEqual([]);
  });

  test('2. Terbit–Dzuhur: tanpa CTA, hitung mundur ke Dzuhur (visual + dibacakan)', async ({ page }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('09:00'));
    const dzuhur = await prayerMinutes(page, 'dzuhur');
    const expected = countdown(dzuhur - 9 * 60);

    await expect(skyHeading(page)).toHaveText('Menuju Dzuhur');
    await expect(cta(page)).toHaveCount(0);
    await expect(skyCard(page).locator('[aria-hidden="true"]', { hasText: expected.visual })).toBeVisible();
    await expect(skyCard(page).locator('.sr-only', { hasText: expected.spoken })).toHaveCount(1);
    await expect(skyCard(page)).toContainText(`Dzuhur pukul ${clock(dzuhur)}`);
    await expect(skyCard(page)).not.toContainText('besok');

    expect(errors).toEqual([]);
  });

  test('3. Maghrib: CTA lewat keyboard → fokus ke judul kartu "Menuju Isya" → Ibadah ikut', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('18:00'));
    const maghrib = await prayerMinutes(page, 'maghrib');
    const isya = await prayerMinutes(page, 'isya');
    expect(maghrib).toBeLessThanOrEqual(18 * 60);
    expect(isya).toBeGreaterThan(18 * 60);

    await expect(skyHeading(page)).toHaveText('Waktu Maghrib');
    await expect(skyCard(page)).toContainText('Sudah masuk');
    const sub = countdown(isya - 18 * 60);
    await expect(skyCard(page)).toContainText(`Isya pukul ${clock(isya)}, ${sub.visual} lagi`);
    await expect(
      skyCard(page).locator('.sr-only', { hasText: `Isya pukul ${clock(isya)}, ${sub.spoken}` })
    ).toHaveCount(1);

    const button = page.getByRole('button', { name: 'Tandai sudah sholat Maghrib' });
    for (let i = 0; i < 40; i++) {
      if (await button.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press('Tab');
    }
    await expect(button).toBeFocused();
    await page.keyboard.press('Enter');

    // CTA hilang dulu, baru fokus diperiksa (liveQuery menulis asinkron setelah commit).
    await expect(cta(page)).toHaveCount(0);
    await expect(skyHeading(page)).toHaveText('Menuju Isya');
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('sky-heading');
    await expect(skyHeading(page)).toBeFocused();
    await expect(skyCard(page)).toContainText(`Isya pukul ${clock(isya)}`);

    await gotoTab(page, 'Ibadah');
    await expect(ibadahRow(page, 'maghrib')).toHaveAttribute('data-status', 'done');

    expect(errors).toEqual([]);
  });

  test('4. setelah tengah malam: CTA Isya mencatat Isya kemarin, Isya hari ini tetap belum', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('01:00', '2026-10-27'));
    await expect(page.getByText('Selasa, 27 Oktober 2026', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Selamat pagi/);

    await expect(skyHeading(page)).toHaveText('Waktu Isya');
    await page.getByRole('button', { name: 'Tandai sudah sholat Isya' }).click();
    await expect(cta(page)).toHaveCount(0);
    await expect(skyHeading(page)).toHaveText('Menuju Subuh');
    await expect(skyCard(page)).toContainText(/Subuh pukul \d{2}\.\d{2}/);
    await expect(skyCard(page)).not.toContainText('besok');

    // Catatan masuk ke Senin: Isya Selasa masih belum masuk, tapi grid 7 hari berisi 1.
    await gotoTab(page, 'Ibadah');
    await expect(ibadahRow(page, 'isya')).toHaveAttribute('data-status', 'upcoming');
    await expect(page.getByText('1 / 35')).toBeVisible();

    expect(errors).toEqual([]);
  });
});

test.describe('perangkat America/New_York, lokasi Jakarta', () => {
  test.use({ timezoneId: 'America/New_York' });

  test('16. banner zona: tampil, Perbarui lokasi membuka CityPicker, Tutup diingat setelah reload', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    // 07.00 WIB = Minggu 25 Okt 20.00 di New York.
    await openToday(page, at('07:00'));

    // Sapaan dan tanggal mengikuti perangkat, kartu langit mengikuti lokasi.
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Selamat malam/);
    await expect(page.getByText('Minggu, 25 Oktober 2026', { exact: true })).toBeVisible();
    await expect(skyCard(page)).toContainText('Sekarang 07.00');

    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toContainText('Lokasimu berubah?');
    await expect(banner(page)).toContainText('Jadwal sholat masih mengikuti Jakarta Pusat.');

    await banner(page).getByRole('button', { name: 'Perbarui lokasi' }).click();
    const sheet = page.getByRole('dialog', { name: 'Pilih lokasi' });
    await expect(sheet).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(sheet).toBeHidden();
    await expect(banner(page)).toBeVisible();

    await banner(page).getByRole('button', { name: 'Tutup' }).click();
    await expect(banner(page)).toHaveCount(0);

    await page.reload();
    await expect(skyCard(page)).toBeVisible();
    await expect(banner(page)).toHaveCount(0);

    expect(errors).toEqual([]);
  });
});
