import { expect, test, type Locator, type Page } from '@playwright/test';
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

// ---------- Agenda (P4.1) ----------

const agenda = (page: Page) => page.locator('section[aria-labelledby="agenda-heading"]');
const agendaHeading = (page: Page) => page.locator('#agenda-heading');
const agendaItems = (page: Page) => agenda(page).locator('#agenda-list > li');
const agendaItem = (page: Page, key: string) => agenda(page).locator(`#agenda-list > li[data-key="${key}"]`);
const itemCheck = (page: Page, key: string) => agendaItem(page, key).locator('[data-part="check"]');
const expandButton = (page: Page) =>
  agenda(page).getByRole('button', { name: /^(Lihat semua|Tampilkan lebih sedikit)$/ });
const dueGroup = (page: Page) => agenda(page).getByRole('group', { name: 'Tenggat hari ini' });
const carriedToggle = (page: Page) => agenda(page).getByRole('button', { name: /^Belum selesai sebelumnya/ });
const carriedGroup = (page: Page) => agenda(page).getByRole('group', { name: /Belum selesai sebelumnya/ });
const taskRow = (scope: Locator, title: string) =>
  scope.locator('li[data-task-id]').filter({ hasText: title });

const STAMP = '2026-10-19T00:00:00.000Z';
const stamps = { createdAt: STAMP, updatedAt: STAMP, deletedAt: null };

type Row = Record<string, unknown> & { id: string };

const subjectRow = (id: string, name: string): Row => ({
  id,
  name,
  abbr: null,
  teacher: null,
  room: null,
  ...stamps
});
const routineRow = (
  id: string,
  title: string,
  start: string,
  duration: number,
  extra: Partial<Row> = {}
): Row => ({
  id,
  kind: 'routine',
  title,
  subjectId: null,
  startTime: start,
  durationMin: duration,
  rrule: 'FREQ=DAILY',
  dtstart: '2026-10-19',
  until: null,
  exdates: [],
  overrides: {},
  location: null,
  ...stamps,
  ...extra
});
const taskRowData = (id: string, title: string, extra: Partial<Row> = {}): Row => ({
  id,
  title,
  notes: null,
  type: 'tugas',
  subjectId: null,
  dueDate: null,
  dueTime: null,
  scheduledDate: null,
  startTime: null,
  durationMin: null,
  priority: 'medium',
  quadrant: null,
  status: 'todo',
  completedAt: null,
  ...stamps,
  ...extra
});

/** Tulis langsung ke IndexedDB lalu reload: liveQuery Dexie tidak melihat tulis di luar Dexie. */
async function seed(page: Page, data: Record<string, Row[]>) {
  await page.evaluate(
    (d) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('kala');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(Object.keys(d), 'readwrite');
          for (const [store, rows] of Object.entries(d)) for (const r of rows) tx.objectStore(store).put(r);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    data
  );
  await page.reload();
  await expect(agenda(page)).toBeVisible();
}

/** Hapus record lewat API IndexedDB mentah (tanpa Dexie), koneksi Dexie halaman tetap terbuka. */
function rawDelete(page: Page, store: string, id: string): Promise<void> {
  return page.evaluate(
    ([s, key]) =>
      new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('kala');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction(s, 'readwrite');
          tx.objectStore(s).delete(key);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
        };
      }),
    [store, id] as const
  );
}

/** Semua id di satu object store. */
function storedIds(page: Page, store: string): Promise<string[]> {
  return page.evaluate(
    (s) =>
      new Promise<string[]>((resolve, reject) => {
        const req = indexedDB.open('kala');
        req.onerror = () => reject(req.error);
        req.onsuccess = () => {
          const db = req.result;
          const all = db.transaction(s).objectStore(s).getAllKeys();
          all.onerror = () => reject(all.error);
          all.onsuccess = () => {
            db.close();
            resolve(all.result.map(String));
          };
        };
      }),
    store
  );
}

type Contrast = { key: string; part: string; ratio: number; opaque: boolean };

/**
 * Kontras WCAG teks judul/meta/tag di setiap baris `data-faded`: warna teks terhitung vs latar efektif
 * (ancestor pertama yang latarnya tidak transparan, dicampur jika semi-transparan). `opaque` = tidak ada
 * opacity < 1 dari teks sampai baris.
 */
function fadedContrast(page: Page, theme: 'light' | 'dark'): Promise<Contrast[]> {
  return page.evaluate((th) => {
    document.documentElement.setAttribute('data-theme', th);
    type Rgba = { r: number; g: number; b: number; a: number };
    const parse = (c: string): Rgba => {
      const m = (c.match(/[\d.]+/g) ?? []).map(Number);
      return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 };
    };
    const over = (top: Rgba, under: Rgba): Rgba => ({
      r: top.r * top.a + under.r * (1 - top.a),
      g: top.g * top.a + under.g * (1 - top.a),
      b: top.b * top.a + under.b * (1 - top.a),
      a: 1
    });
    const lum = ({ r, g, b }: Rgba) => {
      const f = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const background = (el: Element): Rgba => {
      const layers: Rgba[] = [];
      for (let n: Element | null = el; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c.a > 0) layers.push(c);
        if (c.a >= 1) break;
      }
      return layers.reverse().reduce((acc, l) => over(l, acc), { r: 255, g: 255, b: 255, a: 1 });
    };
    const out: { key: string; part: string; ratio: number; opaque: boolean }[] = [];
    for (const li of document.querySelectorAll<HTMLElement>('#agenda-list > li[data-faded]')) {
      for (const part of ['title', 'meta', 'tag']) {
        const el = li.querySelector(`[data-part="${part}"]`);
        if (!el) continue;
        const bg = background(el);
        const fg = over(parse(getComputedStyle(el).color), bg);
        const [hi, lo] = [lum(fg), lum(bg)].sort((a, b) => b - a);
        let opaque = true;
        for (let n: Element | null = el; n && n !== li.parentElement; n = n.parentElement)
          if (Number(getComputedStyle(n).opacity) < 1) opaque = false;
        out.push({ key: li.dataset.key ?? '', part, ratio: (hi + 0.05) / (lo + 0.05), opaque });
      }
    }
    return out;
  }, theme);
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

    // Ketik baris 1 lalu langsung centang baris 2 sebelum debounce: clock dibekukan agar timer 500 ms
    // pasti belum jatuh, jadi teks baris 1 hanya bisa tersimpan lewat flush dari centang.
    await page.clock.pauseAt(at('07:01'));
    await priority(page, 1).fill('Kerjakan PR matematika');
    await check(page, 'Baca buku').check();
    await expect
      .poll(() => storedPriorities(page, date))
      .toEqual(['- Kerjakan PR matematika', 'x Baca buku']);
    await page.clock.resume();
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

  test('8. centang rutin di agenda: tersimpan setelah reload, dicoret; ≤ 6 item tanpa Lihat semua', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('07:00'));

    // Rutin baru lewat /jadwal: default Senin (hari tanggal mulai), 16.00, 60 menit.
    await nav(page).getByRole('link', { name: 'Jadwal' }).click();
    await page.getByRole('button', { name: 'Tambah rutin' }).click();
    const add = page.getByRole('dialog', { name: 'Tambah rutin' });
    await add.getByLabel('Judul').fill('Belajar mandiri');
    await add.getByRole('button', { name: 'Simpan' }).click();
    await expect(add).toBeHidden();
    await gotoTab(page, 'Hari Ini');

    // 5 sholat + 1 rutin = 6 item: semua tampil, tanpa tombol.
    await expect(agendaItems(page)).toHaveCount(6);
    await expect(expandButton(page)).toHaveCount(0);

    const box = agenda(page).getByRole('checkbox', {
      name: 'Tandai selesai: Belajar mandiri, rutin, 16.00–17.00',
      exact: true
    });
    await expect(box).not.toBeChecked();
    await box.click();
    const done = agenda(page).getByRole('checkbox', {
      name: 'Batalkan selesai: Belajar mandiri, rutin, 16.00–17.00',
      exact: true
    });
    await expect(done).toBeChecked();

    await page.reload();
    await expect(done).toBeChecked();
    const row = agendaItems(page).filter({ hasText: 'Belajar mandiri' });
    await expect(row).toHaveAttribute('data-status', 'done');
    await expect(row.locator('[data-part="title"]')).toHaveCSS('text-decoration-line', 'line-through');
    await expect(row.locator('[data-part="meta"]')).toHaveText('Rutin · sampai 17.00');

    expect(errors).toEqual([]);
  });

  test('9. centang blok tugas di agenda → Selesai di /tugas; dibuka lagi di /tugas → agenda tidak tercentang', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('07:00'));
    await seed(page, {
      tasks: [
        taskRowData('t-fisika', 'Kerjakan PR fisika', {
          scheduledDate: '2026-10-26',
          startTime: '13:30',
          durationMin: 60
        })
      ]
    });

    const name = 'Kerjakan PR fisika, tugas, 13.30–14.30';
    await agenda(page)
      .getByRole('checkbox', { name: `Tandai selesai: ${name}`, exact: true })
      .click();
    await expect(itemCheck(page, 'task:t-fisika')).toBeChecked();
    await expect(itemCheck(page, 'task:t-fisika')).toHaveAccessibleName(`Batalkan selesai: ${name}`);

    await nav(page).getByRole('link', { name: 'Tugas' }).click();
    await page.getByRole('group', { name: 'Filter tugas' }).getByRole('button', { name: 'Selesai' }).click();
    const box = page.getByRole('checkbox', { name: 'Batalkan selesai: Kerjakan PR fisika', exact: true });
    await expect(box).toBeChecked();
    await box.click();
    await expect(box).toHaveCount(0);

    await gotoTab(page, 'Hari Ini');
    await expect(itemCheck(page, 'task:t-fisika')).not.toBeChecked();
    await expect(itemCheck(page, 'task:t-fisika')).toHaveAccessibleName(`Tandai selesai: ${name}`);

    expect(errors).toEqual([]);
  });

  test('10. Tenggat + Belum selesai sebelumnya: grup tertutup, centang → fokus, hapus + Urungkan → fokus', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('07:00'));
    await seed(page, {
      tasks: [
        taskRowData('t-kimia', 'Laporan kimia', { dueDate: '2026-10-26' }),
        taskRowData('t-sejarah', 'Rangkum sejarah', { dueDate: '2026-10-26' }),
        taskRowData('t-soal', 'Latihan soal', {
          scheduledDate: '2026-10-25',
          startTime: '09:00',
          durationMin: 60
        }),
        taskRowData('t-novel', 'Baca novel', {
          scheduledDate: '2026-10-24',
          startTime: '10:00',
          durationMin: 60
        })
      ]
    });

    // Tenggat hari ini.
    await expect(taskRow(dueGroup(page), 'Laporan kimia')).toBeVisible();
    await expect(taskRow(dueGroup(page), 'Rangkum sejarah')).toBeVisible();

    // Grup tertutup secara default; isinya tidak dirender.
    await expect(carriedToggle(page)).toHaveText('Belum selesai sebelumnya (2)');
    await expect(carriedToggle(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(carriedGroup(page)).toHaveCount(0);
    await carriedToggle(page).click();
    await expect(carriedToggle(page)).toHaveAttribute('aria-expanded', 'true');

    // Usulan #38: centang baris pertama → fokus ke baris berikutnya; centang yang terakhir → heading Agenda.
    const titles = await carriedGroup(page)
      .locator('li[data-task-id] [data-part="edit"] > span:first-child')
      .allInnerTexts();
    expect(titles).toHaveLength(2);
    await carriedGroup(page)
      .getByRole('checkbox', { name: `Tandai selesai: ${titles[0]}`, exact: true })
      .click();
    await expect(taskRow(carriedGroup(page), titles[0])).toHaveCount(0);
    await expect(carriedToggle(page)).toHaveText('Belum selesai sebelumnya (1)');
    await expect(
      carriedGroup(page).getByRole('checkbox', { name: `Tandai selesai: ${titles[1]}`, exact: true })
    ).toBeFocused();
    await page.keyboard.press('Space');
    await expect(carriedToggle(page)).toHaveCount(0);
    await expect(agendaHeading(page)).toBeFocused();

    // Usulan #35: hapus dari sheet ubah Tenggat → fokus ke baris lain; Urungkan → tombol ubah baris itu.
    await taskRow(dueGroup(page), 'Laporan kimia').locator('[data-part="edit"]').click();
    const sheet = page.getByRole('dialog', { name: 'Ubah tugas' });
    await sheet.getByRole('button', { name: 'Hapus tugas' }).click();
    await expect(sheet).toBeHidden();
    await expect(taskRow(dueGroup(page), 'Laporan kimia')).toHaveCount(0);
    await expect(taskRow(dueGroup(page), 'Rangkum sejarah').locator('[data-part="edit"]')).toBeFocused();
    await expect(toastBox(page)).toContainText('Dihapus');
    await undo(page).click();
    await expect(taskRow(dueGroup(page), 'Laporan kimia').locator('[data-part="edit"]')).toBeFocused();

    expect(errors).toEqual([]);
  });

  /** 4 rutin harian + 5 sholat = 9 item. */
  const nineItems = {
    routines: [
      routineRow('r1', 'Olahraga pagi', '06:00', 30),
      routineRow('r2', 'Sarapan', '07:00', 60),
      routineRow('r3', 'Belajar mandiri', '10:00', 60),
      routineRow('r4', 'Istirahat', '13:00', 60)
    ]
  };

  test('11. jendela 6 item + Lihat semua: expand di tempat, pendekkan → fokus di tombol', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('10:15'));
    await seed(page, nineItems);

    // Jangkar = Belajar mandiri (sedang berlangsung) → 2 sebelum + jangkar + 3 sesudah.
    await expect(agendaItems(page)).toHaveCount(6);
    await expect(agendaItems(page).first()).toHaveAttribute('data-key', 'routine:r1:2026-10-26');
    await expect(agendaItem(page, 'routine:r3:2026-10-26')).toHaveAttribute('data-status', 'now');
    await expect(agendaItem(page, 'routine:r3:2026-10-26')).toContainText('Sedang berlangsung');
    await expect(agendaItem(page, 'prayer:2026-10-26:subuh')).toHaveCount(0);

    await expect(expandButton(page)).toHaveText('Lihat semua');
    await expect(expandButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(expandButton(page)).toHaveAttribute('aria-controls', 'agenda-list');
    await expandButton(page).click();
    await expect(expandButton(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(expandButton(page)).toHaveText('Tampilkan lebih sedikit');
    await expect(agendaItems(page)).toHaveCount(9);

    // Fokus di item yang ikut tersembunyi; klik tanpa memindah fokus → fokus pindah ke tombol (Usulan #1).
    await itemCheck(page, 'prayer:2026-10-26:subuh').focus();
    await expandButton(page).dispatchEvent('click');
    await expect(agendaItems(page)).toHaveCount(6);
    await expect(expandButton(page)).toHaveAttribute('aria-expanded', 'false');
    await expect(expandButton(page)).toBeFocused();

    expect(errors).toEqual([]);
  });

  test('12. pill Berikutnya, pudar tanpa opacity + kontras ≥ 4.5:1, sholat dalam rentang tidak pudar, tulis gagal', async ({
    page
  }) => {
    // Skenario panjang: dua kunjungan ke /ibadah, seed, dua reload, dua tema.
    test.setTimeout(60_000);
    const errors = collectPageErrors(page);
    await openToday(page, at('07:00'));
    const dzuhur = await prayerMinutes(page, 'dzuhur');
    const ashar = await prayerMinutes(page, 'ashar');
    await seed(page, {
      subjects: [subjectRow('s-mtk', 'Matematika')],
      routines: [
        routineRow('r1', 'Olahraga pagi', '06:00', 30),
        routineRow('c1', 'Matematika', '07:00', 90, {
          kind: 'class',
          subjectId: 's-mtk',
          rrule: 'FREQ=WEEKLY;BYDAY=MO',
          location: 'R. 11B'
        })
      ],
      tasks: [
        taskRowData('t-soal', 'Latihan soal', {
          scheduledDate: '2026-10-26',
          startTime: '08:30',
          durationMin: 60
        }),
        taskRowData('t-kimia', 'Laporan kimia', { dueDate: '2026-10-26' })
      ]
    });

    // 30 menit setelah Dzuhur: blok 15 menit lewat, rentang fikih masih berjalan, belum dicatat.
    const nowMin = dzuhur + 30;
    await page.clock.setFixedTime(at(clock(nowMin).replace('.', ':')));
    await page.reload();
    await expect(agenda(page)).toBeVisible();

    const dz = agendaItem(page, 'prayer:2026-10-26:dzuhur');
    await expect(dz).toHaveAttribute('data-status', 'past');
    await expect(dz).not.toHaveAttribute('data-faded');
    await expect(itemCheck(page, 'prayer:2026-10-26:dzuhur')).toBeEnabled();

    // Tidak ada yang berjalan → Ashar = Berikutnya.
    const as = agendaItem(page, 'prayer:2026-10-26:ashar');
    await expect(as).toHaveAttribute('data-status', 'next');
    await expect(as).toContainText(`Berikutnya · ${countdown(ashar - nowMin).visual} lagi`);
    await expect(itemCheck(page, 'prayer:2026-10-26:ashar')).toBeDisabled();
    await expect(agendaItems(page).filter({ hasText: 'Sedang berlangsung' })).toHaveCount(0);

    // Item lewat pudar (8 item: buka semua agar item pagi ikut tampil).
    await expandButton(page).click();
    await expect(agendaItems(page)).toHaveCount(8);
    for (const key of ['routine:r1:2026-10-26', 'routine:c1:2026-10-26', 'task:t-soal'])
      await expect(agendaItem(page, key)).toHaveAttribute('data-faded', 'true');
    await expect(agendaItem(page, 'routine:c1:2026-10-26').locator('[data-part="meta"]')).toHaveText(
      'Kelas · R. 11B · sampai 08.30'
    );

    for (const theme of ['light', 'dark'] as const) {
      const results = await fadedContrast(page, theme);
      expect(results.length).toBeGreaterThanOrEqual(9);
      console.log(
        `[kontras pudar ${theme}] ` +
          results.map((r) => `${r.key}/${r.part}=${r.ratio.toFixed(2)}`).join(', ')
      );
      for (const r of results) {
        expect(r.opaque, `${r.key}/${r.part} memakai opacity`).toBe(true);
        expect(r.ratio, `${r.key}/${r.part} ${theme}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    await page.evaluate(() => document.documentElement.removeAttribute('data-theme'));

    // 2a: liveQuery Dexie tidak melihat hapus lewat IndexedDB mentah, jadi item tetap tampil dan repo melempar not-found.
    await rawDelete(page, 'routines', 'r1');
    await itemCheck(page, 'routine:r1:2026-10-26').click();
    await expect(toastBox(page)).toContainText('Coba muat ulang halaman ini.');
    await expect(itemCheck(page, 'routine:r1:2026-10-26')).not.toBeChecked();
    await toastBox(page).getByRole('button', { name: 'Tutup' }).click();
    await expect(toastBox(page).getByRole('button')).toHaveCount(0);

    // Baris TaskList: DOM dikembalikan lewat querySelector [data-part="check"].
    await rawDelete(page, 'tasks', 't-kimia');
    const kimia = taskRow(dueGroup(page), 'Laporan kimia').locator('[data-part="check"]');
    await kimia.click();
    await expect(toastBox(page)).toContainText('Coba muat ulang halaman ini.');
    await expect(kimia).not.toBeChecked();
    await page.reload();
    await expect(agenda(page)).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('13. kelas 11.30–12.30 bertepatan dengan Dzuhur', async ({ page }) => {
    const errors = collectPageErrors(page);
    await openToday(page, at('07:00'));
    await seed(page, {
      subjects: [subjectRow('s-fis', 'Fisika')],
      routines: [
        routineRow('c1', 'Fisika', '11:30', 60, {
          kind: 'class',
          subjectId: 's-fis',
          rrule: 'FREQ=WEEKLY;BYDAY=MO'
        })
      ]
    });
    const row = agendaItem(page, 'routine:c1:2026-10-26');
    await expect(row).toContainText('Bertepatan dengan waktu Dzuhur');
    await expect(row).not.toContainText('Bentrok');
    await expect(itemCheck(page, 'routine:c1:2026-10-26')).toHaveAccessibleName(
      'Tandai selesai: Fisika, kelas, 11.30–12.30'
    );

    expect(errors).toEqual([]);
  });

  test('15. tanpa lokasi: chip tidak dirender; setelah memilih Jakarta chip muncul', async ({ page }) => {
    const errors = collectPageErrors(page);
    await page.clock.setFixedTime(at('07:00'));
    await completeOnboarding(page);
    await expect(page.getByRole('heading', { name: 'Pilih lokasimu dulu' })).toBeVisible();
    await expect(chips(page)).toHaveCount(0);
    // Usulan #39: tanpa lokasi dan tanpa jadwal → teks kosong, tanpa list agenda.
    await expect(agenda(page).getByText('Belum ada jadwal hari ini.', { exact: true })).toBeVisible();
    await expect(agenda(page).locator('#agenda-list')).toHaveCount(0);

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

  test('16. agenda: centang sholat di zona New York menulis tanggal lokasi; hapus → Urungkan → fokus', async ({
    page
  }) => {
    const errors = collectPageErrors(page);
    // 07.00 WIB Senin 26 = 20.00 Minggu 25 di New York. Subuh Jakarta Senin (≈ 17.xx NY) tampil di agenda Minggu.
    await openToday(page, at('07:00'));
    const key = 'prayer:2026-10-26:subuh';
    const box = itemCheck(page, key);
    await expect(box).toHaveAccessibleName(/^Tandai sudah sholat: Subuh, sholat, 17\.\d{2}$/);
    await expect(box).not.toBeChecked();

    await box.click();
    await expect(box).toBeChecked();
    await expect.poll(() => storedIds(page, 'prayerLogs')).toContain('2026-10-26:subuh');
    expect(await storedIds(page, 'prayerLogs')).not.toContain('2026-10-25:subuh');

    await page.reload();
    await expect(box).toBeChecked();
    await expect(box).toHaveAccessibleName(/^Hapus catatan sholat: Subuh, sholat, 17\.\d{2}$/);
    await expect(agendaItem(page, key)).toHaveAttribute('data-faded', 'true');

    // Hapus centang → toast Urungkan → log pulih dan fokus kembali ke checkbox (Usulan #31).
    await box.click();
    await expect(box).not.toBeChecked();
    await expect(toastBox(page)).toContainText('Catatan Subuh dihapus');
    await expect.poll(() => storedIds(page, 'prayerLogs')).not.toContain('2026-10-26:subuh');
    await undo(page).click();
    await expect(box).toBeChecked();
    await expect(box).toBeFocused();
    expect(await storedIds(page, 'prayerLogs')).toContain('2026-10-26:subuh');

    expect(errors).toEqual([]);
  });
});
