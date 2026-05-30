// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://weknowthewhy.com',
  output: 'static',
  // /scan is unlinked for v1 (free-scan funnel paused) — keep the page on disk
  // but exclude it from the sitemap so it isn't discoverable.
  integrations: [svelte(), sitemap({ filter: (page) => !page.endsWith('/scan') })],
  vite: {
    plugins: [tailwindcss()],
  },
  trailingSlash: 'never',
});
