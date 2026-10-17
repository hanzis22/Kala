/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  // Di CI: anotasi GitHub + laporan HTML (diunggah sebagai artifact jika gagal).
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } }
    }
  ],
  webServer: {
    // Uji build produksi lewat server yang meniru Cloudflare Workers (URL bersih, 404.html,
    // header dari build/_headers). Service worker hanya aktif di build, bukan di dev.
    command: `pnpm build && node scripts/serve-build.mjs ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000
  }
});
