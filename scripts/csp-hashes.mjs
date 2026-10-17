// Mengisi hash sha256 skrip inline ke CSP di build/_headers.
// Dijalankan setelah `vite build` (lihat script "build" di package.json).
// Gagal (exit 1) jika _headers tidak ada, tidak ada skrip inline, placeholder masih tersisa, atau
// ada baris yang melebihi batas Cloudflare (2.000 karakter per baris di _headers).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const BUILD_DIR = 'build';
const HEADERS_FILE = join(BUILD_DIR, '_headers');
const PLACEHOLDER = '__INLINE_SCRIPT_HASHES__';
// Batas Cloudflare Workers static assets, termasuk spasi, nama header, dan nilainya.
const MAX_LINE_LENGTH = 2000;
// <script> tanpa atribut src.
const INLINE_SCRIPT_RE = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;

function fail(message) {
  console.error(`[csp-hashes] ${message}`);
  process.exit(1);
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

let headers;
try {
  headers = readFileSync(HEADERS_FILE, 'utf8');
} catch {
  fail(`${HEADERS_FILE} tidak ditemukan`);
}

const hashes = new Set();
for (const file of htmlFiles(BUILD_DIR)) {
  for (const [, body] of readFileSync(file, 'utf8').matchAll(INLINE_SCRIPT_RE)) {
    if (body.trim() === '') continue;
    hashes.add(`'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`);
  }
}

if (hashes.size === 0) fail('tidak ada skrip inline ditemukan di build/*.html');

const result = headers.replaceAll(PLACEHOLDER, [...hashes].sort().join(' '));
if (result.includes(PLACEHOLDER)) fail(`placeholder ${PLACEHOLDER} masih tersisa di ${HEADERS_FILE}`);
if (result === headers) fail(`placeholder ${PLACEHOLDER} tidak ditemukan di ${HEADERS_FILE}`);

const tooLong = result
  .split(/\r?\n/)
  .map((line, i) => ({ number: i + 1, length: line.length }))
  .filter(({ length }) => length > MAX_LINE_LENGTH);
if (tooLong.length > 0) {
  const detail = tooLong.map(({ number, length }) => `baris ${number}: ${length} karakter`).join(', ');
  fail(`baris di ${HEADERS_FILE} melebihi ${MAX_LINE_LENGTH} karakter (${detail})`);
}

writeFileSync(HEADERS_FILE, result);
console.log(`[csp-hashes] ${hashes.size} hash skrip inline ditulis ke ${HEADERS_FILE}`);
