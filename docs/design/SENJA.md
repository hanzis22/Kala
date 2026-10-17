# Senja

Design system untuk planner pelajar yang menyatukan jadwal belajar, ibadah, dan rutinitas harian. Rasanya seperti langit saat Maghrib: hangat, tenang, dan tidak terburu-buru. Netral gender, nyaman dilihat lama, dan jelas dibaca di HP kelas menengah.

> Nama "Senja" adalah nama kerja untuk sistem ini. Ganti di sini dan di `tokens.json` kalau aplikasinya sudah punya nama sendiri.

## Prinsip

1. **Satu identitas sepanjang hari.** Palet Maghrib adalah warna brand dan tidak berubah dari pagi sampai malam. Perubahan waktu hanya terasa di kartu waktu sholat (`sky-fajar` atau `sky-senja`) dan di penanda matahari/bulan. Malam hari memakai tema gelap dengan rasa yang sama, bukan palet baru.
2. **Tenang dulu, baru informatif.** Banyak ruang kosong, garis tipis, tanpa bayangan di kartu. Satu aksen kuat per layar: tombol atau item yang sedang berlangsung memakai `brand`, sisanya netral.
3. **Ibadah dan belajar setara.** Sholat, kelas, tugas, dan habit tampil di timeline yang sama. Jenisnya dibedakan lewat tag berwarna lembut, bukan lewat layout yang berbeda.
4. **Netral gender.** Terakota, teal, krem, dan cokelat. Hindari pink/ungu dominan, hitam-merah agresif, emoji, maskot, dan ilustrasi orang.

## Warna

Semua warna punya pasangan terang dan gelap. Komponen hanya memakai token, tidak pernah hex langsung.

| Peran | Token | Dipakai untuk |
|---|---|---|
| Latar | `surface-ground` | Seluruh halaman |
| Kartu | `surface-card` + tepi `line` | Kartu seksi, bottom nav, sheet |
| Teks | `ink`, `ink-muted` | Teks utama dan sekunder |
| Aksen utama | `brand` + `on-brand` | Tombol utama, FAB, chip sholat sedang berlangsung, centang aktif |
| Sorotan lembut | `brand-soft` + `brand-ink` | Tag ibadah, kartu tilawah, tautan, nav aktif |
| Sekunder | `teal-soft` + `teal` | Tag tugas, badge streak, kartu hitung mundur |
| Kelas | `class-soft` + `class` | Tag mata pelajaran |
| Kartu langit | `sky-fajar` / `sky-senja` + `sky-ink`, `sky-ink-muted` | Kartu waktu sholat saja |
| Di dalam kartu langit | `sky-surface`, `sky-line` | Panel Imsak/Terbit, pemisah baris sholat, tombol garis |
| Dekor | `sun` | Matahari/bulan di lengkung waktu sholat |
| Galat | `danger` | Pesan galat, aksi hapus |
| Interaksi | `brand-pressed`, `focus-ring`, `ink-disabled` | Tombol ditekan, fokus keyboard, elemen nonaktif |
| Lapisan | `scrim` | Latar di belakang bottom sheet dan dialog |

**Sholat terlewat tidak berwarna merah.** Tampilkan sebagai kotak `surface-sunken` dengan tepi `line`. Aplikasi ini mendorong kebiasaan, bukan menghakimi. `danger` hanya untuk galat dan aksi hapus.

**Fokus keyboard:** `outline: 2px solid var(--focus-ring); outline-offset: 2px` di semua elemen interaktif, termasuk di atas tombol brand.

**Aturan kartu langit:** pakai `sky-fajar` dari Subuh sampai sebelum Ashar, `sky-senja` dari Ashar sampai Isya. Setelah Isya, aplikasi boleh otomatis pindah ke tema gelap (kalau user memilih "ikuti waktu sholat" di pengaturan), dan `sun` tampil sebagai bulan sabit.

**Tag jenis agenda** selalu pasangan *soft* + teksnya: ibadah `brand-soft`/`brand-ink`, kelas `class-soft`/`class`, tugas `teal-soft`/`teal`, rutin dan habit `surface-sunken`/`ink-muted`.

## Tipografi

- **Manrope** (Google Fonts, 400–800) untuk seluruh UI. Bulat dan ramah tapi tetap tegas. Angka jam dan hitung mundur memakai `display` atau `heading-xl` dengan letter-spacing sedikit rapat (-0.02em sampai -0.03em).
- **Amiri** untuk teks Arab pendek (basmalah, doa, dzikir), gaya `arabic`, selalu dengan `lang="ar"` dan `dir="rtl"`.
- `overline` ditulis huruf kapital dengan letter-spacing 0.04em, untuk label kecil seperti "WAKTU MAGHRIB" atau "HITUNG MUNDUR".
- Ukuran teks terkecil 12px. Jangan pakai berat di bawah 500 untuk teks berukuran 12–13px.

## Ruang dan bentuk

- Grid dasar 4px. Gutter halaman `space-5` (20px), jarak antar seksi `space-5`, padding kartu besar `space-5`, kartu kecil `space-4`.
- Radius naik sesuai ukuran elemen: tag `radius-sm`, tombol `radius-md`, chip dan item agenda `radius-lg`, kartu seksi `radius-xl`, kartu langit `radius-2xl`, pill `radius-full`.
- Kartu dipisahkan dengan tepi `line` 1px, bukan bayangan. Satu-satunya bayangan adalah `shadow-fab`.
- Target sentuh minimal 44×44px. Bottom nav setinggi 84px dengan 5 tab.

## Ikon

Garis (stroke) 2px, ujung dan sudut membulat, grid 24×24, warna mengikuti teks (`currentColor`). Ikon aktif di nav memakai `brand-ink`, tidak aktif `ink-muted`. Tidak ada emoji di UI. Ikon tanpa label wajib punya `aria-label`. Pustaka yang cocok dengan gaya ini: Lucide.

## Aksesibilitas

- Semua pasangan teks di tabel warna lolos kontras 4.5:1 di tema terang dan gelap.
- Status tidak boleh dibedakan dari warna saja: chip sholat memakai ikon centang (sudah), titik penuh (sedang), dan lingkaran kosong (belum); item agenda yang sedang berjalan memakai pill teks "Sedang berlangsung".
- Hormati `prefers-reduced-motion`: matikan transisi tema dan animasi centang.

## Untuk developer (Claude Code)

Token ini diterjemahkan jadi CSS custom properties dengan nama yang sama (`--brand`, `--surface-card`, `--radius-xl`, dan seterusnya). Tema gelap aktif lewat `prefers-color-scheme: dark` atau atribut `data-theme="dark"` di `<html>`. Contoh integrasi Tailwind v4:

```css
@import "tailwindcss";

:root {
  --surface-ground: #F7EFE6; --surface-card: #FFFCF8; --surface-sunken: #F0E4D8; --line: #EADBCB;
  --ink: #2A1F19; --ink-muted: #6A564A;
  --brand: #A3461F; --on-brand: #FFFFFF; --brand-soft: #F6DECF; --brand-ink: #7A3416;
  --teal: #2B6661; --teal-soft: #DCECE9; --class: #3B4F88; --class-soft: #E7E8F2;
  --sky-fajar: #F5E3CB; --sky-senja: #F1CDB1; --sky-ink: #3A1E10; --sky-ink-muted: #6B412C;
  --sun: #D98B2B; --danger: #B3261E;
  --sky-surface: rgba(255,252,248,0.55); --sky-line: rgba(58,30,16,0.18);
  --brand-pressed: #86391A; --focus-ring: #2B6661; --ink-disabled: #A8968A; --scrim: rgba(42,31,25,0.45);
}
:root[data-theme="dark"] {
  --surface-ground: #17110E; --surface-card: #221A15; --surface-sunken: #2C221C; --line: #3A2D25;
  --ink: #F2E8E0; --ink-muted: #BBA898;
  --brand: #E58A5E; --on-brand: #1A110C; --brand-soft: #3A2419; --brand-ink: #F2B394;
  --teal: #8CC9BE; --teal-soft: #1E302D; --class: #B4C0EC; --class-soft: #262A3D;
  --sky-fajar: #2B1D17; --sky-senja: #3A2419; --sky-ink: #F5EAE2; --sky-ink-muted: #C4AE9E;
  --sun: #F1E3B5; --danger: #F2B8B5;
  --sky-surface: rgba(23,17,14,0.45); --sky-line: rgba(245,234,226,0.18);
  --brand-pressed: #F0A27C; --focus-ring: #8CC9BE; --ink-disabled: #6E5E53; --scrim: rgba(0,0,0,0.6);
}

@theme inline {
  --color-ground: var(--surface-ground);
  --color-card: var(--surface-card);
  --color-sunken: var(--surface-sunken);
  --color-line: var(--line);
  --color-ink: var(--ink);
  --color-muted: var(--ink-muted);
  --color-brand: var(--brand);
  --color-on-brand: var(--on-brand);
  --color-brand-soft: var(--brand-soft);
  --color-brand-ink: var(--brand-ink);
  --color-teal: var(--teal);
  --color-teal-soft: var(--teal-soft);
  --color-class: var(--class);
  --color-class-soft: var(--class-soft);
  --color-sky-fajar: var(--sky-fajar);
  --color-sky-senja: var(--sky-senja);
  --color-sky-ink: var(--sky-ink);
  --color-sky-muted: var(--sky-ink-muted);
  --color-sun: var(--sun);
  --color-danger: var(--danger);
  --color-sky-surface: var(--sky-surface);
  --color-sky-line: var(--sky-line);
  --color-brand-pressed: var(--brand-pressed);
  --color-focus: var(--focus-ring);
  --color-disabled: var(--ink-disabled);
  --color-scrim: var(--scrim);
  --font-sans: "Manrope", system-ui, sans-serif;
  --font-arabic: "Amiri", "Noto Naskh Arabic", serif;
  --radius-sm: 8px; --radius-md: 14px; --radius-lg: 16px; --radius-xl: 20px; --radius-2xl: 24px;
  --shadow-fab: 0 10px 24px rgba(0,0,0,0.18);
}
```

Dengan itu, kelas seperti `bg-card border border-line rounded-xl text-ink` atau `bg-brand text-on-brand rounded-md` langsung sesuai sistem. Spasi memakai skala bawaan Tailwind (kelipatan 4px): `p-5` = `space-5`, `gap-3` = `space-3`.

Saat membangun halaman baru (Ibadah, Jadwal, Tugas), pakai kembali pola dari halaman Hari Ini: kartu seksi `surface-card` + `line` + `radius-xl`, judul seksi `heading-md`, item agenda dengan tag jenis, dan satu aksi utama `brand` per layar.
