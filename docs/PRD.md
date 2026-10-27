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
2. **Kartu langit**: sholat berikutnya + hitung mundur (diperbarui tiap menit), lengkung 5 waktu sholat dengan penanda matahari/bulan. Saat sebuah sholat sedang dalam waktunya dan belum dicatat, tampilkan tombol "Tandai sudah sholat {nama}". Rentang waktunya mengikuti §F3.5: Subuh sampai Terbit, Isya sampai Subuh esok, sholat lain sampai sholat berikutnya masuk. Antara Terbit dan Dzuhur tidak ada tombol ini; kartu menampilkan hitung mundur ke Dzuhur.
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

1. Waktu sholat dihitung offline dengan library `adhan`, di zona waktu lokasi. Parameter dikalibrasi terhadap jadwal resmi Kemenag (keputusan 17-10-2026, lihat `src/lib/domain/prayer.ts`):
   - Sudut Subuh 20°, Isya 18°, mazhab Syafi'i untuk Ashar.
   - **Ihtiyat** default 2 menit (bisa diubah 0–5 menit di pengaturan). Ditambahkan ke awal waktu sholat dan Dhuha, **dikurangkan** dari Terbit. Terbit adalah batas akhir Subuh, jadi angka yang aman adalah yang lebih awal.
   - **Pembulatan seperti Kemenag**: awal waktu sholat dan Dhuha dibulatkan ke atas, Terbit dibulatkan ke bawah.
   - **Dzuhur +1 menit (zawal)**: waktu Dzuhur dimulai setelah seluruh piringan matahari melewati meridian, bukan saat pusatnya tepat di meridian.
   - **Maghrib +1 dan Terbit −1 menit (koreksi ufuk)**: mengikuti kerendahan horizon yang dipakai Kemenag. Tanpa koreksi ini, Maghrib dan Terbit konsisten meleset sekitar 1 menit di semua kota uji.
   - **Dhuha**: matahari setinggi **4,5°** di atas ufuk timur, ditambah ihtiyat. Sudut ini dikalibrasi dengan data Jakarta saja, lalu terbukti cocok untuk Surabaya dan Makassar (selisih 0 menit). Dhuha bukan Terbit + 15 menit: data Kemenag menunjukkan jarak Terbit–Dhuha bervariasi 27–29 menit, sesuai sudut matahari tetap.
   - Koreksi manual per waktu sholat (−10 s.d. +10 menit) di pengaturan, ditambahkan setelah pembulatan.
   - **Imsak = Subuh yang ditampilkan − 10 menit**, selalu tepat 10 menit. Terbit dan Dhuha ditampilkan sebagai info.
2. **Uji penerimaan wajib sebelum beta:** hasil hitungan untuk Jakarta, Surabaya, dan Makassar pada 3 tanggal berbeda dibandingkan dengan jadwal resmi Kemenag (unit test `prayer.kemenag.test.ts`, data acuan dan sumbernya di `src/lib/domain/fixtures/kemenag.ts`). Aturannya sama untuk semua kota dan tanggal, dihitung sebagai Kala − Kemenag dalam menit:
   - **Awal waktu sholat dan Dhuha**: boleh lebih lambat sampai 2 menit, boleh lebih awal **maksimal 1 menit**.
   - **Imsak dan Terbit**: boleh lebih awal sampai 2 menit, boleh lebih lambat **maksimal 1 menit**.
   - Alasan: jadwal Kemenag sudah memuat ihtiyat 2 menit, jadi selisih 1 menit ke arah tidak aman tetap berada di dalam margin ihtiyat dan sholat tetap sah. Selisih itu wajar karena pembulatan dan perbedaan titik koordinat kota.
3. Pencatatan: satu `PrayerLog` per (tanggal, sholat). Opsi "berjamaah" (boolean).
4. Sholat boleh dicatat sejak waktunya masuk, sampai akhir hari berikutnya (untuk yang lupa mengetuk). Tidak bisa mencatat sholat yang waktunya belum masuk.
5. Status dihitung (bukan disimpan), dengan rentang waktu menurut fikih:
   - **Subuh** berlaku sampai **Terbit**. Antara Terbit dan Dzuhur tidak ada sholat berstatus "sedang", dan sholat berikutnya adalah Dzuhur.
   - **Dzuhur, Ashar, Maghrib** berlaku sampai sholat berikutnya masuk.
   - **Isya** berlaku sampai Subuh esok.
   - **Terlewat** = rentangnya sudah lewat dan belum ada log (Subuh terlewat sejak Terbit). Tampilan netral (`surface-sunken` + `line`), tanpa merah. Sholat terlewat masih bisa dicatat sesuai butir 4.
6. Grid konsistensi 7 hari terakhir (7 × 5) di tab Ibadah.
7. Ganti lokasi hanya memengaruhi hitungan ke depan; log lama tidak berubah.

### F4. Mata pelajaran & timetable

Sebagai pelajar, saya ingin memasukkan jadwal pelajaran sekali dan melihatnya otomatis setiap hari.

1. `Subject`: nama (wajib), singkatan, guru, ruang (opsional). Singkatan maksimal 6 karakter (misal "MTK"), boleh kembar antar mapel, dan tampil di grid Minggu menggantikan nama yang terpotong di kolom ±45 px. Nama lengkap tetap dipakai di label aksesibilitas, daftar mapel, dan form.
2. Sesi kelas disimpan sebagai `Routine` dengan `kind: 'class'` dan `subjectId`. Pengulangan mingguan pada hari tertentu (`FREQ=WEEKLY;BYDAY=MO,WE`).
3. Tampilan **Minggu** di `/jadwal`: grid Senin–Sabtu (Minggu bisa ditampilkan lewat pengaturan), jam 06.00–18.00, sesi diwarnai token `class`.
4. Menghapus mapel: tanya dulu, lalu soft-delete mapel beserta rutin kelasnya. Tugas lama tetap ada dengan label mapel "(dihapus)".

Keputusan implementasi F4 (disetujui 19 Okt 2026):

- Satu `Routine` per sesi kelas untuk semua hari yang dipilih (`BYDAY=MO,WE`). `title` dikosongkan; nama selalu diambil dari `Subject` agar ikut berubah saat mapel diganti nama.
- `dtstart` sesi baru = hari pertama minggu yang sedang tampil (bukan hari ini), supaya sesi Senin yang dibuat hari Rabu langsung muncul di grid minggu ini.
- Grid menampilkan minggu berjalan saja (tanpa navigasi minggu), dihitung lewat `occurrencesBetween` sehingga `exdates`/`overrides` F5 langsung tercermin.
- Rentang jam grid minimal 06.00–18.00 dan melebar ke jam penuh terdekat jika ada sesi di luarnya; sesi tidak pernah dipotong.
- Ruang sesi terisi otomatis dari ruang mapel dan bisa diubah per sesi; disimpan di `Routine.location`.
- Nama mapel unik di antara mapel aktif tanpa membedakan huruf besar-kecil (agar tambah cepat F7 tidak ambigu), maksimal 60 karakter; guru dan ruang maksimal 40 karakter.
- Mengubah sesi = mengubah seluruh seri; pilihan "hanya tanggal ini / seterusnya" ada di F5.
- `Subject.abbr` (19 Okt 2026): di-trim, kosong disimpan sebagai `null`. Tidak di-index, jadi tidak ada versi Dexie baru; record lama tanpa field ini dinormalisasi menjadi `null` saat dibaca di repo. Tanpa singkatan, grid memakai nama per kata yang dipotong.
- Sesi bentrok di grid Minggu (19 Okt 2026, menggantikan lane berdampingan yang hanya ±21 px di 360 px): sesi yang jamnya bertumpuk (langsung atau berantai) digabung jadi satu blok selebar kolom, dari mulai paling awal sampai selesai paling akhir, berbingkai tebal, berisi lencana jumlah sesi, singkatan/kata pertama tiap mapel, dan jam mulai jika muat; label aksesibilitasnya "N sesi bentrok, {hari} {jam}: {mapel}". Mengetuknya membuka sheet "Pilih sesi" (nama lengkap + jam, baris ≥ 44 px), lalu sheet Ubah sesi. Sesi yang hanya bersentuhan (08.30 selesai, 08.30 mulai) tidak bentrok.
- Halaman `/jadwal` punya ruang kosong setinggi FAB di bawah grid agar jam terakhir bisa digulir ke atas FAB.
- Sakelar "Tampilkan Minggu di jadwal" (F8.5) sementara ada di `/lainnya`, pindah ke `/lainnya/pengaturan` saat F8 dikerjakan.

### F5. Rutin berulang

Sebagai pelajar, saya ingin kegiatan berulang (les, olahraga, murajaah) muncul otomatis.

1. Pola: harian, mingguan (pilih hari), bulanan (tanggal X, atau "hari ke-N", misalnya Senin kedua), setiap N hari/minggu.
2. Tanggal mulai (wajib), tanggal akhir (opsional).
3. Per tanggal: **lewati** (masuk `exdates`) atau **pindah jam** (masuk `overrides`), tanpa mengubah rutin induk.
4. Edit rutin menawarkan dua pilihan: "Hanya tanggal ini" atau "Tanggal ini dan seterusnya". Pilihan kedua mengakhiri rutin lama di hari sebelumnya (`until`) dan membuat rutin baru mulai tanggal itu.
5. Disimpan sebagai string RRULE RFC 5545 (tanpa DTSTART) agar langsung bisa diekspor ke `.ics` di Fase 2.

Keputusan implementasi F5 (25 Okt 2026):

- Subset RRULE tertutup, divalidasi tokenizer sendiri (`parseRule`) dengan allowlist kunci `FREQ`, `INTERVAL`, `BYDAY`, `BYMONTHDAY`: `DAILY`; `WEEKLY` + `BYDAY` (tanpa ordinal); `MONTHLY` + tepat satu `BYMONTHDAY` 1..31 atau −1, atau tepat satu `BYDAY` berordinal +1..+5 atau −1. `INTERVAL` 1–99. Kunci ganda dan kunci lain (`COUNT`, `UNTIL`, `BYSETPOS`, `WKST`, …) ditolak. Opsi RRule disusun dari bentuk terstruktur ini, bukan dari string mentah, dan `WKST` dipatok Senin. String kanonik: `FREQ`, lalu `INTERVAL` (hanya jika > 1), lalu `BYDAY`/`BYMONTHDAY`.
- Bawaan rutin baru: jam mulai 16.00 (rutin adalah kegiatan di luar jam sekolah; sesi kelas tetap 07.00), durasi 60 menit, hari = hari dari tanggal mulai, tanggal mulai = tanggal yang sedang dipilih.
- Judul rutin wajib, maksimal 60 karakter. `location` rutin divalidasi maksimal 40 karakter seperti ruang sesi kelas (belum ada kolomnya di form F5).
- Grid Minggu tetap khusus kelas dan minggu berjalan; rutin tampil di tampilan Hari dan daftar Rutin.
- `/jadwal` selalu dibuka di Minggu; Hari dimulai dari hari ini, pilihan tidak disimpan. Navigasi Hari hanya ‹ / › dan "Hari ini" (lihat §10 #9).
- Pemilihan kejadian per tanggal ada di `dayAgenda` (`agenda.ts`), dipakai ulang oleh `agendaFor` F2.
- "Hanya tanggal ini" hanya mengubah jam/durasi. Memindah ke jam + durasi induk = menghapus override (tanpa pill "Jam diubah").
- Lewati membuang override tanggal itu; Kembalikan memunculkan lagi kejadian di jam induk.
- "Tanggal ini dan seterusnya": seri lama `until` = tanggal−1, seri baru mulai tanggal itu; `exdates`/`overrides` dibagi di titik tanggal, override tepat di tanggal itu dibuang (user baru saja menetapkan jam untuk tanggal itu); `Completion` ≥ tanggal pindah ke ID baru dalam satu transaksi. Di kejadian pertama seri (tidak ada kejadian sebelum tanggal itu, tanggal yang dilewati tetap dihitung) = edit/hapus seri penuh, dan `dtstart` digeser ke tanggal itu agar pola baru tidak memunculkan kejadian sebelumnya; override tepat di tanggal itu juga dibuang. Ini mencegah seri lama tanpa kejadian, karena `dtstart` sering bukan kejadian (misal Senin untuk pola Selasa).
- Hapus: "Hapus rutin" (seri penuh, dari daftar Rutin) dan "Hapus mulai tanggal ini" (`until` = tanggal−1; di kejadian pertama = hapus seri). Untuk kelas, tombol hapus di sheet dari-tanggal adalah "Hapus mulai tanggal ini". `Completion` ≥ tanggal dibiarkan karena tidak punya kejadian lagi.
- Daftar Rutin menampilkan seri dengan `until` kosong atau ≥ hari ini, tidak digabung, berlabel "Sampai …" / "Mulai …".
- Rutin/sesi kelas dengan pola tak dikenal (misal dari impor): tampil read-only di daftar Rutin dengan keterangan "Pola ini tidak bisa diubah di Kala" dan bisa dihapus; tidak ikut di grid/Hari.
- Kegiatan sekali (`kind: 'event'`) tampil read-only di Hari sampai F7.
- Tanpa versi Dexie baru dan tanpa index baru.

### F6. Tugas

Sebagai pelajar, saya ingin mencatat PR, tugas, dan ujian beserta tenggatnya.

1. Field: judul (wajib), jenis (PR, tugas, ujian, proyek, lainnya), mapel, **tenggat** (tanggal + jam opsional), **jadwal pengerjaan** (tanggal + jam + durasi, opsional), prioritas (rendah/sedang/tinggi), catatan.
2. **Tenggat ≠ jadwal pengerjaan.** Tugas tampil sebagai blok jam di agenda hanya pada jadwal pengerjaannya.
   - Bagian "Tenggat" di atas agenda memuat semua tugas bertenggat tanggal itu, kecuali yang sudah tampil sebagai blok jadwal pengerjaan di tanggal yang sama. Tugas lewat tenggat dari hari sebelumnya tidak masuk bagian ini; tempatnya di filter Hari ini di halaman Tugas.
   - **Belum selesai sebelumnya**: tugas belum selesai dengan jadwal pengerjaan sebelum hari ini, apa pun tenggatnya, tampil di filter Hari ini sebagai grup terpisah berlabel netral, tanpa warna merah. Tugas yang sudah lewat tenggat atau bertenggat hari ini tetap di grup utama, jadi tidak ada tugas yang tampil dua kali. Grup yang sama disediakan untuk agenda hari ini (F2).
3. Filter: Semua, Hari ini, Minggu ini, Selesai. Urutan default: tenggat terdekat, lalu prioritas.
4. Hapus = soft delete + toast "Dihapus · Urungkan" sampai ditutup.
5. "Bersihkan yang selesai" menghapus (soft) tugas selesai yang lebih lama dari 7 hari, dengan konfirmasi.
6. Field `quadrant` sudah ada di model untuk tampilan Matrix Fase 2. Fase 1 belum menampilkannya.

Keputusan implementasi F6 (27 Okt 2026):

- Filter Semua, Hari ini, dan Minggu ini hanya berisi tugas belum selesai; tugas lewat tenggat ikut di Hari ini dan Minggu ini. Selesai hanya berisi tugas selesai. "Minggu ini" mengikuti `weekStartsOn` (F8.5, default Senin). Pilihan filter tidak disimpan; halaman selalu dibuka di Semua.
- Urutan (`compareTasks`): bertenggat sebelum tanpa tenggat, `dueDate` naik, `dueTime` naik (tenggat tanpa jam = akhir hari, setelah yang berjam), prioritas tinggi → rendah, jadwal pengerjaan lebih awal (tanpa jadwal di belakang), `createdAt` naik, lalu `id`. Selesai: `completedAt` terbaru di atas, tanpa `completedAt` paling bawah, lalu `id` turun.
- "Belum selesai sebelumnya" (§F6.2) = tugas belum selesai dengan `scheduledDate` sebelum hari ini dan tenggat kosong atau setelah hari ini. Diurutkan per `scheduledDate`, jam mulai, lalu urutan umum. `dayTasks` mengembalikannya sebagai `carriedOver` hanya jika tanggalnya hari ini; /jadwal belum merendernya (untuk F2). `carriedOver` dan `todayGroups` tetap membuang tugas terhapus.
- Jadwal pengerjaan diisi lengkap (tanggal + jam + durasi) atau dikosongkan semua. Bawaan saat diaktifkan: hari ini, 16.00, 60 menit. Tenggat dan jadwal di masa lalu boleh; jadwal setelah tenggat juga boleh, tanpa peringatan.
- Judul wajib, maksimal 100 karakter; catatan maksimal 1000. Panjang dihitung dalam UTF-16 code unit (`.length`), sama untuk `maxlength` input dan validasi repo.
- Status telat berlabel "Lewat tenggat" (`isOverdue`): turunan, tidak disimpan, tidak pernah merah. Baris daftar hanya menampilkan pill "Prioritas tinggi"; sedang/rendah cukup tercermin di urutan dan sheet. Jenis di sheet memakai `<select>` asli (5 tombol tidak muat di ±320 px).
- Tugas selesai tetap tampil di tampilan Hari (blok maupun bagian Tenggat), dicoret. Di Hari `/jadwal` tugas read-only sampai F2: tanpa centang, diketuk membuka sheet ubah; label blok "{judul}, tugas, {jam}[, selesai]. Ubah".
- Mapel terhapus (§F4.4): tugas tampil "{nama} (dihapus)", atau "Mapel (dihapus)" jika record mapel tidak ada. Di sheet ubah, mapel terhapus boleh dipertahankan, tapi tidak bisa dipilih untuk tugas lain.
- Hapus = soft delete; token urungkan = `deletedAt`. Toast baru menggantikan yang lama, jadi hanya penghapusan terakhir yang bisa diurungkan; token basi membuat `restoreTask` mengembalikan `false` dan toast ditutup tanpa galat. `deleteTask` pada tugas yang sudah terhapus mengembalikan token lama tanpa menulis.
- Toast urungkan tanpa timer (WCAG 2.2.1): tertutup lewat ✕, Escape (saat fokus di toast), toast berikutnya, atau Urungkan berhasil. ✕/Escape mengembalikan fokus ke elemen asal (`relatedTarget` saat fokus masuk toast) jika masih ada di DOM. Aksi yang gagal membuat toast tetap tampil.
- Fokus setelah hapus, atau setelah centang yang membuat baris hilang: ke baris berikutnya; jika baris terakhir, ke baris sebelumnya; jika daftar kosong, ke heading. Dihitung pada urutan tampil gabungan (filter Hari ini: grup utama lalu "Belum selesai sebelumnya"). Di Hari `/jadwal`: Tenggat lalu blok tugas, rutin dilewati, dengan heading hari sebagai cadangan. Setelah Urungkan, fokus ke baris yang dipulihkan. Centang yang barisnya tetap tampil tidak memindah fokus.
- "Bersihkan yang selesai" hanya menyentuh tugas selesai dengan `completedAt` lebih dari 7 × 24 jam sebelum instan sekarang (batas eksklusif, tidak bergantung zona waktu atau DST). Tugas selesai tanpa `completedAt` yang valid tidak pernah dibersihkan. Tombol hanya tampil jika ada yang bisa dibersihkan; hasil 0 tidak memunculkan toast.
- Sumber waktu: timestamp yang ditulis ke DB (`createdAt`, `updatedAt`, `completedAt`, `deletedAt`/token urungkan, `now` untuk bersihkan) = `new Date().toISOString()` saat aksi, bukan store `now` (presisinya per menit). Store `today`/`now` hanya untuk status turunan.
- Repo: semua tulis dalam satu transaksi `rw`; `updateTask` selalu mengisi `updatedAt`.
- Tanpa versi Dexie baru, tanpa index baru, tanpa dependensi baru.

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
4. Tema: Ikuti sistem (default) / Terang / Gelap / Ikuti waktu sholat (gelap otomatis dari Isya sampai Subuh di lokasi tersimpan; di luar itu mengikuti tema sistem; tanpa lokasi = ikuti sistem).
5. Hari pertama minggu (Senin default), tampilkan Minggu di timetable.
6. Data: **Ekspor** (file JSON), **Impor** (pilih: gabungkan atau ganti semua), **Hapus semua data** (konfirmasi dengan mengetik "HAPUS").
7. Tentang: versi app, kebijakan privasi, kirim masukan (tautan formulir).

### F9. PWA & offline

1. Manifest + service worker benar-benar ter-deploy, ikon 192/512 + maskable. Service worker memakai fitur bawaan SvelteKit (`src/service-worker/` + `$app/manifest`), bukan `@vite-pwa/sveltekit`: versi 1.1.0 tidak mendukung build SvelteKit 3 (Vite environments) sehingga tidak menghasilkan `sw.js` (keputusan Fase 0, 17-10-2026). Manifest statis di `static/manifest.webmanifest`.
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
| `Subject` | `id` | nama, singkatan (`abbr`, opsional), guru, ruang | 1 |
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
| Hosting | Cloudflare Workers, **static assets saja** (bukan Pages, tanpa Worker script, tanpa adapter Cloudflare/SSR). Konfigurasi di `wrangler.jsonc`: `assets.directory = ./build`, `not_found_handling = 404-page`, `html_handling = auto-trailing-slash`. Deploy lewat Cloudflare Workers Builds: `pnpm build` lalu `npx wrangler deploy`. `_headers` berlaku dengan format yang sama seperti di Pages |

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
| 6 | Utang teknis: migrasi alias `$lib` ke `#lib` (SvelteKit 3). `$lib` saat ini dipertahankan lewat opsi `alias` yang deprecated (lihat `vite.config.ts`) | Tetap `$lib` sampai shadcn-svelte mendukung `#lib`; migrasi sebelum SvelteKit menghapus `alias` |
| 7 | Blok sesi tunggal di bawah ±47 menit di grid Minggu lebih pendek dari target sentuh 44 px (sesi bentrok sudah diselesaikan, lihat keputusan F4) | Biarkan; evaluasi setelah beta |
| 8 | FAB "+" di `/jadwal` langsung membuka sheet sesi kelas. Saat F7 (tambah cepat) ada, apakah FAB tetap khusus sesi kelas atau membuka tambah cepat/pilihan jenis? | Tetap membuka sheet sesi kelas; ditinjau ulang saat F7 |
| 9 | Tampilan Hari di `/jadwal` hanya punya navigasi ‹ / › dan "Hari ini". Perlu pemilih tanggal untuk melompat jauh? | Tanpa date picker; dievaluasi saat beta |
