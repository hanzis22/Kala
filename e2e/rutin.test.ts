import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, completeOnboarding, dayHeading, gotoDay, nav } from './helpers';

// Jam dipatok: Senin 19 Okt 2026 10.00 WIB.
const NOW = new Date('2026-10-19T10:00:00+07:00');

const dayCard = (page: Page) => page.locator('section[aria-labelledby="day-heading"]');
const lesItem = (page: Page, time = '16.00–17.30', moved = false) =>
  dayCard(page).getByRole('button', {
    name: `Les, ${time}${moved ? ', jam diubah' : ''}. Ubah`,
    exact: true
  });

async function showDay(page: Page) {
  await page.getByRole('button', { name: 'Hari', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Hari', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
}

/** Membuka sheet pilihan edit untuk "Les" di tanggal tertentu dari tampilan Hari. */
async function openLes(page: Page, date: string, time = '16.00–17.30') {
  await gotoDay(page, date);
  await lesItem(page, time).click();
  return page.getByRole('dialog', { name: `Les · ${dayHeading(date)}` });
}

async function addSubject(page: Page, name: string, room: string | null = null) {
  await page.goto('/jadwal/mapel');
  await page.getByRole('button', { name: 'Tambah mapel' }).click();
  const sheet = page.getByRole('dialog', { name: 'Tambah mapel' });
  await sheet.getByLabel('Nama mapel').fill(name);
  if (room) await sheet.getByLabel(/^Ruang/).fill(room);
  await sheet.getByRole('button', { name: 'Simpan' }).click();
  await expect(sheet).toBeHidden();
  await page.goto('/jadwal');
}

async function addClass(page: Page, days: string[], start: string, duration: string) {
  await page.getByRole('button', { name: 'Tambah sesi kelas' }).click();
  const sheet = page.getByRole('dialog', { name: 'Tambah sesi kelas' });
  for (const day of days) await sheet.getByRole('button', { name: day }).click();
  await sheet.getByLabel('Jam mulai').fill(start);
  await sheet.getByLabel('Durasi (menit)').fill(duration);
  await sheet.getByRole('button', { name: 'Simpan' }).click();
  await expect(sheet).toBeHidden();
}

/** Jumlah Routine aktif langsung dari IndexedDB, untuk memastikan tidak ada seri kosong yang tersisa. */
const activeRoutineCount = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('kala');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const all = open.result.transaction('routines').objectStore('routines').getAll();
          all.onsuccess = () => {
            resolve(
              (all.result as { deletedAt: string | null }[]).filter((r) => r.deletedAt === null).length
            );
            open.result.close();
          };
          all.onerror = () => reject(all.error);
        };
      })
  );

test('rutin setiap 2 minggu: lewati, kembalikan, pindah jam, ubah mulai tanggal, tetap ada offline', async ({
  page,
  context
}) => {
  // Skenario panjang: puluhan ketukan ‹ › di tampilan Hari plus reload offline.
  test.setTimeout(120_000);
  const errors = collectPageErrors(page);
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);
  await nav(page).getByRole('link', { name: 'Jadwal' }).click();

  // /jadwal selalu dibuka di Minggu.
  await expect(page.getByRole('button', { name: 'Minggu', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await expect(page.getByRole('heading', { name: 'Rutin' })).toBeVisible();

  // 1. Buat "Les" setiap 2 minggu, Selasa, mulai 19 Okt, 16.00 / 90 menit.
  await page.getByRole('button', { name: 'Tambah rutin' }).click();
  const add = page.getByRole('dialog', { name: 'Tambah rutin' });
  await add.getByLabel('Judul').fill('Les');
  await expect(add.getByRole('button', { name: 'Mingguan' })).toHaveAttribute('aria-pressed', 'true');
  await add.getByLabel('Jarak pengulangan').fill('2');
  await expect(add.getByRole('button', { name: 'Senin' })).toHaveAttribute('aria-pressed', 'true');
  await add.getByRole('button', { name: 'Senin' }).click();
  await add.getByRole('button', { name: 'Selasa' }).click();
  await add.getByLabel('Jam mulai').fill('16:00');
  await add.getByLabel('Durasi (menit)').fill('90');
  await expect(add.getByLabel('Tanggal mulai')).toHaveValue('2026-10-19');
  await expect(add.getByText('Setiap 2 minggu, Selasa')).toBeVisible();
  await expect(add.getByText('Selesai pukul 17.30')).toBeVisible();
  await add.getByRole('button', { name: 'Simpan' }).click();
  await expect(add).toBeHidden();

  await expect(
    page.getByRole('button', { name: 'Ubah Les, Setiap 2 minggu, Selasa, 16.00–17.30' })
  ).toBeVisible();

  await showDay(page);
  await expect(page.locator('#day-heading')).toHaveText('Senin, 19 Okt');
  for (const date of ['2026-10-20', '2026-11-03', '2026-11-17']) {
    await gotoDay(page, date);
    await expect(lesItem(page)).toBeVisible();
  }
  for (const date of ['2026-10-27', '2026-11-10']) {
    await gotoDay(page, date);
    await expect(dayCard(page)).toContainText('Tidak ada kelas, rutin, atau kegiatan di hari ini.');
  }

  // 2. Lewati 3 Nov → hanya baris "Dilewati"; 20 Okt dan 17 Nov tetap. Kembalikan → muncul lagi.
  let sheet = await openLes(page, '2026-11-03');
  await sheet.getByRole('button', { name: 'Lewati tanggal ini' }).click();
  await expect(sheet).toBeHidden();
  await expect(lesItem(page)).toHaveCount(0);
  await expect(dayCard(page).locator('li')).toHaveCount(1);
  await expect(dayCard(page)).toContainText('Dilewati');
  for (const date of ['2026-10-20', '2026-11-17']) {
    await gotoDay(page, date);
    await expect(lesItem(page)).toBeVisible();
  }
  await gotoDay(page, '2026-11-03');
  await dayCard(page).getByRole('button', { name: 'Kembalikan Les' }).click();
  await expect(lesItem(page)).toBeVisible();
  await expect(dayCard(page)).not.toContainText('Dilewati');

  // 3. Pindah 17 Nov ke 18.00 → "Jam diubah"; 20 Okt dan 1 Des tetap 16.00.
  sheet = await openLes(page, '2026-11-17');
  await expect(sheet).toContainText('Ubah satu tanggal hanya mengganti jam dan durasi.');
  await sheet.getByLabel('Jam mulai').fill('18:00');
  await sheet.getByRole('button', { name: 'Simpan untuk tanggal ini' }).click();
  await expect(sheet).toBeHidden();
  await expect(lesItem(page, '18.00–19.30', true)).toBeVisible();
  await expect(dayCard(page)).toContainText('Jam diubah');
  for (const date of ['2026-10-20', '2026-12-01']) {
    await gotoDay(page, date);
    await expect(lesItem(page)).toBeVisible();
  }

  // 4. "Tanggal ini dan seterusnya" di 1 Des → 17.00.
  sheet = await openLes(page, '2026-12-01');
  await sheet.getByRole('button', { name: 'Tanggal ini dan seterusnya' }).click();
  await expect(sheet).toBeHidden();
  const from = page.getByRole('dialog', { name: 'Ubah rutin mulai 1 Des' });
  await expect(from.getByLabel('Tanggal mulai')).toBeDisabled();
  await expect(from.getByLabel('Tanggal mulai')).toHaveValue('2026-12-01');
  await expect(from.getByRole('button', { name: 'Hapus mulai tanggal ini' })).toBeVisible();
  await from.getByLabel('Jam mulai').fill('17:00');
  await from.getByRole('button', { name: 'Simpan' }).click();
  await expect(from).toBeHidden();

  const expectAfterSplit = async () => {
    await gotoDay(page, '2026-11-17');
    await expect(lesItem(page, '18.00–19.30', true)).toBeVisible();
    await gotoDay(page, '2026-11-03');
    await expect(lesItem(page)).toBeVisible();
    for (const date of ['2026-12-01', '2026-12-15']) {
      await gotoDay(page, date);
      await expect(lesItem(page, '17.00–18.30')).toBeVisible();
    }
    await expect(
      page.getByRole('button', { name: 'Ubah Les, Setiap 2 minggu, Selasa, 16.00–17.30, Sampai 30 Nov' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Ubah Les, Setiap 2 minggu, Selasa, 17.00–18.30, Mulai 1 Des' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^Ubah Les/ })).toHaveCount(2);
  };
  await expectAfterSplit();

  // 6. Offline + reload: semua tetap ada (dibuka lagi di Minggu, lalu toggle Hari).
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Minggu', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await showDay(page);
  await expectAfterSplit();

  // 7. Tanpa page error.
  expect(errors).toEqual([]);
});

test('kelas: ubah hanya tanggal ini dari grid Minggu', async ({ page, context }) => {
  const errors = collectPageErrors(page);
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);
  await addSubject(page, 'Matematika', '7B');
  await addClass(page, ['Senin', 'Rabu'], '07:00', '90');

  // 5. Ketuk blok Senin 19 Okt → "Hanya tanggal ini" 09.00.
  await page.getByRole('button', { name: 'Matematika, Senin 07.00–08.30, ruang 7B. Ubah sesi' }).click();
  const sheet = page.getByRole('dialog', { name: 'Matematika · Senin, 19 Okt' });
  await expect(sheet.getByLabel('Jam mulai')).toHaveValue('07:00');
  await sheet.getByLabel('Jam mulai').fill('09:00');
  await sheet.getByRole('button', { name: 'Simpan untuk tanggal ini' }).click();
  await expect(sheet).toBeHidden();

  await expect(
    page.getByRole('button', { name: 'Matematika, Senin 09.00–10.30, ruang 7B. Ubah sesi' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Matematika, Rabu 07.00–08.30, ruang 7B. Ubah sesi' })
  ).toBeVisible();

  await showDay(page);
  await expect(
    dayCard(page).getByRole('button', { name: 'Matematika, 09.00–10.30, jam diubah. Ubah' })
  ).toBeVisible();
  await gotoDay(page, '2026-10-26');
  await expect(dayCard(page).getByRole('button', { name: 'Matematika, 07.00–08.30. Ubah' })).toBeVisible();

  // Offline + reload: Senin 09.00 dan Rabu 07.00 tetap ada.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Jadwal' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Matematika, Senin 09.00–10.30, ruang 7B. Ubah sesi' })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Matematika, Rabu 07.00–08.30, ruang 7B. Ubah sesi' })
  ).toBeVisible();

  expect(errors).toEqual([]);
});

test('kejadian pertama: "Tanggal ini dan seterusnya" tidak menyisakan seri lama', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);
  await addSubject(page, 'Matematika');

  // Kelas Senin & Rabu lewat F4 (dtstart = Senin minggu berjalan); ubah di kejadian pertama, Senin 19 Okt.
  await addClass(page, ['Senin', 'Rabu'], '07:00', '90');
  await page.getByRole('button', { name: /^Matematika, Senin 07\.00–08\.30\. Ubah sesi$/ }).click();
  let sheet = page.getByRole('dialog', { name: 'Matematika · Senin, 19 Okt' });
  await sheet.getByRole('button', { name: 'Tanggal ini dan seterusnya' }).click();
  let edit = page.getByRole('dialog', { name: 'Ubah sesi kelas' });
  await expect(edit).toContainText('Perubahan berlaku mulai 19 Okt');
  await edit.getByLabel('Jam mulai').fill('08:00');
  await edit.getByRole('button', { name: 'Simpan' }).click();
  await expect(edit).toBeHidden();
  await expect(
    page.getByRole('button', { name: /^Matematika, Senin 08\.00–09\.30\. Ubah sesi$/ })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /^Matematika, Rabu 08\.00–09\.30\. Ubah sesi$/ })
  ).toBeVisible();

  // Kelas Selasa & Kamis: dtstart Senin bukan kejadian; kejadian pertama = Selasa 20 Okt.
  await addClass(page, ['Selasa', 'Kamis'], '10:00', '60');
  await page.getByRole('button', { name: /^Matematika, Selasa 10\.00–11\.00\. Ubah sesi$/ }).click();
  sheet = page.getByRole('dialog', { name: 'Matematika · Selasa, 20 Okt' });
  await sheet.getByRole('button', { name: 'Tanggal ini dan seterusnya' }).click();
  edit = page.getByRole('dialog', { name: 'Ubah sesi kelas' });
  await edit.getByLabel('Jam mulai').fill('13:00');
  await edit.getByRole('button', { name: 'Simpan' }).click();
  await expect(edit).toBeHidden();
  await expect(
    page.getByRole('button', { name: /^Matematika, Selasa 13\.00–14\.00\. Ubah sesi$/ })
  ).toBeVisible();

  // Rutin mingguan Selasa mulai Senin 19 Okt; ubah di kejadian pertama, Selasa 20 Okt.
  await page.getByRole('button', { name: 'Tambah rutin' }).click();
  const add = page.getByRole('dialog', { name: 'Tambah rutin' });
  await add.getByLabel('Judul').fill('Olahraga');
  await add.getByRole('button', { name: 'Senin' }).click();
  await add.getByRole('button', { name: 'Selasa' }).click();
  await add.getByLabel('Jam mulai').fill('16:00');
  await add.getByRole('button', { name: 'Simpan' }).click();
  await expect(add).toBeHidden();
  await showDay(page);
  await gotoDay(page, '2026-10-20');
  await dayCard(page).getByRole('button', { name: 'Olahraga, 16.00–17.00. Ubah' }).click();
  await page
    .getByRole('dialog', { name: 'Olahraga · Selasa, 20 Okt' })
    .getByRole('button', { name: 'Tanggal ini dan seterusnya' })
    .click();
  const from = page.getByRole('dialog', { name: 'Ubah rutin mulai 20 Okt' });
  await from.getByLabel('Jam mulai').fill('17:00');
  await from.getByRole('button', { name: 'Simpan' }).click();
  await expect(from).toBeHidden();

  // Daftar Rutin: satu entri, tanpa "Sampai …"; database: tidak ada seri tambahan.
  await expect(page.getByRole('button', { name: /^Ubah Olahraga/ })).toHaveCount(1);
  await expect(
    page.getByRole('button', { name: 'Ubah Olahraga, Setiap minggu, Selasa, 17.00–18.00' })
  ).toBeVisible();
  await expect(page.locator('section[aria-labelledby="routine-heading"]')).not.toContainText('Sampai');
  expect(await activeRoutineCount(page)).toBe(3);

  expect(errors).toEqual([]);
});
