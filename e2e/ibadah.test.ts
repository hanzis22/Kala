import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, completeOnboarding, nav } from './helpers';

// Jam dipatok: Sabtu 17 Okt 2026 12.30 WIB (Dzuhur Jakarta ±11.42 sudah masuk, Ashar belum).
const NOW = new Date('2026-10-17T12:30:00+07:00');

async function openIbadah(page: Page) {
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);
  await nav(page).getByRole('link', { name: 'Ibadah' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Ibadah' })).toBeVisible();
}

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

const row = (page: Page, prayer: string) => page.locator(`li[data-prayer="${prayer}"]`);

test('pilih kota → jadwal tampil → catat sholat → berjamaah → tetap ada setelah reload dan offline', async ({
  page,
  context
}) => {
  const errors = collectPageErrors(page);
  await openIbadah(page);

  // Belum ada lokasi: empty state membuka CityPicker.
  await expect(page.getByRole('heading', { name: 'Pilih lokasimu dulu' })).toBeVisible();
  await expect(page.getByText('Sabtu, 17 Okt · 6 Jumadilawal 1448 H')).toBeVisible();
  await page.getByRole('button', { name: 'Pilih lokasi' }).click();
  await pickCity(page, 'jakarta pusat', 'Jakarta Pusat');

  // Jadwal tampil.
  await expect(page.getByRole('heading', { name: 'Jadwal sholat hari ini' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lokasi: Jakarta Pusat. Ganti lokasi' })).toBeVisible();
  await expect(page.getByText(/^Imsak \d{2}\.\d{2}$/)).toBeVisible();
  await expect(row(page, 'subuh')).toHaveAttribute('data-status', 'missed');
  await expect(row(page, 'dzuhur')).toHaveAttribute('data-status', 'now');
  await expect(row(page, 'ashar')).toHaveAttribute('data-status', 'upcoming');
  await expect(row(page, 'ashar')).toContainText(/Masuk pukul \d{2}\.\d{2}/);

  // Catat Dzuhur → status berubah, grid ikut.
  await page.getByRole('button', { name: 'Tandai sudah sholat Dzuhur' }).click();
  await expect(row(page, 'dzuhur')).toHaveAttribute('data-status', 'done');
  await expect(row(page, 'dzuhur')).toContainText('Sudah');
  await expect(page.getByText('1 / 35')).toBeVisible();

  // Sheet: tandai berjamaah.
  await page.getByRole('button', { name: 'Sudah sholat Dzuhur. Ubah catatan' }).click();
  const sheet = page.getByRole('dialog', { name: /^Dzuhur · dicatat 12\.30$/ });
  await expect(sheet).toBeVisible();
  await sheet.getByRole('switch', { name: 'Berjamaah' }).check();
  await sheet.getByRole('button', { name: 'Tutup' }).click();
  await expect(row(page, 'dzuhur')).toContainText('Sudah · berjamaah');

  // Subuh terlewat masih bisa dicatat (sampai akhir hari berikutnya).
  await page.getByRole('button', { name: 'Tandai sudah sholat Subuh' }).click();
  await expect(row(page, 'subuh')).toHaveAttribute('data-status', 'done');
  await expect(page.getByText('2 / 35')).toBeVisible();

  // Reload: data tetap.
  await page.reload();
  await expect(row(page, 'dzuhur')).toContainText('Sudah · berjamaah');
  await expect(row(page, 'subuh')).toHaveAttribute('data-status', 'done');

  // Offline: data dan jadwal tetap.
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Jadwal sholat hari ini' })).toBeVisible();
  await expect(row(page, 'dzuhur')).toContainText('Sudah · berjamaah');
  await expect(page.getByText('2 / 35')).toBeVisible();

  // Batalkan catatan.
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Sudah sholat Subuh. Ubah catatan' }).click();
  await page.getByRole('button', { name: 'Batalkan catatan' }).click();
  await expect(row(page, 'subuh')).toHaveAttribute('data-status', 'missed');

  expect(errors).toEqual([]);
});

test('offline: CityPicker memuat daftar kota dari cache dan kota bisa dipilih', async ({ page, context }) => {
  const errors = collectPageErrors(page);
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  // Daftar kota belum pernah dimuat di sesi ini; harus datang dari precache SW.
  await context.setOffline(true);
  await page.goto('/ibadah');
  await page.getByRole('button', { name: 'Pilih lokasi' }).click();
  await pickCity(page, 'makassar', 'Makassar');
  await expect(page.getByRole('button', { name: 'Lokasi: Makassar. Ganti lokasi' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Jadwal sholat hari ini' })).toBeVisible();

  expect(errors).toEqual([]);
});

test('Pakai lokasi saya: kota terdekat dari GPS', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: -7.257472, longitude: 112.75209 });
  await openIbadah(page);
  await page.getByRole('button', { name: 'Pilih lokasi' }).click();
  await page.getByRole('button', { name: 'Pakai lokasi saya' }).click();
  await expect(page.getByRole('button', { name: 'Lokasi: Surabaya. Ganti lokasi' })).toBeVisible();

  // Koordinat yang tersimpan sudah dibulatkan ke 2 desimal.
  const stored = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const req = indexedDB.open('kala');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const get = req.result.transaction('settings').objectStore('settings').get('app');
          get.onsuccess = () => resolve(get.result.location);
        };
      })
  );
  expect(stored).toMatchObject({ mode: 'gps', cityId: null, label: 'Surabaya', lat: -7.26, lng: 112.75 });
});

test('izin lokasi ditolak tidak memblokir: tetap bisa memilih kota', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_ok, fail) =>
      fail?.({
        code: 1,
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
        message: 'denied'
      } as GeolocationPositionError);
  });
  await openIbadah(page);
  await page.getByRole('button', { name: 'Pilih lokasi' }).click();
  await page.getByRole('button', { name: 'Pakai lokasi saya' }).click();
  await expect(
    page.getByText('Izin lokasi tidak diberikan. Kamu tetap bisa memilih kota dari daftar.')
  ).toBeVisible();
  await pickCity(page, 'bandung', 'Bandung');
  await expect(page.getByRole('button', { name: 'Lokasi: Bandung. Ganti lokasi' })).toBeVisible();
});
