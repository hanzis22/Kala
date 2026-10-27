import { expect, test, type Locator, type Page } from '@playwright/test';
import { collectPageErrors, completeOnboarding, gotoDay, nav } from './helpers';

// Jam dipatok: Senin 26 Okt 2026 10.00 WIB. Toast urungkan tanpa timer, jadi tidak ada penantian waktu.
const NOW = new Date('2026-10-26T10:00:00+07:00');
const DAY_MS = 86_400_000;

type TaskSpec = {
  title: string;
  dueDate?: string;
  dueTime?: string;
  scheduled?: { date: string; start: string; duration: string };
  subject?: string;
};

async function setup(page: Page) {
  const errors = collectPageErrors(page);
  await page.clock.setFixedTime(NOW);
  await completeOnboarding(page);
  await nav(page).getByRole('link', { name: 'Tugas' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Tugas' })).toBeVisible();
  return errors;
}

async function fillTask(sheet: Locator, spec: TaskSpec) {
  await sheet.getByLabel('Judul', { exact: true }).fill(spec.title);
  if (spec.subject)
    await sheet.getByRole('combobox', { name: /^Mapel/ }).selectOption({ label: spec.subject });
  if (spec.dueDate) await sheet.getByLabel('Tanggal tenggat').fill(spec.dueDate);
  if (spec.dueTime) await sheet.getByLabel('Jam tenggat').fill(spec.dueTime);
  if (spec.scheduled) {
    await sheet.getByRole('switch', { name: 'Jadwalkan pengerjaan' }).click();
    await sheet.getByLabel('Tanggal pengerjaan').fill(spec.scheduled.date);
    await sheet.getByLabel('Jam mulai').fill(spec.scheduled.start);
    await sheet.getByLabel('Durasi (menit)').fill(spec.scheduled.duration);
  }
}

/** Menambah tugas lewat FAB di /tugas. */
async function addTask(page: Page, spec: TaskSpec) {
  await page.getByRole('button', { name: 'Tambah tugas' }).click();
  const sheet = page.getByRole('dialog', { name: 'Tambah tugas' });
  await fillTask(sheet, spec);
  await sheet.getByRole('button', { name: 'Simpan' }).click();
  await expect(sheet).toBeHidden();
}

const rows = (page: Page) => page.locator('li[data-task-id]');
const row = (scope: Page | Locator, title: string) =>
  scope.locator('li[data-task-id]').filter({ hasText: title });
const editOf = (scope: Page | Locator, title: string) => row(scope, title).locator('[data-part="edit"]');
const checkOf = (scope: Page | Locator, title: string) => row(scope, title).locator('[data-part="check"]');
const undoToast = (page: Page) => page.locator('[role="status"] > div').filter({ hasText: 'Dihapus' });
const tasksHeading = (page: Page) => page.getByRole('heading', { level: 1, name: 'Tugas' });

async function selectFilter(page: Page, name: string) {
  const button = page.getByRole('group', { name: 'Filter tugas' }).getByRole('button', { name, exact: true });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
}

/** Buka sheet ubah dari baris lalu "Hapus tugas". */
async function deleteVia(page: Page, scope: Page | Locator, title: string) {
  await editOf(scope, title).click();
  const sheet = page.getByRole('dialog', { name: 'Ubah tugas' });
  await sheet.getByRole('button', { name: 'Hapus tugas' }).click();
  await expect(sheet).toBeHidden();
  await expect(row(scope, title)).toHaveCount(0);
  await expect(undoToast(page)).toBeVisible();
}

/**
 * Tab sungguhan sampai fokus masuk ke `target`. Elemen yang fokus tepat sebelum Tab terakhir ditandai
 * `data-e2e-before` dan dikembalikan sebagai locator (= relatedTarget saat masuk toast).
 */
async function tabInto(page: Page, target: Locator, maxSteps = 30): Promise<Locator> {
  for (let i = 0; i < maxSteps; i++) {
    await page.evaluate(() => {
      document.querySelector('[data-e2e-before]')?.removeAttribute('data-e2e-before');
      document.activeElement?.setAttribute('data-e2e-before', '');
    });
    await page.keyboard.press('Tab');
    if (await target.evaluate((el) => el.contains(document.activeElement))) {
      return page.locator('[data-e2e-before]');
    }
  }
  throw new Error(`tabInto: fokus belum masuk setelah ${maxSteps} Tab`);
}

async function showDay(page: Page) {
  await nav(page).getByRole('link', { name: 'Jadwal' }).click();
  await page.getByRole('button', { name: 'Hari', exact: true }).click();
  await expect(page.locator('#day-heading')).toBeVisible();
}

const dayCard = (page: Page) => page.locator('section[aria-labelledby="day-heading"]');
const dueSection = (page: Page) => page.locator('[aria-labelledby="day-due-heading"]');
const EMPTY_DAY = 'Tidak ada kelas, rutin, kegiatan, atau jadwal tugas di hari ini.';

test('(a) tenggat saja tampil di "Tenggat hari ini", tanpa blok jam', async ({ page }) => {
  const errors = await setup(page);
  await addTask(page, { title: 'PR Fisika', dueDate: '2026-10-26', dueTime: '13:00' });

  await showDay(page);
  await expect(dueSection(page).getByRole('heading', { name: 'Tenggat hari ini' })).toBeVisible();
  await expect(row(dueSection(page), 'PR Fisika')).toContainText('Tenggat Sen, 26 Okt · 13.00');
  await expect(dayCard(page).getByRole('button', { name: /PR Fisika, tugas,/ })).toHaveCount(0);
  // Agenda kosong (Tenggat tidak dihitung): keduanya tampil.
  await expect(dayCard(page)).toContainText(EMPTY_DAY);
  expect(errors).toEqual([]);
});

test('(b) jadwal pengerjaan jadi blok bertag "Tugas" di hari itu saja', async ({ page }) => {
  const errors = await setup(page);
  await addTask(page, {
    title: 'Rangkuman Sejarah',
    scheduled: { date: '2026-10-28', start: '16:00', duration: '90' }
  });
  await addTask(page, {
    title: 'Kuis Kimia',
    dueDate: '2026-10-28',
    scheduled: { date: '2026-10-28', start: '19:00', duration: '30' }
  });
  await addTask(page, { title: 'Laporan Praktikum', dueDate: '2026-10-28' });

  await showDay(page);
  await expect(dayCard(page).getByRole('button', { name: /Rangkuman Sejarah/ })).toHaveCount(0);
  await expect(dueSection(page)).toHaveCount(0);

  await gotoDay(page, '2026-10-28');
  const block = dayCard(page).getByRole('button', { name: /Rangkuman Sejarah, tugas, 16\.00–17\.30/ });
  await expect(block).toBeVisible();
  await expect(block).toContainText('Tugas');
  // Tenggat + jadwal di hari yang sama: hanya blok.
  await expect(dayCard(page).getByRole('button', { name: /Kuis Kimia, tugas, 19\.00–19\.30/ })).toBeVisible();
  await expect(dueSection(page).getByRole('heading', { name: 'Tenggat 28 Okt' })).toBeVisible();
  await expect(row(dueSection(page), 'Laporan Praktikum')).toHaveCount(1);
  await expect(row(dueSection(page), 'Kuis Kimia')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('(c) filter Semua / Hari ini / Minggu ini / Selesai', async ({ page }) => {
  const errors = await setup(page);
  await addTask(page, { title: 'Tanpa Tenggat' });
  await addTask(page, { title: 'Tenggat Jumat', dueDate: '2026-10-30' });
  await addTask(page, { title: 'Tenggat Hari Ini', dueDate: '2026-10-26' });
  await addTask(page, { title: 'Tenggat Kemarin', dueDate: '2026-10-25' });

  const count = page.getByText(/^\d+ tugas$/);
  await expect(rows(page)).toHaveText([
    /^\s*Tenggat Kemarin/,
    /^\s*Tenggat Hari Ini/,
    /^\s*Tenggat Jumat/,
    /^\s*Tanpa Tenggat/
  ]);
  await expect(count).toHaveText('4 tugas');

  await selectFilter(page, 'Hari ini');
  await expect(rows(page)).toHaveText([/^\s*Tenggat Kemarin/, /^\s*Tenggat Hari Ini/]);
  await expect(row(page, 'Tenggat Kemarin')).toContainText('Lewat tenggat');
  await expect(row(page, 'Tenggat Hari Ini')).not.toContainText('Lewat tenggat');
  await expect(count).toHaveText('2 tugas');
  await expect(page.getByRole('button', { name: 'Semua', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false'
  );

  await selectFilter(page, 'Minggu ini');
  await expect(rows(page)).toHaveText([/^\s*Tenggat Kemarin/, /^\s*Tenggat Hari Ini/, /^\s*Tenggat Jumat/]);
  await expect(count).toHaveText('3 tugas');

  await selectFilter(page, 'Selesai');
  await expect(rows(page)).toHaveCount(0);
  await expect(count).toHaveText('0 tugas');
  expect(errors).toEqual([]);
});

test('(c) Simpan dua kali cepat di sheet tambah hanya menyimpan satu tugas', async ({ page }) => {
  const errors = await setup(page);
  await page.getByRole('button', { name: 'Tambah tugas' }).click();
  const sheet = page.getByRole('dialog', { name: 'Tambah tugas' });
  await fillTask(sheet, { title: 'Sekali Saja' });
  await sheet.locator('form').evaluate((f: HTMLFormElement) => {
    f.requestSubmit();
    f.requestSubmit();
  });
  await expect(sheet).toBeHidden();
  await expect(rows(page)).toHaveCount(1);
  await page.reload();
  await expect(row(page, 'Sekali Saja')).toHaveCount(1);
  await expect(rows(page)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('(d) tandai selesai: pindah ke Selesai, tercoret tanpa centang di Hari, bisa dibatalkan', async ({
  page
}) => {
  const errors = await setup(page);
  await addTask(page, { title: 'Esai Bahasa', dueDate: '2026-10-26' });
  await addTask(page, {
    title: 'Latihan Soal',
    scheduled: { date: '2026-10-26', start: '16:00', duration: '60' }
  });

  await checkOf(page, 'Esai Bahasa').click();
  await expect(row(page, 'Esai Bahasa')).toHaveCount(0);
  await checkOf(page, 'Latihan Soal').click();
  await expect(rows(page)).toHaveCount(0);
  await selectFilter(page, 'Selesai');
  await expect(row(page, 'Esai Bahasa')).toHaveCount(1);
  await expect(row(page, 'Latihan Soal')).toHaveCount(1);

  await showDay(page);
  await expect(editOf(dueSection(page), 'Esai Bahasa')).toHaveAccessibleName(/, selesai\. Ubah$/);
  await expect(row(dueSection(page), 'Esai Bahasa').locator('.line-through')).toHaveCount(1);
  const block = dayCard(page).getByRole('button', {
    name: /Latihan Soal, tugas, 16\.00–17\.00, selesai\. Ubah/
  });
  await expect(block.locator('.line-through')).toHaveCount(1);
  await expect(dayCard(page).locator('input[type="checkbox"]')).toHaveCount(0);

  await nav(page).getByRole('link', { name: 'Tugas' }).click();
  await selectFilter(page, 'Selesai');
  await checkOf(page, 'Esai Bahasa').click();
  await expect(row(page, 'Esai Bahasa')).toHaveCount(0);
  await selectFilter(page, 'Semua');
  await expect(row(page, 'Esai Bahasa')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('(d) centang dengan Space memindah fokus ke checkbox berikutnya, lalu ke heading', async ({ page }) => {
  const errors = await setup(page);
  await addTask(page, { title: 'Satu', dueDate: '2026-10-27' });
  await addTask(page, { title: 'Dua', dueDate: '2026-10-28' });

  await checkOf(page, 'Satu').focus();
  await page.keyboard.press('Space');
  await expect(row(page, 'Satu')).toHaveCount(0);
  await expect(checkOf(page, 'Dua')).toBeFocused();

  await page.keyboard.press('Space');
  await expect(rows(page)).toHaveCount(0);
  await expect(tasksHeading(page)).toBeFocused();
  expect(errors).toEqual([]);
});

test('(e) hapus → urungkan, fokus berikutnya/sebelumnya/heading, ✕ dan Escape, tanpa timer', async ({
  page
}) => {
  const errors = await setup(page);
  await addTask(page, { title: 'Tugas A', dueDate: '2026-10-27' });
  await addTask(page, { title: 'Tugas B', dueDate: '2026-10-28' });
  await addTask(page, { title: 'Tugas C', dueDate: '2026-10-29' });

  // Hapus baris tengah → fokus ke berikutnya; Urungkan → baris kembali dan difokus.
  await deleteVia(page, page, 'Tugas B');
  await expect(undoToast(page)).toContainText('Urungkan');
  await expect(editOf(page, 'Tugas C')).toBeFocused();
  await undoToast(page).getByRole('button', { name: 'Urungkan' }).click();
  await expect(undoToast(page)).toBeHidden();
  await expect(editOf(page, 'Tugas B')).toBeFocused();

  // Hapus baris terakhir → fokus ke sebelumnya. Lompat ke toast (meniru quick-nav pembaca layar)
  // → Tab ke ✕ → Enter → fokus kembali ke elemen asal (relatedTarget, keputusan P3.1) = baris B.
  await deleteVia(page, page, 'Tugas C');
  await expect(editOf(page, 'Tugas B')).toBeFocused();
  await undoToast(page).getByRole('button', { name: 'Urungkan' }).focus();
  await page.keyboard.press('Tab');
  await expect(undoToast(page).getByRole('button', { name: 'Tutup' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(undoToast(page)).toBeHidden();
  await expect(editOf(page, 'Tugas B')).toBeFocused();

  // Ditutup lewat ✕ → reload → tetap terhapus.
  await page.reload();
  await expect(rows(page)).toHaveText([/^\s*Tugas A/, /^\s*Tugas B/]);

  // Escape di dalam toast (jalur lompat) → toast tertutup, fokus kembali ke baris B.
  await deleteVia(page, page, 'Tugas A');
  await expect(editOf(page, 'Tugas B')).toBeFocused();
  await undoToast(page).getByRole('button', { name: 'Urungkan' }).focus();
  await page.keyboard.press('Escape');
  await expect(undoToast(page)).toBeHidden();
  await expect(editOf(page, 'Tugas B')).toBeFocused();

  // Tab sungguhan dari baris B sampai masuk toast → ✕ → fokus kembali ke elemen tepat sebelum toast.
  await addTask(page, { title: 'Tugas D', dueDate: '2026-10-29' });
  await deleteVia(page, page, 'Tugas D');
  await expect(editOf(page, 'Tugas B')).toBeFocused();
  const before = await tabInto(page, undoToast(page));
  await expect(before).toHaveCount(1);
  await expect(undoToast(page).locator('[data-e2e-before]')).toHaveCount(0);
  await expect(undoToast(page).getByRole('button', { name: 'Urungkan' })).toBeFocused();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(undoToast(page)).toBeHidden();
  await expect(before).toBeFocused();

  // Hapus satu-satunya → fokus ke heading; toast tetap ada setelah 10 detik nyata.
  await deleteVia(page, page, 'Tugas B');
  await expect(tasksHeading(page)).toBeFocused();
  await page.waitForTimeout(10_500);
  await expect(undoToast(page)).toBeVisible();
  expect(errors).toEqual([]);
});

test('(e) Hari ini: hapus baris terakhir grup utama → fokus ke baris pertama "Belum selesai sebelumnya"', async ({
  page
}) => {
  const errors = await setup(page);
  await addTask(page, { title: 'Utama', dueDate: '2026-10-26' });
  await addTask(page, {
    title: 'Lanjutan',
    scheduled: { date: '2026-10-23', start: '16:00', duration: '60' }
  });

  await selectFilter(page, 'Hari ini');
  const carried = page.locator('section[aria-labelledby="carried-over-heading"]');
  await expect(row(carried, 'Lanjutan')).toHaveCount(1);
  await deleteVia(page, page, 'Utama');
  await expect(editOf(carried, 'Lanjutan')).toBeFocused();
  expect(errors).toEqual([]);
});

test('(e) hapus dari sheet di Hari /jadwal: fokus ke baris tugas berikutnya, urungkan, lalu heading hari', async ({
  page
}) => {
  const errors = await setup(page);
  await addTask(page, { title: 'Baca Bab 2', dueDate: '2026-10-26' });
  await addTask(page, {
    title: 'Kerjakan Soal',
    scheduled: { date: '2026-10-26', start: '16:00', duration: '60' }
  });

  await showDay(page);
  const card = dayCard(page);
  // Urutan tampil: Tenggat dulu, lalu blok.
  await deleteVia(page, card, 'Baca Bab 2');
  await expect(editOf(card, 'Kerjakan Soal')).toBeFocused();

  await undoToast(page).getByRole('button', { name: 'Urungkan' }).click();
  await expect(row(dueSection(page), 'Baca Bab 2')).toHaveCount(1);
  await expect(editOf(card, 'Baca Bab 2')).toBeFocused();

  await deleteVia(page, card, 'Baca Bab 2');
  await expect(editOf(card, 'Kerjakan Soal')).toBeFocused();
  await deleteVia(page, card, 'Kerjakan Soal');
  await expect(page.locator('#day-heading')).toBeFocused();
  await expect(card).toContainText(EMPTY_DAY);
  expect(errors).toEqual([]);
});

test('(f) bersihkan yang selesai lebih dari 7 hari', async ({ page }) => {
  const errors = await setup(page);
  await addTask(page, { title: 'Lama Satu' });
  await addTask(page, { title: 'Lama Dua' });
  await checkOf(page, 'Lama Satu').click();
  await checkOf(page, 'Lama Dua').click();
  await expect(rows(page)).toHaveCount(0);

  const clear = page.getByRole('button', { name: 'Bersihkan yang selesai' });

  // Store `now` hanya membaca jam baru saat reload / ganti menit.
  await page.clock.setFixedTime(new Date(NOW.getTime() + 7 * DAY_MS - 60_000));
  await page.reload();
  await selectFilter(page, 'Selesai');
  await expect(rows(page)).toHaveCount(2);
  await expect(clear).toHaveCount(0);

  await page.clock.setFixedTime(new Date(NOW.getTime() + 7 * DAY_MS + 60_000));
  await page.reload();
  await selectFilter(page, 'Selesai');
  await clear.click();
  const dialog = page.getByRole('alertdialog', { name: 'Bersihkan 2 tugas?' });
  await dialog.getByRole('button', { name: 'Batal' }).click();
  await expect(dialog).toBeHidden();
  await expect(rows(page)).toHaveCount(2);

  await clear.click();
  await dialog.getByRole('button', { name: 'Bersihkan' }).click();
  await expect(dialog).toBeHidden();
  await expect(rows(page)).toHaveCount(0);
  await expect(page.getByText('Belum ada tugas selesai')).toBeVisible();
  await expect(
    page.locator('[role="status"] > div').filter({ hasText: '2 tugas dibersihkan' })
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('(g) tugas tetap ada setelah reload offline, dan bisa ditambah saat offline', async ({
  page,
  context
}) => {
  const errors = await setup(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await addTask(page, { title: 'Daring' });
  await context.setOffline(true);
  await page.reload();
  await expect(row(page, 'Daring')).toHaveCount(1);

  await addTask(page, { title: 'Luring' });
  await page.reload();
  await expect(row(page, 'Daring')).toHaveCount(1);
  await expect(row(page, 'Luring')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('(i) mapel dihapus: tugas tetap ada dengan "(dihapus)"', async ({ page }) => {
  const errors = await setup(page);
  await page.goto('/jadwal/mapel');
  await page.getByRole('button', { name: 'Tambah mapel' }).click();
  const subjectSheet = page.getByRole('dialog', { name: 'Tambah mapel' });
  await subjectSheet.getByLabel('Nama mapel').fill('Kimia');
  await subjectSheet.getByRole('button', { name: 'Simpan' }).click();
  await expect(subjectSheet).toBeHidden();

  await page.goto('/tugas');
  await addTask(page, { title: 'Laporan Titrasi', subject: 'Kimia' });
  await expect(row(page, 'Laporan Titrasi')).toContainText('Kimia');

  await page.goto('/jadwal/mapel');
  await page.getByRole('button', { name: 'Ubah Kimia' }).click();
  await page.getByRole('dialog', { name: 'Ubah mapel' }).getByRole('button', { name: 'Hapus mapel' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Ya, hapus' }).click();
  await expect(page.getByRole('button', { name: 'Ubah Kimia' })).toHaveCount(0);

  await page.goto('/tugas');
  await expect(row(page, 'Laporan Titrasi')).toContainText('Kimia (dihapus)');
  expect(errors).toEqual([]);
});

test('(j) filter dan centang bisa dengan keyboard, target sentuh ≥ 44 px', async ({ page }) => {
  const errors = await setup(page);
  await addTask(page, { title: 'Ringkas Materi', dueDate: '2026-10-26' });

  const group = page.getByRole('group', { name: 'Filter tugas' });
  await group.getByRole('button', { name: 'Semua', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(group.getByRole('button', { name: 'Hari ini', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(group.getByRole('button', { name: 'Hari ini', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.keyboard.press('Tab');
  await page.keyboard.press('Space');
  await expect(group.getByRole('button', { name: 'Minggu ini', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  for (const button of await group.getByRole('button').all()) {
    expect((await button.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  }
  const target = await row(page, 'Ringkas Materi').locator('label').boundingBox();
  expect(target?.height).toBeGreaterThanOrEqual(44);
  expect(target?.width).toBeGreaterThanOrEqual(44);
  const fab = await page.getByRole('button', { name: 'Tambah tugas' }).boundingBox();
  expect(fab?.height).toBeGreaterThanOrEqual(44);

  await checkOf(page, 'Ringkas Materi').focus();
  await page.keyboard.press('Space');
  await selectFilter(page, 'Selesai');
  await expect(checkOf(page, 'Ringkas Materi')).toBeChecked();
  expect(errors).toEqual([]);
});

test('(k) "Belum selesai sebelumnya" di filter Hari ini, tanpa duplikat', async ({ page }) => {
  const errors = await setup(page);
  await addTask(page, {
    title: 'Jumat Tanpa Tenggat',
    scheduled: { date: '2026-10-23', start: '16:00', duration: '60' }
  });
  await addTask(page, {
    title: 'Jumat Tenggat Depan',
    dueDate: '2026-10-30',
    scheduled: { date: '2026-10-23', start: '17:00', duration: '60' }
  });
  await addTask(page, {
    title: 'Kemarin Lewat',
    dueDate: '2026-10-25',
    scheduled: { date: '2026-10-25', start: '16:00', duration: '60' }
  });

  await selectFilter(page, 'Hari ini');
  const carried = page.locator('section[aria-labelledby="carried-over-heading"]');
  await expect(carried.getByRole('heading', { name: 'Belum selesai sebelumnya' })).toBeVisible();
  await expect(carried.locator('li[data-task-id]')).toHaveText([
    /^\s*Jumat Tanpa Tenggat/,
    /^\s*Jumat Tenggat Depan/
  ]);
  await expect(row(carried, 'Kemarin Lewat')).toHaveCount(0);
  await expect(row(page, 'Kemarin Lewat')).toHaveCount(1);
  await expect(row(page, 'Kemarin Lewat')).toContainText('Lewat tenggat');
  await expect(rows(page)).toHaveCount(3);
  await expect(page.getByText(/^\d+ tugas$/)).toHaveText('3 tugas');
  expect(errors).toEqual([]);
});
