// Mengambil jadwal sholat resmi Kemenag (bimasislam.kemenag.go.id) sebagai data acuan uji akurasi
// (PRD §F3.2) dan menulisnya ke src/lib/domain/fixtures/kemenag.ts.
//
// Dijalankan MANUAL, sekali, oleh pengembang: node scripts/fetch-kemenag-fixture.mjs
// JANGAN dimasukkan ke CI (situs pihak ketiga; hasilnya di-commit). Ada jeda antar-request.
// Tanpa dependensi. Angka di fixture tidak pernah diketik tangan.
// Timeout, percobaan ulang (429/5xx), dan log progres: scripts/lib/net.mjs.
import { writeFileSync } from 'node:fs';
import { fetchWithRetry, log, main } from './lib/net.mjs';

const BASE = 'https://bimasislam.kemenag.go.id';
const PAGE = `${BASE}/jadwalshalat`;
const DELAY_MS = 1500;
const OUT = 'src/lib/domain/fixtures/kemenag.ts';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36';

/**
 * Kota acuan (cityId = kode Kemendagri = `code` di src/lib/data/cities.ts) dan tanggal uji: ekuinoks +
 * dua titik balik matahari. Kemenag hanya punya satu entri "KOTA JAKARTA"; dipetakan ke Jakarta Pusat.
 */
const TARGETS = [
  { cityId: '3173', province: 'DKI JAKARTA', kabko: 'KOTA JAKARTA' },
  { cityId: '3578', province: 'JAWA TIMUR', kabko: 'KOTA SURABAYA' },
  { cityId: '7371', province: 'SULAWESI SELATAN', kabko: 'KOTA MAKASSAR' }
];
const DATES = ['2026-03-20', '2026-06-21', '2026-12-21'];
const FIELDS = ['imsak', 'subuh', 'terbit', 'dhuha', 'dzuhur', 'ashar', 'maghrib', 'isya'];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let cookie = '';

async function request(label, url, body) {
  await sleep(DELAY_MS);
  const res = await fetchWithRetry('kemenag', label, url, {
    method: body ? 'POST' : 'GET',
    headers: {
      'User-Agent': UA,
      'Accept-Language': 'id-ID,id;q=0.9',
      Referer: PAGE,
      ...(cookie && { Cookie: cookie }),
      ...(body && {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest'
      })
    },
    body: body ? new URLSearchParams(body).toString() : undefined
  });
  const setCookies = res.headers.getSetCookie();
  if (setCookies.length) {
    const jar = new Map(
      cookie
        .split('; ')
        .filter(Boolean)
        .map((c) => c.split(/=(.*)/s).slice(0, 2))
    );
    for (const c of setCookies) {
      const [pair] = c.split(';');
      const [k, v] = pair.split(/=(.*)/s);
      jar.set(k.trim(), v);
    }
    cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
  }
  return res.text();
}

/** <option value="kode">NAMA</option> → Map(NAMA → kode) */
function parseOptions(html) {
  return new Map(
    [...html.matchAll(/<option value="([0-9a-f]{32})"[^>]*>([^<]+)<\/option>/g)].map((m) => [
      m[2].trim(),
      m[1]
    ])
  );
}

/** Galat apa pun dilempar; main() mencetaknya dan mengatur exit 1. */
function fail(message) {
  throw new Error(`[kemenag] ${message}`);
}

main('kemenag', async () => {
  const retrievedAt = new Date().toISOString();
  // Kunjungan pertama hanya membuat sesi; daftar provinsi baru terisi saat cookie sesi terkirim.
  let provinces = parseOptions(await request('halaman jadwal (sesi)', PAGE));
  if (provinces.size === 0) provinces = parseOptions(await request('halaman jadwal (daftar provinsi)', PAGE));
  if (provinces.size === 0) fail('daftar provinsi kosong (sesi/cookie gagal?)');

  const fixtures = [];
  for (const target of TARGETS) {
    const x = provinces.get(target.province) ?? fail(`provinsi ${target.province} tidak ditemukan`);
    const kabkos = parseOptions(
      await request(`daftar kab/kota ${target.province}`, `${BASE}/ajax/getKabkoshalat`, { x })
    );
    const y = kabkos.get(target.kabko) ?? fail(`${target.kabko} tidak ditemukan di ${target.province}`);

    const months = [...new Set(DATES.map((d) => d.slice(0, 7)))];
    for (const ym of months) {
      const [thn, bln] = ym.split('-');
      const params = { x, y, bln: String(Number(bln)), thn };
      const json = JSON.parse(
        await request(`jadwal ${target.kabko} ${ym}`, `${BASE}/ajax/getShalatbln`, params)
      );
      if (json.status !== 1) fail(`respons gagal untuk ${target.kabko} ${ym}: ${json.message}`);
      for (const date of DATES.filter((d) => d.startsWith(ym))) {
        const day = json.data[date] ?? fail(`${date} tidak ada di respons ${target.kabko}`);
        const times = Object.fromEntries(FIELDS.map((f) => [f, day[f]]));
        for (const [f, v] of Object.entries(times)) {
          if (!/^\d{2}:\d{2}$/.test(v ?? '')) fail(`${target.kabko} ${date} ${f} tidak valid: ${v}`);
        }
        fixtures.push({
          cityId: target.cityId,
          date,
          kemenag: { prov: json.prov, kabko: json.kabko, x, y, bln: params.bln, thn },
          times
        });
      }
    }
    log('kemenag', `${target.kabko}: ${DATES.length} tanggal`);
  }

  const header = `// DIHASILKAN oleh scripts/fetch-kemenag-fixture.mjs. Jangan diedit tangan.
// Jadwal sholat resmi Kemenag RI sebagai data acuan uji akurasi (PRD §F3.2).
`;
  const body = `import type { LocalDate, LocalTime } from '../types';

export const KEMENAG_SOURCE = {
  page: '${PAGE}',
  endpoint: '${BASE}/ajax/getShalatbln',
  method: 'POST (x = kode provinsi, y = kode kab/kota, bln, thn; sesi cookie dari halaman)',
  retrievedAt: '${retrievedAt}'
} as const;

export type KemenagField = ${FIELDS.map((f) => `'${f}'`).join(' | ')};

export interface KemenagFixture {
  /** kode Kemendagri = field code di src/lib/data/cities.ts */
  cityId: string;
  date: LocalDate;
  kemenag: { prov: string; kabko: string; x: string; y: string; bln: string; thn: string };
  times: Record<KemenagField, LocalTime>;
}

export const KEMENAG_FIXTURES: KemenagFixture[] = ${JSON.stringify(fixtures, null, 2)};
`;
  writeFileSync(OUT, header + body);
  log('kemenag', `${fixtures.length} entri ditulis ke ${OUT}`);
});
