// Helper jaringan untuk skrip manual (fetch-cities, fetch-kemenag-fixture). Tanpa dependensi.
// - Setiap request memakai AbortSignal.timeout(90 detik) dan pesan jelas jika waktu habis.
// - 429/5xx (dan waktu habis/galat jaringan) dicoba ulang maksimal 2 kali, menunggu Retry-After
//   atau 10 detik. Setelah itu melempar galat → skrip berhenti dengan exit 1.
// - Progres dicetak per langkah agar terlihat jika macet.

export const TIMEOUT_MS = 90_000;
const MAX_RETRIES = 2;
const DEFAULT_WAIT_S = 10;

/** User-Agent sesuai kebijakan Wikimedia: nama alat/versi + URL kontak. */
export const WIKIMEDIA_USER_AGENT = 'KalaPlanner/0.1 (https://github.com/hanzis22/Kala)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function log(tag, message) {
  console.log(`[${tag}] ${new Date().toISOString().slice(11, 19)} ${message}`);
}

function retryAfterSeconds(res) {
  const value = res.headers.get('retry-after');
  if (!value) return DEFAULT_WAIT_S;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(1, seconds);
  const date = Date.parse(value);
  return Number.isNaN(date) ? DEFAULT_WAIT_S : Math.max(1, Math.ceil((date - Date.now()) / 1000));
}

/**
 * fetch dengan timeout + percobaan ulang. Mengembalikan Response yang ok (2xx).
 * @param {string} tag label log, misal 'cities'
 * @param {string} label nama langkah, misal 'query kota/kabupaten'
 */
export async function fetchWithRetry(tag, label, url, init = {}) {
  for (let attempt = 0; ; attempt++) {
    const suffix = attempt ? ` (percobaan ulang ${attempt}/${MAX_RETRIES})` : '';
    log(tag, `→ ${label}${suffix}`);
    const started = Date.now();
    let res;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (err) {
      const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
      const reason = timedOut
        ? `waktu habis setelah ${TIMEOUT_MS / 1000} detik tanpa respons`
        : `galat jaringan: ${err?.cause?.code ?? err?.message ?? err}`;
      if (attempt >= MAX_RETRIES)
        throw new Error(`${label}: ${reason}; menyerah setelah ${MAX_RETRIES} percobaan ulang`, {
          cause: err
        });
      log(tag, `✗ ${label}: ${reason}; coba lagi dalam ${DEFAULT_WAIT_S} detik`);
      await sleep(DEFAULT_WAIT_S * 1000);
      continue;
    }
    const secs = ((Date.now() - started) / 1000).toFixed(1);
    if (res.ok) {
      log(tag, `✓ ${label}: HTTP ${res.status} dalam ${secs} detik`);
      return res;
    }
    const retriable = res.status === 429 || res.status >= 500;
    if (!retriable || attempt >= MAX_RETRIES) {
      const body = (await res.text().catch(() => '')).slice(0, 300);
      throw new Error(
        `${label}: HTTP ${res.status}${retriable ? `; menyerah setelah ${MAX_RETRIES} percobaan ulang` : ''} ${body}`
      );
    }
    const wait = retryAfterSeconds(res);
    log(tag, `✗ ${label}: HTTP ${res.status} dalam ${secs} detik; coba lagi dalam ${wait} detik`);
    await res.body?.cancel().catch(() => {});
    await sleep(wait * 1000);
  }
}

/** Query SPARQL Wikidata (GET) dengan header sesuai kebijakan Wikimedia. Mengembalikan bindings. */
export async function sparql(tag, label, query) {
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`;
  const res = await fetchWithRetry(tag, label, url, {
    headers: { Accept: 'application/sparql-results+json', 'User-Agent': WIKIMEDIA_USER_AGENT }
  });
  const rows = (await res.json()).results.bindings;
  log(tag, `  ${label}: ${rows.length} baris diterima`);
  return rows;
}

/** Menjalankan fungsi utama skrip; galat apa pun → pesan jelas + exit 1 (tanpa process.exit). */
export function main(tag, fn) {
  fn().catch((err) => {
    console.error(`[${tag}] GAGAL: ${err?.message ?? err}`);
    process.exitCode = 1;
  });
}
