import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4321' },
  webServer: {
    // `astro preview` daemonises in this Astro version — the launching
    // process exits at once, which Playwright reads as "webServer exited
    // early", and a lingering daemon serves a stale dist/. Serve the fresh
    // build from a foreground process instead.
    command: 'npm run build && node scripts/serve-dist.mjs 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
