// Renders public/img/og-default.png (1200x630) from an inline SVG template.
//
// Why this exists: there is no local raster/SVG tool on this machine
// (no ImageMagick, no rsvg-convert, no Inkscape; macOS `sips` cannot
// rasterize SVG). @resvg/resvg-js is a pure-JS-callable Rust SVG renderer
// that works headlessly and needs no system deps.
//
// CRITICAL GOTCHA: resvg silently renders ZERO glyphs from .woff2 — it
// accepts the file without throwing and produces an image byte-identical
// to the bare background. It only shapes text correctly from TTF/OTF.
// So this script pulls TTFs from Google's font *source* repo (not the
// fonts.googleapis.com/fonts.gstatic.com CDN — those are the ones the
// project's no-Google-Fonts-CDN rule forbids a *visitor's browser* from
// hitting at runtime) into a gitignored .cache/fonts/ directory, uses
// them ONCE here at build-authoring time to bake this PNG, and ships
// only the PNG. Do NOT commit the TTFs, do NOT move them into public/,
// and do NOT "fix" this by pointing at public/fonts/*.woff2 — that
// silently regresses to a textless card with no error.
//
// Fonts (download once, gitignored):
//   curl -sL -o .cache/fonts/Fraunces.ttf "https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/Fraunces%5BSOFT%2CWONK%2Copsz%2Cwght%5D.ttf"
//   curl -sL -o .cache/fonts/DMSans.ttf   "https://raw.githubusercontent.com/google/fonts/main/ofl/dmsans/DMSans%5Bopsz%2Cwght%5D.ttf"
//
// Run: node scripts/make-og.mjs

import { Resvg } from '@resvg/resvg-js';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const FRAUNCES = resolve(ROOT, '.cache/fonts/Fraunces.ttf');
const DM_SANS = resolve(ROOT, '.cache/fonts/DMSans.ttf');
const OUT = resolve(ROOT, 'public/img/og-default.png');

for (const f of [FRAUNCES, DM_SANS]) {
  if (!existsSync(f)) {
    console.error(`Missing font: ${f}\nSee the download commands in this script's header comment.`);
    process.exit(1);
  }
}

const WIDTH = 1200;
const HEIGHT = 630;

// The Parcel Canopy mark (see public/img/grovetrace-mark.svg), recolored
// to the on-dark brand green #34D399 and scaled/positioned into the card.
const MARK = `
  <g transform="translate(90, 70) scale(2.1)">
    <polygon points="50,9 82,29 71,63 29,61 18,27" fill="none" stroke="#34D399" stroke-width="8" stroke-linejoin="round"/>
    <circle cx="50" cy="9" r="7.5" fill="#34D399"/>
    <circle cx="82" cy="29" r="7.5" fill="#34D399"/>
    <circle cx="71" cy="63" r="7.5" fill="#34D399"/>
    <circle cx="29" cy="61" r="7.5" fill="#34D399"/>
    <circle cx="18" cy="27" r="7.5" fill="#34D399"/>
    <rect x="45.75" y="63" width="8.5" height="28" rx="4" fill="#34D399"/>
  </g>
`;

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="#0B1D1C" />
  ${MARK}
  <text x="90" y="430" font-family="Fraunces" font-size="88" font-weight="600" fill="#FFFFFF">Grovetrace</text>
  <text x="90" y="480" font-family="DM Sans" font-size="32" font-weight="400" fill="#8FB3AC">EUDR compliance software: plot data in, accepted DDS out</text>
</svg>
`;

const resvg = new Resvg(svg, {
  font: {
    fontFiles: [FRAUNCES, DM_SANS],
    loadSystemFonts: false,
    defaultFontFamily: 'Fraunces',
  },
});

const png = resvg.render().asPng();
writeFileSync(OUT, png);
console.log(`Wrote ${OUT} (${png.length} bytes)`);
