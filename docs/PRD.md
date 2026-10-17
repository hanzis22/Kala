# PRD: Kala

> Versi 1.0 · 17 Oktober 2026 · Status: siap untuk Fase 0–1
> Nama app: **Kala** (Bahasa Indonesia klasik untuk "waktu"). Nama di toko aplikasi: "Kala: Planner Pelajar & Sholat". Design system: **Senja**.

## 1. Ringkasan

Planner harian berbentuk PWA untuk **pelajar** yang menyatukan **jadwal belajar, ibadah, dan rutinitas** dalam satu timeline. Gratis, tanpa akun, dan **semua data tersimpan di perangkat user**.

**Positioning:** planner pelajar yang paling enak dilihat, dengan sholat sebagai bagian alami dari hari, bukan fitur tempelan.

**Target user utama:** pelajar SMP/SMA/mahasiswa di Indonesia, Muslim, memakai HP Android kelas menengah, sering offline atau kuota terbatas.

### Prinsip produk

1. **Hari Ini adalah jantung aplikasi.** Semua fitur bermuara ke satu timeline harian.
2. **Data turunan tidak disimpan.** Agenda harian dihitung dari sumbernya setiap kali dibutuhkan.
3. **Mendorong, bukan menghakimi.** Sholat terlewat dan tugas telat tidak ditampilkan dengan merah atau kata yang menyalahkan.
4. **Offline penuh dan privat.** Tidak ada server, tidak ada akun, tidak ada data yang keluar dari perangkat.
5. **Cepat dicatat.** Menambah tugas atau kegiatan harus selesai dalam kurang dari 5 detik.

## 2. Scope

### Fase 1 (MVP, wajib untuk beta)

| ID | Fitur | Tab |
|---|---|---|
| F1 | Onboarding (nama, lokasi, jadwal pelajaran awal) | – |
| F2 | Hari Ini: kartu sholat, 3 prioritas, agenda gabungan | Hari Ini |
| F3 | Jadwal sholat + pencatatan sholat | Ibadah |
| F4 | Mata pelajaran + jadwal pelajaran mingguan (timetable) | Jadwal |
| F5 | Rutin berulang | Jadwal |
| F6 | Tugas (daftar, deadline, mapel, prioritas) | Tugas |
| F7 | Tambah cepat (tombol +) dengan parser bahasa alami sederhana | global |
| F8 | Pengaturan: lokasi, metode sholat, tema, backup/restore | Lainnya |
| F9 | PWA: bisa di-install, berjalan offline | – |

### Fase 2 (setelah beta)

Habit tracker + streak, tilawah, dzikir & doa, Pomodoro/fokus, hitung mundur, Eisenhower Matrix (tampilan dari Tugas), kalender bulanan dengan tanggal Hijriah, ekspor `.ics` (termasuk jadwal sholat sebagai pengingat), puasa sunnah.

**Rilis Google Play (akhir Fase 2):** bungkus PWA sebagai app Android dengan TWA (PWABuilder atau Bubblewrap), kode web tetap sama. Butuh akun Google Play Developer (USD 25, sekali bayar) dan file `assetlinks.json` di `static/.well-known/`. App Store (Capacitor + notifikasi lokal) dievaluasi setelah traksi terbukti.

### Fase 3

Jurnal + mood, statistik tahunan, mode Ramadan, i18n Inggris, command palette (Ctrl+K), onboarding "Apa yang baru".

### Di luar scope (sengaja)

Akun dan sinkronisasi cloud, notifikasi push dari server, fitur sosial/berbagi, teks Al-Qur'an dan terjemahan, iklan.

> Tabel untuk fitur Fase 2 sudah dibuat di skema database versi 1 (lihat §5) supaya tidak perlu migrasi saat fitur tersebut dibangun. UI-nya belum dibangun di Fase 1.

## 3. Navigasi dan layar

Bottom nav 5 tab: **Hari Ini · Jadwal · Tugas · Ibadah · Lainnya**. Tombol **+** melayang di tab Hari Ini, Jadwal, dan Tugas.

| Route | Layar | Fase |
|---|---|---|
| `/` | Hari Ini | 1 |
| `/jadwal` | Jadwal: toggle Hari / Minggu, daftar Rutin | 1 |
| `/jadwal/mapel` | Kelola mata pelajaran | 1 |
| `/tugas` | Tugas: daftar (filter: Semua, Hari ini, Minggu ini, Selesai) | 1 |
| `/ibadah` | Ibadah: jadwal sholat, konsistensi mingguan | 1 (tilawah, dzikir, puasa: 2) |
| `/lainnya` | Menu fitur lain + Pengaturan | 1 |
| `/lainnya/pengaturan` | Pengaturan | 1 |
| `/onboarding` | Alur 3 langkah | 1 |

Form tambah/edit item tampil sebagai **bottom sheet**, bukan halaman terpisah.

Referensi visual: canvas "Planner Hari Ini" (layar Hari Ini dan Ibadah) dan design system Senja (`docs/design/SENJA.md`).

## 4. Fitur dan kriteria penerimaan

Format: *Sebagai pelajar, saya ingin…* lalu kriteria yang bisa diuji.

### F1. Onboarding

Sebagai pelajar baru, saya ingin menyiapkan app dalam satu menit supaya Hari Ini langsung terisi.

1. Langkah 1: nama panggilan (opsional, maks 30 karakter).
2. Langkah 2: lokasi. Tombol "Pakai lokasi saya" (Geolocation API) **atau** pilih kota dari daftar offline (min. 100 kota/kabupaten Indonesia + zona waktunya). Menolak izin GPS tidak memblokir alur.
3. Langkah 3: tambah 1–3 mata pelajaran + jadwalnya, atau "Lewati, isi nanti".
4. Setelah selesai: panggil `navigator.storage.persist()`, simpan `Settings.onboardedAt`, arahkan ke `/`.
4a. **iPhone/iPad yang membuka lewat Safari (bukan mode terpasang):** tampilkan layar tambahan "Pasang Kala di layar utama" dengan panduan bergambar (Bagikan → Tambahkan ke Layar Utama) dan alasan singkatnya: data lebih aman dan app terasa seperti app biasa. Deteksi: `navigator.standalone !== true` dan user agent iOS. Bisa dilewati; jika dilewati, banner pengingat muncul lagi setelah 3 hari.
5. Onboarding hanya muncul jika `Settings.onboardedAt` kosong.

### F2. Hari Ini

Sebagai pelajar, saya ingin melihat seluruh hari saya dalam satu layar.

Isi dari atas ke bawah (lihat mockup):

1. Tanggal Masehi + Hijriah, sapaan sesuai jam (pagi < 11.00, siang < 15.00, sore < 18.00, malam sisanya), badge streak (Fase 2; Fase 1 disembunyikan).
2. **Kartu langit**: sholat berikutnya + hitung mundur (diperbarui tiap menit), lengkung 5 waktu sholat dengan penanda matahari/bulan. Saat sebuah waktu sholat sudah masuk dan belum dicatat (maks. sampai waktu sholat berikutnya), tampilkan tombol "Tandai sudah sholat {nama}".
3. **5 chip sholat** dengan status sudah / sedang / belum. Ketuk chip = toggle catatan sholat.
4. **3 prioritas hari ini**: maks. 3 baris teks bebas dengan centang, tersimpan di `DayEntry.priorities`.
5. **Agenda**: hasil `agendaFor(date)` (§6). Default tampil 6 item di sekitar waktu sekarang + tautan "Lihat semua".

Kriteria:
- Item yang sedang berlangsung diberi pill "Sedang berlangsung". Jika tidak ada, item berikutnya diberi "Berikutnya · N menit lagi".
- Item yang sudah lewat memudar (opacity 0.6). Coret hanya untuk tugas/rutin yang dicentang selesai, tidak untuk sholat.
- Centang item agenda: rutin dan kelas → `Completion`; tugas → `Task.status = 'done'`; sholat → `PrayerLog`.
- Melewati tengah malam saat app terbuka: "hari ini" ikut berganti tanpa reload (§7.1).

### F3. Jadwal sholat & pencatatan

Sebagai pelajar Muslim, saya ingin tahu waktu sholat yang akurat untuk lokasi saya dan mencatat sholat saya.

1. Waktu sholat dihitung offline dengan library `adhan`:
   - Sudut Subuh 20°, Isya 18°, mazhab Syafi'i untuk Ashar.
   - **Ihtiyat** default +2 menit untuk semua waktu (bisa diubah 0–5 menit di pengaturan).
   - Koreksi manual per waktu sholat (−10 s.d. +10 menit) di pengaturan.
   - Imsak = Subuh − 10 menit. Terbit dan Dhuha (Terbit + 15 menit) ditampilkan sebagai info.
2. **Uji penerimaan wajib sebelum beta:** hasil hitungan untuk Jakarta, Surabaya, dan Makassar pada 3 tanggal berbeda tidak boleh selisih lebih dari 2 menit dari jadwal resmi Kemenag. Simpan sebagai unit test dengan data acuan.
3. Pencatatan: satu `PrayerLog` per (tanggal, sholat). Opsi "berjamaah" (boolean).
4. Sholat boleh dicatat sejak waktunya masuk, sampai akhir hari berikutnya (untuk yang lupa mengetuk). Tidak bisa mencatat sholat yang waktunya belum masuk.
5. Status **terlewat** dihitung (bukan disimpan): waktu sholat berikutnya sudah masuk dan belum ada log. Tampilan netral (`surface-sunken` + `line`), tanpa merah.
6. Grid konsistensi 7 hari terakhir (7 × 5) di tab Ibadah.
7. Ganti lokasi hanya memengaruhi hitungan ke depan; log lama tidak berubah.

### F4. Mata pelajaran & timetable

Sebagai pelajar, saya ingin memasukkan jadwal pelajaran sekali dan melihatnya otomatis setiap hari.

1. `Subject`: nama (wajib), guru, ruang (opsional).
2. Sesi kelas disimpan sebagai `Routine` dengan `kind: 'class'` dan `subjectId`. Pengulangan mingguan pada hari tertentu (`FREQ=WEEKLY;BYDAY=MO,WE`).
3. Tampilan **Minggu** di `/jadwal`: grid Senin–Sabtu (Minggu bisa ditampilkan lewat pengaturan), jam 06.00–18.00, sesi diwarnai token `class`.
4. Menghapus mapel: tanya dulu, lalu soft-delete mapel beserta rutin kelasnya. Tugas lama tetap ada dengan label mapel "(dihapus)".

### F5. Rutin berulang

Sebagai pelajar, saya ingin kegiatan berulang (les, olahraga, murajaah) muncul otomatis.

1. Pola: harian, mingguan (pilih hari), bulanan (tanggal X, atau "hari ke-N", misalnya Senin kedua), setiap N hari/minggu.
2. Tanggal mulai (wajib), tanggal akhir (opsional).
3. Per tanggal: **lewati** (masuk `exdates`) atau **pindah jam** (masuk `overrides`), tanpa mengubah rutin induk.
4. Edit rutin menawarkan dua pilihan: "Hanya tanggal ini" atau "Tanggal ini dan seterusnya". Pilihan kedua mengakhiri rutin lama di hari sebelumnya (`until`) dan membuat rutin baru mulai tanggal itu.
5. Disimpan sebagai string RRULE RFC 5545 (tanpa DTSTART) agar langsung bisa diekspor ke `.ics` di Fase 2.

### F6. Tugas

Sebagai pelajar, saya ingin mencatat PR, tugas, dan ujian beserta tenggatnya.

1. Field: judul (wajib), jenis (PR, tugas, ujian, proyek, lainnya), mapel, **tenggat** (tanggal + jam opsional), **jadwal pengerjaan** (tanggal + jam + durasi, opsional), prioritas (rendah/sedang/tinggi), catatan.
2. **Tenggat ≠ jadwal pengerjaan.** Tugas masuk agenda pada jadwal pengerjaannya. Jika hanya punya tenggat, tugas tampil di bagian "Tenggat hari ini" di atas agenda, bukan sebagai blok jam.
3. Filter: Semua, Hari ini, Minggu ini, Selesai. Urutan default: tenggat terdekat, lalu prioritas.
4. Hapus = soft delete + toast "Dihapus · Urungkan" selama 5 detik.
5. "Bersihkan yang selesai" menghapus (soft) tugas selesai yang lebih lama dari 7 hari, dengan konfirmasi.
6. Field `quadrant` sudah ada di model untuk tampilan Matrix Fase 2. Fase 1 belum menampilkannya.

### F7. Tambah cepat

Sebagai pelajar, saya ingin mengetik satu kalimat dan app mengisi detailnya.

Bottom sheet dengan satu input teks + tiga tab jenis: **Tugas** (default), **Kegiatan** (sekali, tanggal tertentu), **Rutin**. Parser berjalan saat mengetik dan menampilkan pratinjau chip (tanggal, jam, durasi, mapel) yang bisa dikoreksi sebelum disimpan.

Aturan parser Fase 1 (bahasa Indonesia, tidak peka huruf besar):

| Pola | Contoh | Hasil |
|---|---|---|
| hari ini / besok / lusa | "besok" | tanggal relatif |
| nama hari | "kamis", "hari senin" | hari tersebut berikutnya (hari ini jika sama dan jam belum lewat) |
| tanggal | "tgl 25", "25/10", "25 okt" | tanggal tersebut (bulan ini atau berikutnya) |
| jam | "jam 7", "19.00", "7 malam", "jam 3 sore" | waktu 24 jam; "pagi" 04–10, "siang" 11–14, "sore" 15–18, "malam" 18–23 |
| durasi | "1 jam", "30 menit", "1,5 jam" | durasi menit |
| deadline | "deadline …", "dikumpul …", "sebelum …" | mengisi **tenggat** (bukan jadwal) |
| mapel | kata yang cocok dengan nama mapel user | `subjectId` |
| jenis | "pr", "ujian", "uts", "uas", "ulangan", "proyek" | jenis tugas |

Sisa teks setelah token dikenali menjadi judul. Parser adalah fungsi murni `parseQuickAdd(text, now, subjects)` dengan minimal 30 kasus uji.

### F8. Pengaturan

1. Nama panggilan.
2. Lokasi (GPS / pilih kota), ihtiyat, koreksi per waktu sholat.
3. **Penyesuaian tanggal Hijriah** −2 s.d. +2 hari. Alasan: kalender Umm al-Qura bawaan browser bisa berbeda sehari dengan keputusan Kemenag.
4. Tema: Ikuti sistem (default) / Terang / Gelap / Ikuti waktu sholat (gelap otomatis dari Isya sampai Subuh).
5. Hari pertama minggu (Senin default), tampilkan Minggu di timetable.
6. Data: **Ekspor** (file JSON), **Impor** (pilih: gabungkan atau ganti semua), **Hapus semua data** (konfirmasi dengan mengetik "HAPUS").
7. Tentang: versi app, kebijakan privasi, kirim masukan (tautan formulir).

### F9. PWA & offline

1. Manifest + service worker benar-benar ter-deploy (`@vite-pwa/sveltekit`), ikon 192/512 + maskable.
2. Seluruh app berjalan tanpa jaringan setelah kunjungan pertama, termasuk font (self-host, bukan Google Fonts CDN).
3. Prompt instal sendiri setelah user memakai app 2 hari berbeda, bisa ditutup dan tidak muncul lagi selama 14 hari.
4. Saat versi baru tersedia: toast "Versi baru tersedia · Muat ulang".
5. **Pengingat backup:** karena data hanya ada di perangkat, tampilkan pengingat "Simpan cadangan data" setiap 14 hari (bisa dimatikan di pengaturan). Simpan waktu ekspor terakhir di `Settings`.
6. Akses: satu URL untuk semua perangkat (Android, iPhone/iPad, laptop, Chromebook). Data tidak berpindah antar perangkat kecuali lewat ekspor/impor.

## 5. Model data

Definisi lengkap: `src/lib/domain/types.ts`. Skema database: `src/lib/data/db.ts` (Dexie, IndexedDB, nama DB `kala`).

### Konvensi

- **ID**: ULID string (`ulidx`), dibuat di klien.
- Setiap entitas yang bisa diedit punya `createdAt`, `updatedAt` (ISO 8601), dan `deletedAt` (null jika aktif). **Soft delete** di mana-mana; query default menyaring `deletedAt == null`.
- **Tanggal lokal** disimpan sebagai string `YYYY-MM-DD` (`LocalDate`), **jam lokal** sebagai `HH:mm` (`LocalTime`). Jangan simpan `Date` atau timestamp untuk konsep "tanggal kalender".
- Durasi dalam menit (integer, 5–720).
- Semua perhitungan jam di domain memakai **menit sejak tengah malam** (0–1439).

### Entitas

| Entitas | Kunci | Isi utama | Fase |
|---|---|---|---|
| `Settings` | `key = 'app'` (singleton) | nama, lokasi, parameter sholat, offset Hijriah, tema, onboardedAt, schemaVersion | 1 |
| `Subject` | `id` | nama, guru, ruang | 1 |
| `Routine` | `id` | kind (`class` / `routine` / `event`), judul, subjectId, startTime, durationMin, rrule, dtstart, until, exdates, overrides | 1 |
| `Task` | `id` | judul, jenis, subjectId, dueDate/dueTime, scheduledDate/startTime/durationMin, prioritas, quadrant, status | 1 |
| `Completion` | `id = sourceId:date` | penanda selesai untuk satu kejadian rutin/kelas di satu tanggal | 1 |
| `PrayerLog` | `id = date:prayer` | sholat apa, tanggal, berjamaah, waktu dicatat | 1 |
| `DayEntry` | `date` | 3 prioritas; Fase 3: mood, catatan, syukur | 1 |
| `Habit`, `HabitLog` | `id`, `id = habitId:date` | habit dengan masa aktif + log per ID per tanggal | 2 |
| `TilawahLog` | `date` | jumlah halaman, posisi terakhir | 2 |
| `Countdown` | `id` | judul, tanggal | 2 |
| `FocusSession` | `id` | taskId, mulai, `endsAt`, durasi, selesai | 2 |

Catatan desain:
- **Kegiatan sekali** (misalnya rapat OSIS Rabu depan) disimpan sebagai `Routine` dengan `kind: 'event'` dan `rrule: null`. Satu jalur kode untuk semua blok berjam.
- `Completion` dan `PrayerLog` memakai **ID deterministik** sehingga mencentang dua kali tidak membuat duplikat (upsert).
- `HabitLog` per ID habit menghindari masalah pergeseran indeks yang ada di aplikasi referensi.

### Data turunan (tidak disimpan)

`AgendaItem` dihasilkan oleh `agendaFor(date, sources, now)`: gabungan sholat, kelas, rutin, kegiatan, dan tugas berjadwal, diurutkan menurut jam mulai, dengan status (`done`, `now`, `next`, `upcoming`, `past`), penanda bentrok, dan `lane` untuk tampilan bertumpuk.

## 6. Logika domain (fungsi murni, wajib unit test)

| Modul | Fungsi | Catatan |
|---|---|---|
| `recurrence.ts` | `occursOn(routine, date)`, `occurrencesBetween(routine, from, to)` | pakai `rrule`, hormati `dtstart`, `until`, `exdates`, `overrides` |
| `prayer.ts` | `prayerTimes(date, settings)`, `nextPrayer(now, settings)`, `prayerStatus(date, logs, now, settings)` | `adhan` + ihtiyat + koreksi; setelah Isya, sholat berikutnya = Subuh esok |
| `agenda.ts` | `agendaFor(date, sources, now)`, `markConflicts(items)`, `assignLanes(items)` | bentrok = irisan [mulai, selesai) |
| `hijri.ts` | `toHijri(date, offsetDays)` | `Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura')` + offset |
| `quickadd.ts` | `parseQuickAdd(text, now, subjects)` | aturan §F7 |
| `stats.ts` | `weeklyPrayerGrid(...)`, Fase 2: `streak(...)` | |
| `backup.ts` | `exportAll()`, `validateBackup(json)`, `mergeBackup(...)` | validasi skema dengan Valibot |

## 7. Aturan kasus pinggiran

1. **Tengah malam:** "hari ini" berasal dari store reaktif yang diperbarui oleh timer ke 00.00 berikutnya dan oleh event `visibilitychange`. Tidak ada `new Date()` di level modul.
2. **Rutin tanggal 31:** bulan tanpa tanggal 31 dilewati (perilaku RRULE). Form menawarkan opsi "Hari terakhir bulan" (`BYMONTHDAY=-1`).
3. **Kegiatan melewati tengah malam:** tidak didukung di Fase 1. Validasi: jam mulai + durasi ≤ 24.00.
4. **Kelas bentrok dengan waktu sholat:** tetap tampil, dengan petunjuk kecil "Bertepatan dengan waktu {sholat}". Bukan error.
5. **Zona waktu:** semua dalam waktu lokal perangkat. Zona waktu kota hanya untuk hitungan sholat. Jika zona perangkat berbeda dari zona lokasi tersimpan, tampilkan banner "Lokasimu berubah? Perbarui lokasi".
6. **Hari Hijriah** mengikuti hari Masehi (berganti tengah malam), bukan Maghrib. Ini keputusan sadar demi kesederhanaan; dicatat di §10.
7. **Impor:** selalu buat cadangan otomatis (ekspor ke memori lalu tawarkan unduh) sebelum menimpa. Mode gabung: per ID, menang yang `updatedAt` lebih baru.
8. **Penyimpanan penuh** (`QuotaExceededError`): toast + arahkan ke Pengaturan → Ekspor.
9. **Dua tab terbuka:** Dexie `liveQuery` menjaga UI tetap sinkron antar tab.
10. **Izin lokasi ditolak:** pakai kota pilihan; jangan pernah meminta ulang secara otomatis.

## 8. Persyaratan non-fungsional

| Area | Target |
|---|---|
| Performa | Lighthouse ≥ 90 semua kategori (mobile). JS awal < 150 KB gzip. Interaksi centang < 100 ms. |
| Perangkat uji | Android kelas menengah (Chrome) + iPhone (Safari, mode PWA terpasang) |
| Aksesibilitas | WCAG 2.2 AA: kontras sesuai token Senja, target sentuh ≥ 44 px, fokus keyboard terlihat (`focus-ring`), label untuk semua ikon, hormati `prefers-reduced-motion` |
| Privasi | Nol permintaan jaringan selain aset app sendiri dan analytics tanpa cookie. Tidak ada data user yang dikirim ke mana pun. |
| Offline | Semua fitur Fase 1 berjalan tanpa jaringan |
| Bahasa | Bahasa Indonesia, sapaan "kamu", teks UI terpusat agar siap i18n (Paraglide) di Fase 3 |
| Keamanan | Tidak ada `{@html}` dengan data user; CSP ketat lewat `_headers` |

## 9. Ukuran keberhasilan beta

Beta 2 minggu dengan 15–20 pelajar.

| Metrik | Target |
|---|---|
| Hari aktif per user | ≥ 5 dari 7 hari |
| User yang menyelesaikan onboarding | ≥ 90% |
| Rata-rata catatan sholat per user aktif per hari | ≥ 3 |
| Tugas dibuat lewat tambah cepat (vs form manual) | ≥ 50% |
| Laporan selisih jadwal sholat | 0 |

Event analytics (Cloudflare Web Analytics, tanpa data pribadi): `onboarding_done`, `task_created{via}`, `prayer_logged`, `quickadd_parsed{fields}`, `pwa_installed`.

## 10. Pertanyaan terbuka

| # | Pertanyaan | Default sementara |
|---|---|---|
| 1 | Nama app final | **Diputuskan: Kala.** Ada app lain bernama "Kala" di App Store (penghitung hari, pelacak waktu kerja), jadi listing toko memakai deskriptor dan merek perlu dicek di PDKI kelas 9 dan 42 |
| 2 | Warna berbeda per mata pelajaran? Senja baru punya satu warna `class` | Satu warna di Fase 1; evaluasi setelah beta |
| 3 | Hari Hijriah berganti saat Maghrib? | Tidak (lihat §7.6) |
| 4 | Pengingat sholat: cukup ekspor `.ics` di Fase 2, atau perlu web push (butuh server)? | `.ics` dulu |
| 5 | Sumber teks dzikir & doa untuk Fase 2, siapa yang memverifikasi | Perlu ditentukan sebelum Fase 2 |
