// Membuat src/lib/data/cities.ts: semua kota & kabupaten di Indonesia + ibu kota provinsi yang bukan
// kota/kabupaten (Tanjung Selor, Sofifi, Wamena), dengan koordinat dari Wikidata (CC0).
//
// Dijalankan MANUAL oleh pengembang: node scripts/fetch-cities.mjs   (JANGAN di CI)
// Satu query SPARQL. Gagal (exit 1) sambil mencetak daftar jika ada entri tanpa koordinat, tanpa/ganda
// provinsi, kode ganda, koordinat di luar Indonesia atau jauh dari provinsinya, atau ibu kota provinsi
// yang tidak ditemukan. Tidak ada entri yang dibuang diam-diam.
// Sumber dan lisensi: docs/sumber-konten.md. Jaringan: scripts/lib/net.mjs.
import { writeFileSync } from 'node:fs';
import { log, main, sparql } from './lib/net.mjs';

const TAG = 'cities';
const OUT = 'src/lib/data/cities.ts';

/** Ibu kota provinsi yang bukan kota/kabupaten: item Wikidata kotanya sendiri (diverifikasi manual). */
const TOWNS = {
  Q976062: 'Tanjung Selor (Kab. Bulungan)',
  Q1350702: 'Sofifi (Kota Tidore Kepulauan)',
  Q2307531: 'Wamena (Kab. Jayawijaya)'
};

/** 38 provinsi (label Wikidata, bahasa Indonesia) → nama resmi + zona waktu (UU/Keppres WIB/WITA/WIT). */
const PROVINCES = {
  Aceh: ['Aceh', 'Asia/Jakarta'],
  'Sumatera Utara': ['Sumatera Utara', 'Asia/Jakarta'],
  'Sumatera Barat': ['Sumatera Barat', 'Asia/Jakarta'],
  Riau: ['Riau', 'Asia/Jakarta'],
  'Kepulauan Riau': ['Kepulauan Riau', 'Asia/Jakarta'],
  Jambi: ['Jambi', 'Asia/Jakarta'],
  'Sumatera Selatan': ['Sumatera Selatan', 'Asia/Jakarta'],
  'Kepulauan Bangka Belitung': ['Kepulauan Bangka Belitung', 'Asia/Jakarta'],
  Bengkulu: ['Bengkulu', 'Asia/Jakarta'],
  Lampung: ['Lampung', 'Asia/Jakarta'],
  Jakarta: ['DKI Jakarta', 'Asia/Jakarta'],
  'Jawa Barat': ['Jawa Barat', 'Asia/Jakarta'],
  Banten: ['Banten', 'Asia/Jakarta'],
  'Jawa Tengah': ['Jawa Tengah', 'Asia/Jakarta'],
  Yogyakarta: ['DI Yogyakarta', 'Asia/Jakarta'],
  'Jawa Timur': ['Jawa Timur', 'Asia/Jakarta'],
  'Kalimantan Barat': ['Kalimantan Barat', 'Asia/Jakarta'],
  'Kalimantan Tengah': ['Kalimantan Tengah', 'Asia/Jakarta'],
  Bali: ['Bali', 'Asia/Makassar'],
  'Nusa Tenggara Barat': ['Nusa Tenggara Barat', 'Asia/Makassar'],
  'Nusa Tenggara Timur': ['Nusa Tenggara Timur', 'Asia/Makassar'],
  'Kalimantan Selatan': ['Kalimantan Selatan', 'Asia/Makassar'],
  'Kalimantan Timur': ['Kalimantan Timur', 'Asia/Makassar'],
  'Kalimantan Utara': ['Kalimantan Utara', 'Asia/Makassar'],
  'Sulawesi Utara': ['Sulawesi Utara', 'Asia/Makassar'],
  Gorontalo: ['Gorontalo', 'Asia/Makassar'],
  'Sulawesi Tengah': ['Sulawesi Tengah', 'Asia/Makassar'],
  'Sulawesi Barat': ['Sulawesi Barat', 'Asia/Makassar'],
  'Sulawesi Selatan': ['Sulawesi Selatan', 'Asia/Makassar'],
  'Sulawesi Tenggara': ['Sulawesi Tenggara', 'Asia/Makassar'],
  Maluku: ['Maluku', 'Asia/Jayapura'],
  'Maluku Utara': ['Maluku Utara', 'Asia/Jayapura'],
  Papua: ['Papua', 'Asia/Jayapura'],
  'Papua Barat': ['Papua Barat', 'Asia/Jayapura'],
  'Papua Barat Daya': ['Papua Barat Daya', 'Asia/Jayapura'],
  'Papua Tengah': ['Papua Tengah', 'Asia/Jayapura'],
  'Papua Pegunungan': ['Papua Pegunungan', 'Asia/Jayapura'],
  'Papua Selatan': ['Papua Selatan', 'Asia/Jayapura']
};

/** Ibu kota 38 provinsi: [provinsi (label Wikidata), nama entri di cities.ts]. Wajib ada semua. */
const CAPITALS = [
  ['Aceh', 'Banda Aceh'],
  ['Sumatera Utara', 'Medan'],
  ['Sumatera Barat', 'Padang'],
  ['Riau', 'Pekanbaru'],
  ['Kepulauan Riau', 'Tanjungpinang'],
  ['Jambi', 'Jambi'],
  ['Sumatera Selatan', 'Palembang'],
  ['Kepulauan Bangka Belitung', 'Pangkal Pinang'],
  ['Bengkulu', 'Bengkulu'],
  ['Lampung', 'Bandar Lampung'],
  ['Jakarta', 'Jakarta Pusat'],
  ['Jawa Barat', 'Bandung'],
  ['Banten', 'Serang'],
  ['Jawa Tengah', 'Semarang'],
  ['Yogyakarta', 'Yogyakarta'],
  ['Jawa Timur', 'Surabaya'],
  ['Kalimantan Barat', 'Pontianak'],
  ['Kalimantan Tengah', 'Palangka Raya'],
  ['Bali', 'Denpasar'],
  ['Nusa Tenggara Barat', 'Mataram'],
  ['Nusa Tenggara Timur', 'Kupang'],
  ['Kalimantan Selatan', 'Banjarbaru'],
  ['Kalimantan Timur', 'Samarinda'],
  ['Kalimantan Utara', 'Tanjung Selor'],
  ['Sulawesi Utara', 'Manado'],
  ['Gorontalo', 'Gorontalo'],
  ['Sulawesi Tengah', 'Palu'],
  ['Sulawesi Barat', 'Kab. Mamuju'],
  ['Sulawesi Selatan', 'Makassar'],
  ['Sulawesi Tenggara', 'Kendari'],
  ['Maluku', 'Ambon'],
  ['Maluku Utara', 'Sofifi'],
  ['Papua', 'Jayapura'],
  ['Papua Barat', 'Kab. Manokwari'],
  ['Papua Barat Daya', 'Sorong'],
  ['Papua Tengah', 'Kab. Nabire'],
  ['Papua Pegunungan', 'Wamena'],
  ['Papua Selatan', 'Kab. Merauke']
];

/** Batas kasar wilayah Indonesia. */
const BBOX = { minLat: -11.5, maxLat: 6.5, minLng: 94.5, maxLng: 141.5 };
/** Koordinat ganda pada satu item digabung (rata-rata) hanya jika berdekatan. */
const MERGE_MAX_KM = 25;
/** Pencilan: jarak dari median provinsi > max(MIN_KM, FACTOR × persentil-90 jarak anggota provinsi). */
const OUTLIER_MIN_KM = 300;
const OUTLIER_FACTOR = 2.5;

const QUERY = `SELECT ?item ?itemLabel ?kode ?coord ?prov ?provLabel ?kind WHERE {
  {
    ?item wdt:P1588 ?kode; wdt:P17 wd:Q252.
    FILTER(REGEX(?kode, "^[0-9]{2}[.]?[0-9]{2}$"))
    FILTER NOT EXISTS { ?item wdt:P576 ?dissolved. }
    OPTIONAL { ?item wdt:P131 ?prov. ?prov wdt:P31 wd:Q5098. }
    BIND("region" AS ?kind)
  } UNION {
    VALUES ?item { ${Object.keys(TOWNS)
      .map((q) => `wd:${q}`)
      .join(' ')} }
    OPTIONAL { ?item wdt:P131+ ?prov. ?prov wdt:P31 wd:Q5098. }
    BIND("town" AS ?kind)
  }
  OPTIONAL { ?item wdt:P625 ?coord. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "id,en". }
}`;

function km(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const percentile = (xs, p) =>
  [...xs].sort((a, b) => a - b)[Math.min(xs.length - 1, Math.floor(p * xs.length))];

function parsePoint(wkt) {
  const m = /^Point\(([-\d.eE]+) ([-\d.eE]+)\)$/.exec(wkt);
  return m ? { lng: Number(m[1]), lat: Number(m[2]) } : null;
}

function displayName(label, code, kind) {
  if (kind === 'town') return label;
  // Kode Kemendagri: digit ke-3 '7' = kota (termasuk kota administrasi Jakarta), selain itu kabupaten.
  return code[2] === '7' ? label.replace(/^Kota /, '') : `Kab. ${label.replace(/^Kabupaten /, '')}`;
}

main(TAG, async () => {
  const retrievedAt = new Date().toISOString();
  log(TAG, 'langkah 1/3: query Wikidata (semua kota & kabupaten + 3 ibu kota non-kab, satu query)');
  const rows = await sparql(TAG, 'query kota/kabupaten', QUERY);

  log(TAG, 'langkah 2/3: mengelompokkan dan memvalidasi');
  const items = new Map();
  for (const r of rows) {
    const qid = r.item.value.split('/').pop();
    const e = items.get(qid) ?? {
      qid,
      label: r.itemLabel.value,
      kind: r.kind.value,
      codes: new Set(),
      coords: new Map(),
      provinces: new Set()
    };
    if (r.kode) e.codes.add(r.kode.value.replace('.', ''));
    if (r.coord) e.coords.set(r.coord.value, parsePoint(r.coord.value));
    if (r.prov) e.provinces.add(r.provLabel.value);
    items.set(qid, e);
  }
  log(TAG, `  ${items.size} item unik dari ${rows.length} baris`);

  const errors = [];
  const notices = [];
  const cities = [];
  for (const e of items.values()) {
    const where = `${e.label} (${e.qid}${e.codes.size ? ', ' + [...e.codes].join('/') : ''})`;
    const points = [...e.coords.values()];
    if (e.coords.size === 0) {
      errors.push(`tanpa koordinat: ${where}`);
      continue;
    }
    if (points.some((p) => p === null)) {
      errors.push(`koordinat tidak terbaca: ${where} ${[...e.coords.keys()].join(' ')}`);
      continue;
    }
    let point = points[0];
    if (points.length > 1) {
      const spread = Math.max(...points.flatMap((a) => points.map((b) => km(a, b))));
      if (spread > MERGE_MAX_KM) {
        errors.push(`koordinat ganda berjauhan (${spread.toFixed(1)} km): ${where}`);
        continue;
      }
      point = {
        lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
        lng: points.reduce((s, p) => s + p.lng, 0) / points.length
      };
      notices.push(`koordinat ganda digabung (selisih ${spread.toFixed(1)} km, rata-rata): ${where}`);
    }
    if (e.codes.size > 1) {
      errors.push(`kode ganda: ${where}`);
      continue;
    }
    if (e.provinces.size !== 1) {
      errors.push(
        `${e.provinces.size === 0 ? 'tanpa provinsi' : 'provinsi ganda: ' + [...e.provinces].join(', ')}: ${where}`
      );
      continue;
    }
    const provLabel = [...e.provinces][0];
    if (!PROVINCES[provLabel]) {
      errors.push(`provinsi tidak dikenal "${provLabel}": ${where}`);
      continue;
    }
    if (
      point.lat < BBOX.minLat ||
      point.lat > BBOX.maxLat ||
      point.lng < BBOX.minLng ||
      point.lng > BBOX.maxLng
    ) {
      errors.push(`koordinat di luar Indonesia: ${where} ${point.lat},${point.lng}`);
      continue;
    }
    const code = e.kind === 'region' ? [...e.codes][0] : null;
    if (e.kind === 'region' && !code) {
      errors.push(`tanpa kode Kemendagri: ${where}`);
      continue;
    }
    const [province, timeZone] = PROVINCES[provLabel];
    cities.push({
      id: e.qid,
      code,
      name: displayName(e.label, code, e.kind),
      province,
      provLabel,
      lat: Math.round(point.lat * 1e4) / 1e4,
      lng: Math.round(point.lng * 1e4) / 1e4,
      timeZone
    });
  }

  // Kode Kemendagri unik.
  const byCode = new Map();
  for (const c of cities) if (c.code) byCode.set(c.code, [...(byCode.get(c.code) ?? []), c]);
  for (const [code, list] of byCode) {
    if (list.length > 1)
      errors.push(
        `kode ${code} dipakai ${list.length} item: ${list.map((c) => `${c.name} (${c.id})`).join(', ')}`
      );
  }

  // Semua provinsi terwakili.
  const seen = new Set(cities.map((c) => c.provLabel));
  for (const p of Object.keys(PROVINCES)) if (!seen.has(p)) errors.push(`provinsi tanpa entri: ${p}`);

  // Koordinat jauh dari provinsinya (pencilan terhadap median anggota provinsi).
  const distReport = [];
  for (const p of seen) {
    const members = cities.filter((c) => c.provLabel === p);
    const center = { lat: median(members.map((c) => c.lat)), lng: median(members.map((c) => c.lng)) };
    const dists = members.map((c) => km(center, c));
    const limit = Math.max(OUTLIER_MIN_KM, OUTLIER_FACTOR * percentile(dists, 0.9));
    members.forEach((c, i) => {
      distReport.push({ c, d: dists[i], limit });
      if (dists[i] > limit) {
        errors.push(
          `koordinat jauh dari provinsinya (${dists[i].toFixed(0)} km dari median ${p}, batas ${limit.toFixed(0)} km): ${c.name} (${c.id}) ${c.lat},${c.lng}`
        );
      }
    });
  }
  distReport.sort((a, b) => b.d / b.limit - a.d / a.limit);
  log(TAG, '  5 entri terjauh dari median provinsinya (untuk ditinjau):');
  for (const { c, d, limit } of distReport.slice(0, 5)) {
    log(TAG, `    ${c.name}, ${c.province}: ${d.toFixed(0)} km (batas ${limit.toFixed(0)} km)`);
  }

  // Ibu kota provinsi.
  for (const [prov, name] of CAPITALS) {
    const found = cities.filter((c) => c.provLabel === prov && c.name === name);
    if (found.length !== 1)
      errors.push(
        `ibu kota ${name} (${prov}) ${found.length === 0 ? 'tidak ditemukan' : `ditemukan ${found.length}×`}`
      );
  }

  for (const n of notices) log(TAG, `  catatan: ${n}`);
  if (errors.length) {
    console.error(`[${TAG}] ${errors.length} masalah ditemukan; cities.ts TIDAK ditulis:`);
    for (const e of errors) console.error(`  - ${e}`);
    throw new Error('validasi gagal');
  }

  log(TAG, `langkah 3/3: menulis ${OUT}`);
  cities.sort((a, b) => a.province.localeCompare(b.province, 'id') || a.name.localeCompare(b.name, 'id'));
  const capitalIds = CAPITALS.map(
    ([prov, name]) => cities.find((c) => c.provLabel === prov && c.name === name).id
  );
  const data = cities.map(({ id, code, name, province, lat, lng, timeZone }) => ({
    id,
    code,
    name,
    province,
    lat,
    lng,
    timeZone
  }));
  const file = `// DIHASILKAN oleh scripts/fetch-cities.mjs. Jangan diedit tangan.
// Koordinat: Wikidata (CC0). Sumber dan query: docs/sumber-konten.md.
import type { City } from '$lib/domain/types';

export const CITIES_SOURCE = {
  name: 'Wikidata',
  license: 'CC0 1.0',
  endpoint: 'https://query.wikidata.org/sparql',
  retrievedAt: '${retrievedAt}'
} as const;

/** id ibu kota 38 provinsi. */
export const PROVINCE_CAPITAL_IDS: readonly string[] = ${JSON.stringify(capitalIds)};

export const CITIES: readonly City[] = ${JSON.stringify(data, null, 2)};
`;
  writeFileSync(OUT, file);
  log(
    TAG,
    `${cities.length} entri (${cities.filter((c) => !c.code).length} ibu kota non-kab) ditulis ke ${OUT}`
  );
});
