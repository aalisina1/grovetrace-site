// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://grovetrace.com',
  // No `base` — apex custom domain. Setting it breaks every internal link.
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [sitemap()],
});
