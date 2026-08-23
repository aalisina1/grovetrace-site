#!/usr/bin/env node
/**
 * Answers one question honestly: is the live site serving THIS commit's build?
 *
 * Written because "the deploy workflow went green" has now been wrong three
 * times on this project:
 *   1. Pages `build_type` was still `legacy`, so the artifact was ignored
 *      entirely while the workflow reported success.
 *   2. A failed legacy build silently cleared the custom-domain binding.
 *   3. A deployment of an OLDER commit landed minutes AFTER the correct one
 *      and reverted the site, well after the post-deploy check had passed.
 *
 * Astro emits content-hashed asset filenames, so comparing the set of
 * `/_astro/*` references in the live HTML against a local `dist/` build is a
 * byte-level equality check, not a guess.
 *
 * Usage:  npm run build && node scripts/verify-live.mjs [url]
 * Exits non-zero when the live site is stale.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SITE = process.argv[2] ?? 'https://grovetrace.com';
const PAGES = ['/', '/demo/', '/privacy/'];

const assetsIn = (html) =>
  [...new Set([...html.matchAll(/\/_astro\/[A-Za-z0-9._-]+\.(?:css|js)/g)].map((m) => m[0]))].sort();

let failed = false;
const note = (ok, msg) => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${msg}`);
  if (!ok) failed = true;
};

for (const path of PAGES) {
  const distFile = resolve(
    process.cwd(),
    'dist',
    path === '/' ? 'index.html' : `${path.replace(/^\/|\/$/g, '')}/index.html`,
  );
  if (!existsSync(distFile)) {
    note(false, `${path} missing from dist/ — run \`npm run build\` first`);
    continue;
  }

  const res = await fetch(SITE + path).catch((e) => ({ ok: false, status: e.message }));
  if (!res.ok) {
    note(false, `${path} -> HTTP ${res.status}`);
    continue;
  }
  const live = await res.text();
  const local = readFileSync(distFile, 'utf8');

  const wantAssets = assetsIn(local);
  const gotAssets = assetsIn(live);
  const same =
    wantAssets.length === gotAssets.length && wantAssets.every((a, i) => a === gotAssets[i]);

  note(same, `${path} assets ${same ? 'match' : 'DIFFER'}`);
  if (!same) {
    console.log(`         local: ${wantAssets.join(', ') || '(none)'}`);
    console.log(`         live : ${gotAssets.join(', ') || '(none)'}`);
  }

  // Every referenced asset must actually resolve. A stale HTML page pointing at
  // a deleted hash is exactly what a partial deploy looks like.
  for (const asset of gotAssets) {
    const r = await fetch(SITE + asset, { method: 'HEAD' }).catch(() => null);
    note(!!r && r.ok, `${asset} -> ${r ? r.status : 'unreachable'}`);
  }
}

console.log(
  failed
    ? '\nSTALE: the live site is not serving this build.'
    : '\nLive site matches this build.',
);
process.exit(failed ? 1 : 0);
