/**
 * Service worker Kala (PRD §F9): precache seluruh app agar berjalan offline penuh
 * setelah kunjungan pertama, termasuk font self-host.
 *
 * - Cache diberi versi build; versi lama dihapus saat SW baru aktif.
 * - SW baru menunggu sampai user mengetuk "Muat ulang" (pesan SKIP_WAITING dari UpdateToast).
 * - Navigasi ke URL yang tidak diprerender jatuh ke 404.html (shell SPA, sama dengan
 *   fallback adapter-static), sehingga router klien menampilkan halaman galat app.
 */
import { self } from '$app/service-worker';
import { assets, immutable, prerendered } from '$app/manifest';
import { version } from '$app/env';

const CACHE = `kala-${version}`;
/** Harus sama dengan `FALLBACK` di vite.config.ts. */
const FALLBACK = '404.html';

/** Path dari manifest relatif ke base path; jadikan URL absolut di scope SW. */
const toUrl = (path: string) => new URL(path.replace(/^\//, ''), self.registration.scope).href;

const PRECACHE = [
  ...immutable.map((f) => f.path),
  // _headers dibaca Cloudflare, tidak disajikan. .woff cukup diwakili .woff2.
  ...assets.map((f) => f.path).filter((p) => !p.endsWith('_headers')),
  ...prerendered.map((f) => f.path),
  FALLBACK
]
  .filter((p) => !p.endsWith('.woff'))
  .map(toUrl);

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== CACHE) await caches.delete(key);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') void self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(url.href, { ignoreSearch: request.mode === 'navigate' });
      if (cached) return cached;

      try {
        return await fetch(request);
      } catch (err) {
        if (request.mode === 'navigate') {
          const fallback = await cache.match(toUrl(FALLBACK));
          if (fallback) return fallback;
        }
        throw err;
      }
    })()
  );
});
