// DIHASILKAN oleh scripts/fetch-kemenag-fixture.mjs. Jangan diedit tangan.
// Jadwal sholat resmi Kemenag RI sebagai data acuan uji akurasi (PRD §F3.2).
import type { LocalDate, LocalTime } from '../types';

export const KEMENAG_SOURCE = {
  page: 'https://bimasislam.kemenag.go.id/jadwalshalat',
  endpoint: 'https://bimasislam.kemenag.go.id/ajax/getShalatbln',
  method: 'POST (x = kode provinsi, y = kode kab/kota, bln, thn; sesi cookie dari halaman)',
  retrievedAt: '2026-10-17T05:19:38.010Z'
} as const;

export type KemenagField = 'imsak' | 'subuh' | 'terbit' | 'dhuha' | 'dzuhur' | 'ashar' | 'maghrib' | 'isya';

export interface KemenagFixture {
  /** id kota di src/lib/data/cities.ts */
  cityId: string;
  date: LocalDate;
  kemenag: { prov: string; kabko: string; x: string; y: string; bln: string; thn: string };
  times: Record<KemenagField, LocalTime>;
}

export const KEMENAG_FIXTURES: KemenagFixture[] = [
  {
    "cityId": "3173",
    "date": "2026-03-20",
    "kemenag": {
      "prov": "DKI JAKARTA",
      "kabko": "KOTA JAKARTA",
      "x": "c51ce410c124a10e0db5e4b97fc2af39",
      "y": "58a2fc6ed39fd083f55d4182bf88826d",
      "bln": "3",
      "thn": "2026"
    },
    "times": {
      "imsak": "04:32",
      "subuh": "04:42",
      "terbit": "05:54",
      "dhuha": "06:21",
      "dzuhur": "12:04",
      "ashar": "15:13",
      "maghrib": "18:07",
      "isya": "19:15"
    }
  },
  {
    "cityId": "3173",
    "date": "2026-06-21",
    "kemenag": {
      "prov": "DKI JAKARTA",
      "kabko": "KOTA JAKARTA",
      "x": "c51ce410c124a10e0db5e4b97fc2af39",
      "y": "58a2fc6ed39fd083f55d4182bf88826d",
      "bln": "6",
      "thn": "2026"
    },
    "times": {
      "imsak": "04:30",
      "subuh": "04:40",
      "terbit": "05:58",
      "dhuha": "06:27",
      "dzuhur": "11:58",
      "ashar": "15:19",
      "maghrib": "17:51",
      "isya": "19:05"
    }
  },
  {
    "cityId": "3173",
    "date": "2026-12-21",
    "kemenag": {
      "prov": "DKI JAKARTA",
      "kabko": "KOTA JAKARTA",
      "x": "c51ce410c124a10e0db5e4b97fc2af39",
      "y": "58a2fc6ed39fd083f55d4182bf88826d",
      "bln": "12",
      "thn": "2026"
    },
    "times": {
      "imsak": "04:03",
      "subuh": "04:13",
      "terbit": "05:33",
      "dhuha": "06:02",
      "dzuhur": "11:54",
      "ashar": "15:20",
      "maghrib": "18:08",
      "isya": "19:24"
    }
  },
  {
    "cityId": "3578",
    "date": "2026-03-20",
    "kemenag": {
      "prov": "JAWA TIMUR",
      "kabko": "KOTA SURABAYA",
      "x": "c74d97b01eae257e44aa9d5bade97baf",
      "y": "4734ba6f3de83d861c3176a6273cac6d",
      "bln": "3",
      "thn": "2026"
    },
    "times": {
      "imsak": "04:08",
      "subuh": "04:18",
      "terbit": "05:30",
      "dhuha": "05:57",
      "dzuhur": "11:40",
      "ashar": "14:51",
      "maghrib": "17:43",
      "isya": "18:52"
    }
  },
  {
    "cityId": "3578",
    "date": "2026-06-21",
    "kemenag": {
      "prov": "JAWA TIMUR",
      "kabko": "KOTA SURABAYA",
      "x": "c74d97b01eae257e44aa9d5bade97baf",
      "y": "4734ba6f3de83d861c3176a6273cac6d",
      "bln": "6",
      "thn": "2026"
    },
    "times": {
      "imsak": "04:09",
      "subuh": "04:19",
      "terbit": "05:37",
      "dhuha": "06:06",
      "dzuhur": "11:34",
      "ashar": "14:54",
      "maghrib": "17:25",
      "isya": "18:39"
    }
  },
  {
    "cityId": "3578",
    "date": "2026-12-21",
    "kemenag": {
      "prov": "JAWA TIMUR",
      "kabko": "KOTA SURABAYA",
      "x": "c74d97b01eae257e44aa9d5bade97baf",
      "y": "4734ba6f3de83d861c3176a6273cac6d",
      "bln": "12",
      "thn": "2026"
    },
    "times": {
      "imsak": "03:37",
      "subuh": "03:47",
      "terbit": "05:07",
      "dhuha": "05:36",
      "dzuhur": "11:31",
      "ashar": "14:57",
      "maghrib": "17:47",
      "isya": "19:03"
    }
  },
  {
    "cityId": "7371",
    "date": "2026-03-20",
    "kemenag": {
      "prov": "SULAWESI SELATAN",
      "kabko": "KOTA MAKASSAR",
      "x": "4e732ced3463d06de0ca9a15b6153677",
      "y": "b7b16ecf8ca53723593894116071700c",
      "bln": "3",
      "thn": "2026"
    },
    "times": {
      "imsak": "04:42",
      "subuh": "04:52",
      "terbit": "06:03",
      "dhuha": "06:30",
      "dzuhur": "12:13",
      "ashar": "15:21",
      "maghrib": "18:16",
      "isya": "19:25"
    }
  },
  {
    "cityId": "7371",
    "date": "2026-06-21",
    "kemenag": {
      "prov": "SULAWESI SELATAN",
      "kabko": "KOTA MAKASSAR",
      "x": "4e732ced3463d06de0ca9a15b6153677",
      "y": "b7b16ecf8ca53723593894116071700c",
      "bln": "6",
      "thn": "2026"
    },
    "times": {
      "imsak": "04:38",
      "subuh": "04:48",
      "terbit": "06:06",
      "dhuha": "06:35",
      "dzuhur": "12:08",
      "ashar": "15:29",
      "maghrib": "18:02",
      "isya": "19:16"
    }
  },
  {
    "cityId": "7371",
    "date": "2026-12-21",
    "kemenag": {
      "prov": "SULAWESI SELATAN",
      "kabko": "KOTA MAKASSAR",
      "x": "4e732ced3463d06de0ca9a15b6153677",
      "y": "b7b16ecf8ca53723593894116071700c",
      "bln": "12",
      "thn": "2026"
    },
    "times": {
      "imsak": "04:15",
      "subuh": "04:25",
      "terbit": "05:44",
      "dhuha": "06:13",
      "dzuhur": "12:04",
      "ashar": "15:30",
      "maghrib": "18:16",
      "isya": "19:31"
    }
  }
];
