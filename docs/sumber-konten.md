# Sumber konten dan data

Setiap data atau teks yang berasal dari luar Kala dicatat di sini: asal, lisensi, cara mengambil, dan tanggal pengambilan. Lihat juga CLAUDE.md bagian "Larangan".

## Daftar kota/kabupaten (`src/lib/data/cities.ts`)

| | |
|---|---|
| Sumber | [Wikidata](https://www.wikidata.org/) lewat SPARQL `https://query.wikidata.org/sparql` |
| Lisensi | CC0 1.0 (domain publik), boleh dibundel tanpa atribusi; atribusi tetap dicatat di sini |
| Diambil | 17 Oktober 2026 (`CITIES_SOURCE.retrievedAt` di file data) |
| Skrip | `scripts/fetch-cities.mjs` (manual, tidak dijalankan di CI) |
| Isi | 514 kota/kabupaten + 3 ibu kota provinsi yang bukan kota/kabupaten = 517 entri, 38 provinsi |

Cara pengambilan (satu query):

- **Kota/kabupaten**: item dengan kode wilayah Kemendagri (P1588) 4 digit, negara Indonesia (P17 = Q252), belum dibubarkan (tanpa P576). Koordinat dari P625, provinsi dari P131 ke item berjenis provinsi Indonesia (Q5098).
- **Ibu kota non-kota/kab**: Tanjung Selor (Q976062), Sofifi (Q1350702), Wamena (Q2307531). Provinsinya diambil dari P131 berantai.
- **id**: QID Wikidata. Kode Kemendagri di Wikidata untuk wilayah Papua sebagian masih kode lama (sebelum pemekaran 2022), jadi kode hanya disimpan sebagai `code`, bukan dipakai sebagai id.
- **Zona waktu**: diturunkan dari provinsi. WIB: Sumatra, Jawa, Kalbar, Kalteng. WITA: Bali, Nusa Tenggara, Kalsel, Kaltim, Kaltara, Sulawesi. WIT: Maluku, Papua.

Validasi otomatis di skrip. Skrip gagal dan tidak menulis file jika ada salah satu dari:

- entri tanpa koordinat;
- provinsi kosong atau ganda;
- kode ganda;
- koordinat di luar batas Indonesia;
- koordinat jauh dari median provinsinya (lebih dari max(300 km, 2,5 × persentil-90));
- ibu kota provinsi yang tidak ditemukan.

Koordinat ganda pada satu item digabung (dirata-rata) hanya jika berjarak ≤ 25 km, dan dicetak di log. Pada pengambilan 17 Oktober 2026 ini terjadi pada Pontianak (Q14168), dua titik berjarak 7,5 km.

## Jadwal sholat acuan Kemenag (`src/lib/domain/fixtures/kemenag.ts`)

Data ini **hanya untuk uji akurasi** (PRD §F3.2) dan tidak ditampilkan di app. App menghitung waktu sholat sendiri secara offline.

| | |
|---|---|
| Sumber | Bimas Islam Kementerian Agama RI, `https://bimasislam.kemenag.go.id/jadwalshalat` (endpoint `ajax/getShalatbln`) |
| Diambil | 17 Oktober 2026 (`KEMENAG_SOURCE.retrievedAt`) |
| Skrip | `scripts/fetch-kemenag-fixture.mjs` (manual, sekali, dengan jeda antar-request; tidak di CI) |
| Isi | KOTA JAKARTA, KOTA SURABAYA, KOTA MAKASSAR × 20 Mar, 21 Jun, 21 Des 2026 × 8 waktu |

## Teks doa dan dzikir

Belum ada (Fase 2). Setiap teks yang ditambahkan wajib dicatat di sini beserta sumbernya dan pihak yang memverifikasi (PRD §10 #5).
