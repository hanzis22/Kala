import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Dijalankan manual lewat `pnpm icons`; PNG hasilnya di-commit ke static/.
const background = '#A3461F';

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, resizeOptions: { background } },
    apple: { ...minimal2023Preset.apple, resizeOptions: { background } }
  },
  images: ['static/icon.svg']
});
