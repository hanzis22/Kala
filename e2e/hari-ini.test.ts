import { expect, test, type Page } from '@playwright/test';
import { collectPageErrors, completeOnboarding, nav } from './helpers';

// Rencana F2 §10 e2e. Tanggal acuan Senin 26 Okt 2026; jam sholat dibaca dari UI (/ibadah), tidak di-hardcode.
const at = (time: string, date = '2026-10-26') => new Date(`${date}T${time}:00+07:00`);

const skyCard = (page: Page) => page.locator('section[aria-labelledby="sky-heading"]');
const skyHeading = (page: Page) => page.locator('#sky-heading');
const cta = (page: Page) => page.getByRole('button', { name: /^Tandai sudah sholat / });
const banner = (page: Page) => page.getByRole('region', { name: 'Zona waktu' });
const ibadahRow = (page: Page, prayer: string) => page.locator(`li[data-prayer="${prayer}"]`);
const chips = (page: Page) => page.getByRole('region', { name: 'Sholat hari ini' });
const chip = (page: Page, prayer: string) => chips(page).locator(`button[data-prayer="${prayer}"]`);
const toastBox = (page: Page) => page.getByRole('status');
const undo = (page: Page) => toastBox(page).getByRole('button', { name: 'Urungkan' });
const priority = (page: Page, n: number) => page.getByRole('textbox', { name: `Prioritas ${n}` });
const check = (page: Page, text: string) => page.getByRole('checkbox', { name: `Tandai selesai: ${text}` });
const prioritiesCard = (page: Page) => page.locator('section[aria-labelledby="priorities-heading"]');

/** Isi DayEntry.priorities langsung dari IndexedDB ("x teks" = selesai); null jika entri belum ada. */
function storedPriorities(page: Page, date: string): Promise<string[] | null> {
  return page.evaluate(
    (d) =>
      new Promise<string[] | null>((resolve, reject) => {
        const req = indexedDB.open('kala');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const get = db.transaction('dayEntries').objectStore('dayEntries').get(d);
          get.onerror = () => reject(get.error);
          get.onsuccess = () => {
            db.close();
            const entry = get.result as { priorities: { text: string; done: boolean }[] } | undefined;
            resolve(entry ? entry.priorities.map((p) => `${p.done ? 'x' : '-'} ${p.text}`) : null);
          };
        };
      }),
    date
  );
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
    await expect(chip(page, 'maghrib')).toHaveAttribute('data-status', 'done');
    await expect(chip(page, 'maghrib')).toHaveAccessibleName(/^Maghrib \d{2}\.\d{2}, sudah dicatat\./);

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

  test('5. chip: catat → berjamaah di Ibadah → hapus → Urungkan memulihkan log utuh, fokus ke chip', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('18:00'));

    await expect(chip(page, 'ashar')).toHaveAttribute('data-status', 'missed');
    await expect(chip(page, 'ashar')).toHaveAccessibleName(
      /^Ashar \d{2}\.\d{2}, belum dicatat\. Ketuk untuk mencatat$/
    );
    await chip(page, 'ashar').click();
    await expect(chip(page, 'ashar')).toHaveAttribute('data-status', 'done');

    await gotoTab(page, 'Ibadah');
    await page.getByRole('button', { name: 'Sudah sholat Ashar. Ubah catatan' }).click();
    const sheet = page.getByRole('dialog', { name: /^Ashar · dicatat 18\.00$/ });
    await sheet.getByRole('switch', { name: 'Berjamaah' }).check();
    await sheet.getByRole('button', { name: 'Tutup' }).click();
    await expect(ibadahRow(page, 'ashar')).toContainText('Sudah · berjamaah');

    await gotoTab(page, 'Hari Ini');
    await chip(page, 'ashar').click();
    await expect(chip(page, 'ashar')).toHaveAttribute('data-status', 'missed');
    await expect(toastBox(page)).toContainText('Catatan Ashar dihapus');
    await undo(page).click();

    await expect(chip(page, 'ashar')).toHaveAttribute('data-status', 'done');
    await expect(chip(page, 'ashar')).toBeFocused();
    await expect(undo(page)).toHaveCount(0);

    await gotoTab(page, 'Ibadah');
    await expect(ibadahRow(page, 'ashar')).toContainText('Sudah · berjamaah');

    expect(errors).toEqual([]);
  });

  test('6. chip sholat yang belum masuk: aria-disabled, tetap bisa difokus, tanpa log', async ({ page }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('07:00'));

    const dzuhur = chip(page, 'dzuhur');
    await expect(dzuhur).toHaveAttribute('data-status', 'upcoming');
    await expect(dzuhur).toHaveAttribute('aria-disabled', 'true');
    await expect(dzuhur).toHaveAccessibleName(/^Dzuhur \d{2}\.\d{2}, belum masuk$/);
    await dzuhur.focus();
    await expect(dzuhur).toBeFocused();
    // Playwright menolak klik elemen aria-disabled; force tetap mengirim klik pointer sungguhan.
    await dzuhur.click({ force: true });
    await page.keyboard.press('Enter');
    await expect(dzuhur).toHaveAttribute('data-status', 'upcoming');
    await expect(toastBox(page)).toBeEmpty();

    await gotoTab(page, 'Ibadah');
    await expect(ibadahRow(page, 'dzuhur')).toHaveAttribute('data-status', 'upcoming');
    await expect(page.getByText('0 / 35')).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('7. prioritas: isi, centang, offline + reload, baris kosong naik, simpan tanpa blur', async ({
    page,
    context
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('07:00'));
    const date = '2026-10-26';

    await expect(prioritiesCard(page)).toContainText('3 prioritas hari ini');
    await expect(prioritiesCard(page)).not.toContainText(/dari/);
    await expect(check(page, 'Prioritas 1')).toBeDisabled();
    await expect(priority(page, 1)).toHaveAttribute('maxlength', '80');

    await priority(page, 1).fill('Belajar fisika');
    await priority(page, 2).fill('Kerjakan PR');
    await check(page, 'Belajar fisika').check();
    await expect(prioritiesCard(page)).toContainText('1 dari 2');
    await expect.poll(() => storedPriorities(page, date)).toEqual(['x Belajar fisika', '- Kerjakan PR']);

    // Service worker aktif dan mengendalikan halaman dulu (pola offline.test.ts), baru offline.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);
    await context.setOffline(true);
    await page.reload();
    await expect(priority(page, 1)).toHaveValue('Belajar fisika');
    await expect(priority(page, 2)).toHaveValue('Kerjakan PR');
    await expect(check(page, 'Belajar fisika')).toBeChecked();
    await expect(prioritiesCard(page)).toContainText('1 dari 2');

    // Baris 1 dikosongkan lalu keluar kartu: baris 2 naik.
    await priority(page, 1).fill('');
    await priority(page, 1).blur();
    await expect(priority(page, 1)).toHaveValue('Kerjakan PR');
    await expect(priority(page, 2)).toHaveValue('');
    await expect(prioritiesCard(page)).toContainText('0 dari 1');
    await expect.poll(() => storedPriorities(page, date)).toEqual(['- Kerjakan PR']);

    // Mengetik tanpa blur: tersimpan lewat debounce, bertahan setelah reload.
    await priority(page, 2).fill('Baca buku');
    await expect(priority(page, 2)).toBeFocused();
    await expect.poll(() => storedPriorities(page, date)).toEqual(['- Kerjakan PR', '- Baca buku']);
    await page.reload();
    await expect(priority(page, 2)).toHaveValue('Baca buku');

    // Ketik baris 1 lalu langsung centang baris 2 sebelum debounce: keduanya tersimpan.
    await priority(page, 1).fill('Kerjakan PR matematika');
    await check(page, 'Baca buku').check();
    await expect
      .poll(() => storedPriorities(page, date))
      .toEqual(['- Kerjakan PR matematika', 'x Baca buku']);
    await page.reload();
    await expect(priority(page, 1)).toHaveValue('Kerjakan PR matematika');
    await expect(check(page, 'Baca buku')).toBeChecked();

    expect(errors).toEqual([]);
  });

  test('7b. prioritas: tengah malam saat mengetik → tulis ke Senin, kartu kosong, fokus tetap', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    // Clock berjalan selama onboarding, lalu dihentikan tepat sebelum 00.00 (debounce belum jatuh saat 00.00).
    await page.clock.install({ time: at('23:58') });
    await completeOnboarding(page);
    await expect(priority(page, 1)).toBeVisible();
    await page.clock.pauseAt(new Date('2026-10-26T23:59:59.800+07:00'));

    await priority(page, 1).fill('Rapikan catatan');
    await page.clock.runFor(400);

    await expect(page.getByText('Selasa, 27 Oktober 2026', { exact: true })).toBeVisible();
    await expect(priority(page, 1)).toHaveValue('');
    await expect(priority(page, 1)).toBeFocused();
    await expect.poll(() => storedPriorities(page, '2026-10-26')).toEqual(['- Rapikan catatan']);

    await page.clock.runFor(1000);
    expect(await storedPriorities(page, '2026-10-27')).not.toEqual(
      expect.arrayContaining(['- Rapikan catatan'])
    );
    await expect(priority(page, 1)).toHaveValue('');

    expect(errors).toEqual([]);
  });

  test('15. tanpa lokasi: chip tidak dirender; setelah memilih Jakarta chip muncul', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.clock.setFixedTime(at('07:00'));
    await completeOnboarding(page);
    await expect(page.getByRole('heading', { name: 'Pilih lokasimu dulu' })).toBeVisible();
    await expect(chips(page)).toHaveCount(0);

    await page.getByRole('button', { name: 'Pilih lokasi' }).click();
    await pickCity(page, 'jakarta pusat', 'Jakarta Pusat');
    await expect(chips(page).getByRole('button')).toHaveCount(5);
    await expect(chip(page, 'subuh')).toHaveAttribute('data-status', /^(done|missed)$/);

    expect(errors).toEqual([]);
  });

  test('22b. toast diganti saat fokus di Urungkan: fokus pindah ke toast baru, Escape ke asal toast pertama', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('18:00'));
    await chip(page, 'dzuhur').click();
    await chip(page, 'ashar').click();
    await expect(chip(page, 'dzuhur')).toHaveAttribute('data-status', 'done');
    await expect(chip(page, 'ashar')).toHaveAttribute('data-status', 'done');

    // Toast A dari chip Dzuhur; fokus masuk ke Urungkan dari chip itu.
    await chip(page, 'dzuhur').click();
    await expect(toastBox(page)).toContainText('Catatan Dzuhur dihapus');
    await expect(chip(page, 'dzuhur')).toBeFocused();
    await undo(page).focus();
    await expect(undo(page)).toBeFocused();

    // Chip Ashar diklik tanpa memindah fokus: toast B menggantikan, fokus ikut ke Urungkan toast B.
    await chip(page, 'ashar').dispatchEvent('click');
    await expect(toastBox(page)).toContainText('Catatan Ashar dihapus');
    await expect(undo(page)).toBeFocused();

    await page.keyboard.press('Escape');
    await expect(undo(page)).toHaveCount(0);
    await expect(chip(page, 'dzuhur')).toBeFocused();

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
