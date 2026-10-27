import { expect, it } from 'vitest';

// Penjaga: zona proses test harus zona yang diminta (vite.config.ts `test.env.TZ`). Hanya valid
// untuk nama kanonik IANA; alias seperti Asia/Calcutta dibaca sebagai Asia/Kolkata.
it(`zona waktu proses = process.env.TZ (${process.env.TZ})`, () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(process.env.TZ);
});
