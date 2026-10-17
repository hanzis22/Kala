import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

/** Harus sama dengan `FALLBACK` di src/service-worker/index.ts. */
const FALLBACK = '404.html';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
      },
      // Semua route diprerender sebagai shell (ssr = false). Route yang tidak dikenal
      // dilayani Cloudflare Pages dengan 404.html, yang juga shell SPA.
      adapter: adapter({ fallback: FALLBACK }),
      // Kit 3 menghapus $lib (diganti #lib). Starter pack dan shadcn-svelte memakai $lib.
      alias: { $lib: 'src/lib' },
      // Didaftarkan sendiri oleh UpdateToast agar bisa menampilkan "Versi baru tersedia".
      serviceWorker: { register: false }
    })
  ],
  build: {
    // Font jangan diinline sebagai data: URI; CSP hanya mengizinkan font-src 'self'.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined)
  },
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Zona waktu tetap agar test tanggal lokal deterministik di mesin mana pun.
    env: { TZ: 'Asia/Jakarta' }
  }
});
