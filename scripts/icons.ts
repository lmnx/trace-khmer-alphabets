// `npm run icons`: writes the brand's static files into public/ from the
// shapes in src/lib/brand.ts. The SVGs are written directly. The PNGs (the
// apple-touch-icon, the manifest's icons and a 32 px favicon) are drawn from
// the SVGs by Playwright's Chromium, which the e2e tests install anyway.
// Run it again after changing the logo, and commit what it writes.
import { writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import {
  MARK_GUIDE,
  MARK_INK,
  MARK_TIP,
  WORDMARK_DOT,
  WORDMARK_PATH,
  WORDMARK_STROKE,
  WORDMARK_VIEWBOX,
} from '../src/lib/brand.ts';

// The icons keep the Star path colours whatever theme the app shows.
const COLORS = { page: '#16153a', guide: '#ffffff', ink: '#4fe3c1', tip: '#ffd84d', text: '#ffffff' };

const publicDir = new URL('../public/', import.meta.url);

// The mark on a 100 x 100 grid. Small icons get a solid, faint guide and
// thicker ink, since dots blur together at 16 to 32 px.
function mark(small = false): string {
  const guide = small
    ? `<path d="${MARK_GUIDE}" fill="none" stroke="${COLORS.guide}" stroke-opacity="0.3" stroke-width="9" stroke-linecap="round"/>`
    : `<path d="${MARK_GUIDE}" fill="none" stroke="${COLORS.guide}" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 10"/>`;
  const ink = `<path d="${MARK_INK}" fill="none" stroke="${COLORS.ink}" stroke-width="${small ? 11 : 9}" stroke-linecap="round"/>`;
  const tip = `<circle cx="${MARK_TIP.cx}" cy="${MARK_TIP.cy}" r="${small ? 9 : MARK_TIP.r}" fill="${COLORS.tip}"/>`;
  return guide + ink + tip;
}

// Square corners for icons the platform rounds itself (iOS, maskable icons).
function icon({ rounded = true, small = false } = {}): string {
  return (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><title>Aksor</title>' +
    `<rect width="100" height="100" rx="${rounded ? 24 : 0}" fill="${COLORS.page}"/>${mark(small)}</svg>\n`
  );
}

function wordmark(): string {
  return (
    `<path d="${WORDMARK_PATH}" fill="none" stroke="${COLORS.text}" stroke-width="${WORDMARK_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${WORDMARK_DOT.cx}" cy="${WORDMARK_DOT.cy}" r="${WORDMARK_DOT.r}" fill="${COLORS.tip}"/>`
  );
}

// The icon's mark and the wordmark side by side on a midnight card, so the
// white letters show on any background. The wordmark sits on the mark's
// baseline (the foot of the arch).
function logo(): string {
  const [, , width] = WORDMARK_VIEWBOX.split(' ').map(Number);
  const scale = 1.2;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(124 + width * scale + 28)} 140"><title>Aksor</title>` +
    `<rect width="100%" height="100%" rx="32" fill="${COLORS.page}"/>` +
    `<g transform="translate(16 20)">${mark()}</g>` +
    `<g transform="translate(124 ${+(99 - 56 * scale).toFixed(2)}) scale(${scale})">${wordmark()}</g></svg>\n`
  );
}

const svgs: Record<string, string> = {
  'icon.svg': icon(),
  'favicon.svg': icon({ small: true }),
  'logo.svg': logo(),
};
const pngs: [file: string, svg: string, size: number][] = [
  ['favicon-32.png', icon({ small: true }), 32],
  ['apple-touch-icon.png', icon({ rounded: false }), 180],
  ['icon-192.png', icon(), 192],
  ['icon-512.png', icon(), 512],
  // The mark already sits inside the middle 80% that maskable icons keep.
  ['icon-maskable-512.png', icon({ rounded: false }), 512],
];

for (const [file, svg] of Object.entries(svgs)) writeFileSync(new URL(file, publicDir), svg);

const browser = await chromium.launch();
try {
  for (const [file, svg, size] of pngs) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(
      `<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" style="display:block" `)}</body>`,
    );
    await page.screenshot({ path: new URL(file, publicDir).pathname, omitBackground: true });
    await page.close();
  }
} finally {
  await browser.close();
}
console.log(`Wrote ${[...Object.keys(svgs), ...pngs.map(([file]) => file)].join(', ')} to public/`);
