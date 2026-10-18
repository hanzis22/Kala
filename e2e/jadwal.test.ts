import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, completeOnboarding, nav } from './helpers';

// Jam dipatok: Senin 19 Okt 2026 10.00 WIB. Minggu tampil = 19–24 Okt.
const NOW = new Date('2026-10-19T10:00:00+07:00');

const block = (page: Page, day: string) =>
  page.getByRole('button', {
    name: new RegExp(`^Matematika, ${day} 07\\.00–08\\.30, ruang 7B\\. Ubah sesi$`)
  });

test('mapel → sesi Senin & Rabu → tampil di grid → tetap ada offline → hapus mapel menghapus sesinya', async ({
  page,
  context
}) => {
  const errors = collectPageErrors(page);
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);

  // Jadwal kosong mengarah ke kelola mapel.
  await nav(page).getByRole('link', { name: 'Jadwal' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Jadwal' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mulai dari mata pelajaran' })).toBeVisible();
  await page.getByRole('link', { name: 'Kelola mata pelajaran' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Mata pelajaran' })).toBeVisible();

  // Tambah mapel.
  await page.getByRole('button', { name: 'Tambah mapel' }).click();
  const subjectSheet = page.getByRole('dialog', { name: 'Tambah mapel' });
  await subjectSheet.getByLabel('Nama mapel').fill('Matematika');
  await subjectSheet.getByLabel(/^Singkatan/).fill('MTK');
  await subjectSheet.getByLabel(/^Ruang/).fill('7B');
  await subjectSheet.getByRole('button', { name: 'Simpan' }).click();
  await expect(subjectSheet).toBeHidden();
  await expect(page.getByRole('button', { name: 'Ubah Matematika' })).toContainText(
    'MTK · 7B · Belum ada sesi'
  );

  // Tambah sesi Senin & Rabu 07.00–08.30.
  await page.getByRole('link', { name: 'Kembali ke Jadwal' }).click();
  await page.getByRole('button', { name: 'Tambah sesi kelas' }).click();
  const sessionSheet = page.getByRole('dialog', { name: 'Tambah sesi kelas' });
  await expect(sessionSheet.getByRole('combobox', { name: 'Mapel' })).toHaveValue(/.+/);
  await expect(sessionSheet.getByLabel(/^Ruang/)).toHaveValue('7B');
  await sessionSheet.getByRole('button', { name: 'Senin' }).click();
  await sessionSheet.getByRole('button', { name: 'Rabu' }).click();
  await expect(sessionSheet.getByRole('button', { name: 'Senin' })).toHaveAttribute('aria-pressed', 'true');
  await sessionSheet.getByLabel('Jam mulai').fill('07:00');
  await sessionSheet.getByLabel('Durasi (menit)').fill('90');
  await expect(sessionSheet.getByText('Selesai pukul 08.30')).toBeVisible();
  await sessionSheet.getByRole('button', { name: 'Simpan' }).click();
  await expect(sessionSheet).toBeHidden();

  // Muncul di grid, hanya di Senin dan Rabu.
  await expect(page.getByRole('heading', { name: 'Minggu ini' })).toBeVisible();
  await expect(page.getByText('19–24 Okt')).toBeVisible();
  await expect(block(page, 'Senin')).toBeVisible();
  await expect(block(page, 'Rabu')).toBeVisible();
  await expect(page.locator('[data-routine]')).toHaveCount(2);
  await expect(block(page, 'Senin')).toHaveAttribute('data-date', '2026-10-19');
  await expect(block(page, 'Rabu')).toHaveAttribute('data-date', '2026-10-21');
  // Grid menampilkan singkatan; nama lengkap tetap di aria-label (lihat `block`).
  await expect(block(page, 'Senin')).toHaveText(/^\s*MTK\s*07\.00\s*$/);

  // Offline + reload: data tetap ada.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Jadwal' })).toBeVisible();
  await expect(block(page, 'Senin')).toBeVisible();
  await expect(block(page, 'Rabu')).toBeVisible();

  // Hapus mapel (dengan konfirmasi) → sesinya ikut hilang.
  await page.getByRole('link', { name: 'Kelola mata pelajaran' }).click();
  await expect(page.getByRole('button', { name: 'Ubah Matematika' })).toContainText('2 sesi per minggu');
  await page.getByRole('button', { name: 'Ubah Matematika' }).click();
  await page.getByRole('dialog', { name: 'Ubah mapel' }).getByRole('button', { name: 'Hapus mapel' }).click();
  const confirm = page.getByRole('alertdialog', { name: 'Hapus Matematika?' });
  await expect(confirm).toContainText('2 sesi kelas per minggu ikut dihapus dari jadwal');
  await confirm.getByRole('button', { name: 'Ya, hapus' }).click();
  await expect(confirm).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Belum ada mapel' })).toBeVisible();

  await page.getByRole('link', { name: 'Kembali ke Jadwal' }).click();
  await expect(page.getByRole('heading', { name: 'Mulai dari mata pelajaran' })).toBeVisible();
  await expect(page.locator('[data-routine]')).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Mulai dari mata pelajaran' })).toBeVisible();
  await expect(page.locator('[data-routine]')).toHaveCount(0);

  expect(errors).toEqual([]);
});

test('kolom Minggu tampil hanya jika diaktifkan di Lainnya', async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);
  await nav(page).getByRole('link', { name: 'Jadwal' }).click();
  await page.getByRole('link', { name: 'Kelola mata pelajaran' }).click();
  await page.getByRole('button', { name: 'Tambah mapel' }).click();
  await page.getByRole('dialog', { name: 'Tambah mapel' }).getByLabel('Nama mapel').fill('Tahfidz');
  await page.getByRole('dialog', { name: 'Tambah mapel' }).getByRole('button', { name: 'Simpan' }).click();
  await page.getByRole('link', { name: 'Kembali ke Jadwal' }).click();

  await page.getByRole('button', { name: 'Tambah sesi kelas' }).click();
  const sheet = page.getByRole('dialog', { name: 'Tambah sesi kelas' });
  await sheet.getByRole('button', { name: 'Minggu' }).click();
  await expect(sheet.getByText('Kolom Minggu sedang disembunyikan')).toBeVisible();
  await sheet.getByLabel('Jam mulai').fill('19:00');
  await sheet.getByLabel('Durasi (menit)').fill('60');
  await sheet.getByRole('button', { name: 'Simpan' }).click();
  await expect(sheet).toBeHidden();

  const sunday = page.getByRole('button', { name: /^Tahfidz, Minggu 19\.00–20\.00/ });
  await expect(page.getByRole('list', { name: 'Minggu' })).toHaveCount(0);
  await expect(sunday).toHaveCount(0);

  await nav(page).getByRole('link', { name: 'Lainnya' }).click();
  await page.getByRole('switch', { name: /Tampilkan Minggu di jadwal/ }).check();
  await nav(page).getByRole('link', { name: 'Jadwal' }).click();
  await expect(sunday).toBeVisible();
  await expect(sunday).toHaveAttribute('data-date', '2026-10-25');
});

test('slot yang melewati 24.00 ditolak dengan pesan', async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);
  await page.goto('/jadwal/mapel');
  await page.getByRole('button', { name: 'Tambah mapel' }).click();
  await page.getByRole('dialog', { name: 'Tambah mapel' }).getByLabel('Nama mapel').fill('Fisika');
  await page.getByRole('dialog', { name: 'Tambah mapel' }).getByRole('button', { name: 'Simpan' }).click();
  await expect(page.getByRole('button', { name: 'Ubah Fisika' })).toBeVisible();
  await page.goto('/jadwal');

  await page.getByRole('button', { name: 'Tambah sesi kelas' }).click();
  const sheet = page.getByRole('dialog', { name: 'Tambah sesi kelas' });
  await sheet.getByRole('button', { name: 'Jumat' }).click();
  await sheet.getByLabel('Jam mulai').fill('23:30');
  await sheet.getByLabel('Durasi (menit)').fill('45');
  await sheet.getByRole('button', { name: 'Simpan' }).click();
  await expect(sheet.getByRole('alert')).toHaveText('Sesi harus selesai paling lambat pukul 24.00.');
  await expect(sheet).toBeVisible();
});

test('sesi bentrok tampil sebagai satu blok selebar kolom dan bisa dipilih', async ({ page }) => {
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);
  await page.goto('/jadwal/mapel');
  for (const [name, abbr] of [
    ['Matematika', 'MTK'],
    ['Bahasa Indonesia', 'BIND']
  ]) {
    await page.getByRole('button', { name: 'Tambah mapel' }).click();
    const sheet = page.getByRole('dialog', { name: 'Tambah mapel' });
    await sheet.getByLabel('Nama mapel').fill(name);
    await sheet.getByLabel(/^Singkatan/).fill(abbr);
    await sheet.getByRole('button', { name: 'Simpan' }).click();
    await expect(sheet).toBeHidden();
  }
  await page.goto('/jadwal');

  for (const [subject, start, duration] of [
    ['Matematika', '10:00', '90'],
    ['Bahasa Indonesia', '10:30', '45']
  ]) {
    await page.getByRole('button', { name: 'Tambah sesi kelas' }).click();
    const sheet = page.getByRole('dialog', { name: 'Tambah sesi kelas' });
    await sheet.getByRole('combobox', { name: 'Mapel' }).selectOption({ label: subject });
    await sheet.getByRole('button', { name: 'Kamis' }).click();
    await sheet.getByLabel('Jam mulai').fill(start);
    await sheet.getByLabel('Durasi (menit)').fill(duration);
    await sheet.getByRole('button', { name: 'Simpan' }).click();
    await expect(sheet).toBeHidden();
  }

  // Satu blok selebar kolom, bukan dua lane sempit.
  const clash = page.getByRole('button', {
    name: '2 sesi bentrok, Kamis 10.00–11.30: Matematika, Bahasa Indonesia. Pilih sesi'
  });
  await expect(clash).toBeVisible();
  await expect(clash).toHaveAttribute('data-date', '2026-10-22');
  await expect(clash).toHaveAttribute('data-clash', '2');
  await expect(clash).toContainText('MTK');
  await expect(clash).toContainText('BIND');
  await expect(page.locator('[data-routine]')).toHaveCount(0);
  const column = await page.getByRole('list', { name: 'Kamis' }).boundingBox();
  const block = await clash.boundingBox();
  expect(block?.width).toBeGreaterThanOrEqual((column?.width ?? 0) - 2);

  // Pilih sesi → sheet ubah berisi data sesi itu.
  await clash.click();
  const picker = page.getByRole('dialog', { name: 'Pilih sesi' });
  await expect(picker).toContainText('Jam sesi ini bertumpuk di hari Kamis');
  await picker.getByRole('button', { name: 'Ubah Bahasa Indonesia, 10.30–11.15' }).click();
  await expect(picker).toBeHidden();
  const edit = page.getByRole('dialog', { name: 'Ubah sesi kelas' });
  await expect(edit.getByRole('combobox', { name: 'Mapel' }).locator('option:checked')).toHaveText(
    'Bahasa Indonesia'
  );
  await expect(edit.getByRole('button', { name: 'Kamis' })).toHaveAttribute('aria-pressed', 'true');
  await expect(edit.getByLabel('Jam mulai')).toHaveValue('10:30');
  await expect(edit.getByLabel('Durasi (menit)')).toHaveValue('45');
});
