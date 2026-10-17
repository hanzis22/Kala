// Server statis untuk build/ yang meniru Cloudflare Workers, dipakai test e2e:
// - URL bersih: /jadwal → jadwal.html, / → index.html; /jadwal.html → 307 ke /jadwal
//   (html_handling auto-trailing-slash di wrangler.jsonc)
// - URL yang tidak ada → 404.html dengan status 404
// - header dari build/_headers (pola path + wildcard *), termasuk CSP
// Tanpa dependensi. Pemakaian: node scripts/serve-build.mjs [port]
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ROOT = 'build';
const PORT = Number(process.argv[2] ?? 4173);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.txt': 'text/plain; charset=utf-8'
};

/** @returns {{ pattern: RegExp, headers: [string, string][] }[]} */
function parseHeaders() {
  const rules = [];
  for (const line of readFileSync(join(ROOT, '_headers'), 'utf8').split(/\r?\n/)) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const source = line
        .trim()
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      rules.push({ pattern: new RegExp(`^${source}$`), headers: [] });
    } else {
      const i = line.indexOf(':');
      let value = line.slice(i + 1).trim();
      // Server ini http://localhost; di Cloudflare semuanya https.
      value = value.replace(/;\s*upgrade-insecure-requests/, '');
      rules.at(-1)?.headers.push([line.slice(0, i).trim(), value]);
    }
  }
  return rules;
}

const rules = parseHeaders();

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function resolveFile(pathname) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^([/\\])+/, '');
  if (clean.startsWith('..')) return null;
  const candidates = clean === '' ? ['index.html'] : [clean, `${clean}.html`, join(clean, 'index.html')];
  return candidates.map((c) => join(ROOT, c)).find(isFile) ?? null;
}

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');

  // html_handling auto-trailing-slash: /x.html dan /x/index.html dialihkan (307) ke URL bersih.
  const cleanUrl = pathname.replace(/(^|\/)index\.html$/, '$1').replace(/\.html$/, '');
  if (cleanUrl !== pathname && isFile(join(ROOT, normalize(decodeURIComponent(pathname))))) {
    res.writeHead(307, { Location: cleanUrl || '/' });
    res.end();
    return;
  }

  // _headers dibaca Cloudflare, tidak disajikan.
  const file = pathname === '/_headers' ? null : resolveFile(pathname);
  const target = file ?? join(ROOT, '404.html');

  res.statusCode = file ? 200 : 404;
  res.setHeader('Content-Type', TYPES[extname(target)] ?? 'application/octet-stream');
  for (const rule of rules) {
    if (rule.pattern.test(pathname)) for (const [k, v] of rule.headers) res.setHeader(k, v);
  }
  res.end(readFileSync(target));
}).listen(PORT, () => console.log(`build/ tersaji di http://localhost:${PORT}`));
