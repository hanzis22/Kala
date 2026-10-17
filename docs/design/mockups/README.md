# Mockup Kala (referensi visual)

Sumber: canvas "Planner Hari Ini" (dirancang 17 Okt 2026, palet Senja/Maghrib).

| File | Layar | Fase tampilan (prop `phase`) |
|---|---|---|
| `hari-ini.mockup.html` | Hari Ini (F2) | `pagi`, `maghrib`, `isya` |
| `ibadah.mockup.html` | Ibadah (F3) | `maghrib` (terang), `isya` (gelap) |

Cara membaca:
- Ini file desain berformat komponen canvas, BUKAN kode produksi. Markup + gaya inline di dalam `<x-dc>`; data contoh dan pemilihan warna per tema ada di blok `<script data-dc-script>` (fungsi `renderVals`).
- Warna di dalamnya ditulis sebagai hex karena canvas tidak membaca token. Di kode Kala, setiap hex WAJIB diganti token Senja yang setara (lihat docs/design/SENJA.md dan src/app.css). Contoh: `#F1CDB1` = `sky-senja`, `#A3461F` = `brand`, `#FFFCF8` = `surface-card`, `rgba(58,30,16,0.18)` = `sky-line`.
- Ukuran, jarak, radius, hierarki teks, urutan seksi, dan perilaku status diikuti persis. Data (nama, jam, angka) hanya contoh.
- Ibadah Fase 1 hanya: header + kartu jadwal sholat (Imsak/Terbit/Dhuha, 5 baris sholat, tombol "Kirim pengingat ke kalender HP" DISEMBUNYIKAN sampai ekspor .ics di Fase 2) + kartu "Konsistensi minggu ini". Kartu Tilawah, Dzikir & doa, dan Puasa sunnah adalah Fase 2: jangan dibangun.
