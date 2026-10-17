# CLAUDE.md

Panduan kerja untuk Claude Code di repo ini. Baca seluruhnya sebelum mengerjakan tugas apa pun.

## Proyek

**Kala**: planner harian PWA untuk pelajar yang menyatukan jadwal belajar, ibadah, dan rutinitas. Gratis, tanpa akun, offline penuh, semua data di perangkat user (IndexedDB). Design system-nya bernama **Senja**.

Dokumen acuan, dibaca sesuai kebutuhan tugas:

| File | Isi | Kapan dibaca |
|---|---|---|
| `docs/PRD.md` | Scope, fitur, kriteria penerimaan, kasus pinggiran | Sebelum mengerjakan fitur apa pun: baca bagian fiturnya (F1–F9) dan §7 |
| `src/lib/domain/types.ts` | Model data, sumber kebenaran tipe | Sebelum menyentuh data |
| `src/lib/data/db.ts` | Skema Dexie | Sebelum query atau migrasi |
| `docs/design/SENJA.md` | Design system: prinsip, aturan warna, tipografi, ikon | Sebelum membuat atau mengubah UI |
| `src/app.css` | Token Senja sebagai CSS variables + tema Tailwind | Saat styling |

Jika permintaan bertentangan dengan PRD, tanyakan dulu. Jangan diam-diam mengikuti salah satunya.

## Stack

SvelteKit + Svelte 5 (runes) dengan `adapter-static` · TypeScript strict · Tailwind CSS v4 · shadcn-svelte (Bits UI) · Dexie (IndexedDB) + `liveQuery` · date-fns · rrule · adhan · ulidx · Valibot · @vite-pwa/sveltekit · Vitest · Playwright · pnpm · Cloudflare Pages.

Font di-self-host lewat `@fontsource-variable/manrope` dan `@fontsource/amiri`. Jangan memuat font dari Google Fonts CDN (app harus offline dan privat).

Jangan menambah dependensi baru tanpa bertanya dan menjelaskan alasannya. Saat menambah, pin versi persis (tanpa `^`).

## Perintah

```bash
pnpm install
pnpm dev            # server dev
pnpm check          # svelte-check + TypeScript
pnpm lint           # ESLint + Prettier
pnpm test           # Vitest (unit)
pnpm test:e2e       # Playwright
pnpm build && pnpm preview
```

Sebelum menyatakan tugas selesai, jalankan `pnpm check && pnpm lint && pnpm test`. Semuanya harus lolos.

## Struktur

```
src/
  app.css                  # token Senja, jangan tambah warna di luar ini
  lib/
    domain/                # LOGIKA MURNI: tanpa DOM, tanpa Dexie, tanpa Svelte
      types.ts
      recurrence.ts  prayer.ts  agenda.ts  hijri.ts  quickadd.ts  stats.ts  backup.ts
      *.test.ts            # test di sebelah file-nya
    data/
      db.ts                # skema Dexie
      repo/*.ts            # CRUD per entitas (satu-satunya tempat yang menulis ke db)
      cities.ts            # daftar kota offline (Fase 1: ≥100 kota)
    stores/                # state reaktif (.svelte.ts): today, settings, theme, now
    components/
      ui/                  # komponen shadcn-svelte yang sudah disesuaikan ke token Senja
      *.svelte             # komponen app: SkyCard, PrayerChips, AgendaList, BottomNav, QuickAddSheet, ...
  routes/                  # +page.svelte per tab (lihat PRD §3)
docs/                      # PRD dan design system
research/                  # TIDAK ADA di repo ini. Lihat "Larangan".
```

## Aturan kode

### Umum
- Svelte 5 runes saja (`$state`, `$derived`, `$effect`, `$props`). Jangan pakai sintaks Svelte 4 (`export let`, `$:`, stores `writable` untuk state baru).
- TypeScript strict, tanpa `any`. Tipe datang dari `types.ts`; jangan mendefinisikan ulang bentuk entitas di tempat lain.
- Nama variabel, fungsi, dan file dalam bahasa Inggris. Teks UI dalam bahasa Indonesia dengan sapaan "kamu".
- Teks UI dikumpulkan di `src/lib/copy.ts` (bukan tersebar di komponen) agar siap i18n.

### Domain
- Semua logika di `lib/domain/` adalah **fungsi murni**: input eksplisit, termasuk `now`. Tidak ada `new Date()` atau `Date.now()` di dalamnya.
- **Data turunan tidak disimpan.** Agenda, status sholat, status "terlewat", streak, dan statistik selalu dihitung.
- Setiap fungsi domain wajib punya unit test. Minimum: `recurrence`, `prayer` (termasuk uji akurasi vs jadwal Kemenag, PRD §F3.2), `agenda` (bentrok dan lane), `quickadd` (≥30 kasus), `hijri`, `backup`.

### Tanggal dan waktu
- Tanggal kalender = `LocalDate` (`'YYYY-MM-DD'`), jam = `LocalTime` (`'HH:mm'`). Hitungan jam memakai menit sejak tengah malam.
- Jangan pernah `new Date('2026-10-17')` (diparse sebagai UTC). Pakai helper di `lib/domain/dates.ts`.
- "Hari ini" hanya dari store `today` (diperbarui saat 00.00 dan saat `visibilitychange`). Tidak ada konstanta tanggal di level modul.

### Data
- Hanya `lib/data/repo/*` yang boleh menulis ke Dexie. Komponen membaca lewat `liveQuery` yang dibungkus store.
- ID baru pakai `ulid()` dari `ulidx`, kecuali ID deterministik (`Completion`, `PrayerLog`, `HabitLog`) yang memakai upsert.
- Hapus = isi `deletedAt` (soft delete). Setiap query menyaring `deletedAt === null`.
- Setiap tulis memperbarui `updatedAt`.
- Mengubah skema = versi Dexie baru + fungsi `upgrade` + test migrasi. Jangan mengedit versi yang sudah dirilis.
- Jangan pakai `localStorage` untuk data user. Boleh hanya untuk preferensi UI sepele (misalnya tab terakhir), dibungkus try/catch.

### UI dan desain
- **Hanya token Senja.** Pakai kelas Tailwind yang dipetakan di `app.css` (`bg-card`, `text-ink`, `text-muted`, `border-line`, `bg-brand text-on-brand`, `rounded-xl`, `text-heading-md`, ...). Tidak ada hex, `rgb()`, atau warna Tailwind bawaan (`bg-gray-100`, `text-red-500`) di komponen.
- Ikuti mockup canvas "Planner Hari Ini" untuk Hari Ini dan Ibadah. Untuk layar lain, pakai pola yang sama: kartu `bg-card border border-line rounded-xl p-5`, judul seksi `text-heading-md font-extrabold`, satu aksi utama `bg-brand` per layar.
- Tag jenis agenda: ibadah `bg-brand-soft text-brand-ink`, kelas `bg-class-soft text-class`, tugas `bg-teal-soft text-teal`, rutin/habit `bg-sunken text-muted`.
- Sholat terlewat dan tugas telat **tidak pernah** merah. `danger` hanya untuk galat dan aksi hapus.
- Mobile-first, lebar acuan 390 px. Target sentuh ≥ 44 px. Bottom nav 5 tab, form sebagai bottom sheet.
- Aksesibilitas: elemen interaktif harus `<button>`/`<a>`/`<input>` asli, ikon tanpa label diberi `aria-label`, status tidak dibedakan dari warna saja, teks Arab diberi `lang="ar" dir="rtl"`.
- Ikon: Lucide (`@lucide/svelte`), stroke 2, ukuran 20–24. Tidak ada emoji di UI.

### Keamanan dan privasi
- Jangan pakai `{@html}` dengan data apa pun yang berasal dari user atau file impor.
- Impor JSON wajib divalidasi dengan Valibot sebelum menyentuh database.
- Tidak ada request jaringan selain aset app sendiri dan Cloudflare Web Analytics. Jangan menambah SDK pihak ketiga.
- CSP dan header keamanan dikelola di `static/_headers`.

## Cara bekerja

1. **Pahami dulu.** Baca bagian PRD yang relevan. Untuk tugas yang menyentuh lebih dari 3 file atau mengubah model data, buat rencana singkat dan tunggu persetujuan sebelum menulis kode.
2. **Domain dulu, UI kemudian.** Untuk fitur baru: tipe → fungsi domain + test → repo → store → komponen → route.
3. **Kecil dan bisa ditinjau.** Satu fitur = satu branch `feat/<id>-<nama>` (misal `feat/f3-prayer-times`), commit kecil dengan Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`, `chore:`, `docs:`).
4. **Jangan menebak keputusan produk.** Jika PRD tidak mengatur sesuatu (teks, perilaku, kasus pinggiran), tanyakan atau catat sebagai pertanyaan terbuka di PRD §10. Jangan menciptakan fitur di luar scope fase yang sedang dikerjakan.
5. **Perbarui dokumen.** Jika keputusan baru diambil, perbarui `docs/PRD.md` di commit yang sama.

## Definition of Done

- [ ] Kriteria penerimaan fitur di PRD terpenuhi
- [ ] `pnpm check`, `pnpm lint`, `pnpm test` lolos
- [ ] Logika baru di `lib/domain/` punya unit test
- [ ] Hanya token Senja yang dipakai; tampil benar di tema terang dan gelap
- [ ] Berfungsi di lebar 360 px dan offline
- [ ] Navigasi keyboard dan fokus terlihat
- [ ] Teks UI ada di `copy.ts`

## Larangan

- Jangan menyalin kode, teks, nama, warna, atau aset dari aplikasi lain, termasuk aplikasi referensi yang pernah dianalisis. Folder `research/` sengaja tidak dimasukkan ke repo ini.
- Jangan menambah backend, akun, sinkronisasi, atau push notification (di luar scope, PRD §2).
- Jangan menampilkan teks Al-Qur'an atau terjemahannya.
- Jangan memasukkan teks doa/dzikir tanpa sumber yang dicatat di `docs/sumber-konten.md`.
- Jangan menjalankan perintah yang menghapus data user atau riwayat git tanpa izin eksplisit.
