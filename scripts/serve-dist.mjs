/**
 * Minimal foreground static server for `dist/`, used by Playwright's webServer.
 *
 * `astro preview` daemonises in this version — the launching process exits
 * immediately — which Playwright reads as "webServer exited early", and a
 * lingering daemon happily serves a stale build. This stays in the foreground
 * and serves exactly the bytes just built.
 *
 * Mirrors `trailingSlash: 'always'` + `build.format: 'directory'`: a request
 * for a directory resolves to its index.html.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'dist');
const PORT = Number(process.argv[2] ?? 4321);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

async function resolveFile(urlPath) {
  // normalize() collapses any ../ before it can escape ROOT.
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '');
  let candidate = join(ROOT, rel);
  if (!candidate.startsWith(ROOT)) return null;
  try {
    const s = await stat(candidate);
    if (s.isDirectory()) candidate = join(candidate, 'index.html');
  } catch {
    return null;
  }
  try {
    await stat(candidate);
    return candidate;
  } catch {
    return null;
  }
}

createServer(async (req, res) => {
  const path = (req.url ?? '/').split('?')[0];
  const file = await resolveFile(path);
  if (!file) {
    const notFound = await resolveFile('/404.html');
    if (notFound) {
      res.writeHead(404, { 'content-type': TYPES['.html'] });
      res.end(await readFile(notFound));
      return;
    }
    res.writeHead(404, { 'content-type': TYPES['.html'] });
    res.end('<h1>404</h1>');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(PORT, () => {
  console.log(`serving dist/ on http://localhost:${PORT}`);
});
