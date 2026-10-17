// App sepenuhnya di klien (data ada di IndexedDB). Setiap route diprerender sebagai shell
// HTML kosong agar deep link langsung jalan di Cloudflare Pages dan di-precache service worker.
export const ssr = false;
export const prerender = true;
