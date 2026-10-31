// `npm run share`: writes public/share.png, the 1200 x 630 picture that shows
// when the site's link is shared (the og:image in index.html). It is drawn
// from the app's own shapes: the rumduol from src/lib/rumduol.ts with its
// heart and inner petals lit, the logo from src/lib/brand.ts, and the text in
// the self-hosted Kantumruy Pro. Playwright's Chromium turns it into a PNG.
// Run it again after changing the logo, the rumduol or the text, and commit
// what it writes.
import { readFileSync } from 'node:fs';
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
import { DUST, HEIGHT, LINKS, NUMBER_STARS, POINTS, WIDTH } from '../src/lib/rumduol.ts';
import { en } from '../src/i18n/en.ts';


// The Star path colours, as in src/index.css. The share image keeps them
// whatever theme the app shows, like the icons.
const COLORS = {
  page: '#16153a',
  fg: '#ffffff',
  muted: '#c9c6f5',
  faint: '#8d89c9',
  line: '#3b3880',
  star: '#ffd84d',
  mint: '#4fe3c1',
};

const SIZE = { width: 1200, height: 630 };
// The heart and the inner petals are lit (the numbers and the first 12
// consonants), and the first outer star is the next to light.
const LIT = NUMBER_STARS + 12;

const publicDir = new URL('../public/', import.meta.url);
const font = (file: string) => readFileSync(new URL(`fonts/${file}`, publicDir)).toString('base64');

function rumduol(): string {
  const lit = (i: number) => i < LIT;
  const dust = DUST.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.7" fill="${COLORS.faint}" fill-opacity="0.4"/>`);
  const links = LINKS.map(({ i, j, path }) => {
    const on = lit(i) && lit(j);
    const points = path.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    return `<polyline points="${points}" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="${on ? 1.2 : 0.8}" stroke="${on ? COLORS.star : COLORS.line}" stroke-opacity="${on ? 0.55 : 1}"/>`;
  });
  const stars = POINTS.map(([x, y], i) => {
    const color = lit(i) ? COLORS.star : i === LIT ? COLORS.mint : COLORS.faint;
    return `<circle cx="${x}" cy="${y}" r="${lit(i) || i === LIT ? 3 : 1.6}" fill="${color}"/>`;
  });
  return `<svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="640" height="480">${dust.join('')}${links.join('')}${stars.join('')}</svg>`;
}

function logo(): string {
  const [, , width, height] = WORDMARK_VIEWBOX.split(' ').map(Number);
  const mark =
    `<svg viewBox="0 0 100 100" width="112" height="112">` +
    `<path d="${MARK_GUIDE}" fill="none" stroke="${COLORS.fg}" stroke-opacity="0.45" stroke-width="5" stroke-linecap="round" stroke-dasharray="0 10"/>` +
    `<path d="${MARK_INK}" fill="none" stroke="${COLORS.mint}" stroke-width="9" stroke-linecap="round"/>` +
    `<circle cx="${MARK_TIP.cx}" cy="${MARK_TIP.cy}" r="${MARK_TIP.r}" fill="${COLORS.star}"/></svg>`;
  const scale = 72 / height;
  const wordmark =
    `<svg viewBox="${WORDMARK_VIEWBOX}" width="${Math.round(width * scale)}" height="72">` +
    `<path d="${WORDMARK_PATH}" fill="none" stroke="${COLORS.fg}" stroke-width="${WORDMARK_STROKE}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${WORDMARK_DOT.cx}" cy="${WORDMARK_DOT.cy}" r="${WORDMARK_DOT.r}" fill="${COLORS.star}"/></svg>`;
  return `<div class="logo">${mark}${wordmark}</div>`;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: "Kantumruy Pro"; font-weight: 100 700; src: url(data:font/woff2;base64,${font('kantumruy-pro-khmer.woff2')}) format("woff2"); unicode-range: U+1780-17FF, U+19E0-19FF, U+200C-200D, U+25CC; }
@font-face { font-family: "Kantumruy Pro"; font-weight: 100 700; src: url(data:font/woff2;base64,${font('kantumruy-pro-latin.woff2')}) format("woff2"); unicode-range: U+0000-00FF, U+2000-206F; }
html, body { margin: 0; }
body { width: ${SIZE.width}px; height: ${SIZE.height}px; background: ${COLORS.page}; color: ${COLORS.fg};
  font-family: "Kantumruy Pro"; display: flex; align-items: center; overflow: hidden; }
.sky { flex: none; margin-left: 24px; }
.text { display: flex; flex-direction: column; gap: 22px; padding-right: 64px; }
.logo { display: flex; align-items: flex-end; gap: 20px; }
.khmer { font-size: 44px; line-height: 1.2; color: ${COLORS.muted}; margin: 0; }
.intro { font-size: 46px; line-height: 1.15; font-weight: 700; text-wrap: balance; color: ${COLORS.star}; margin: 0; }
.tagline { font-size: 28px; color: ${COLORS.muted}; margin: 0; }
</style></head><body>
<div class="sky">${rumduol()}</div>
<div class="text">${logo()}
<p class="khmer" lang="km">${en.appTitleKhmer}</p>
<p class="intro">${en.home.intro}</p>
<p class="tagline">${en.tagline}</p></div>
</body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: SIZE });
  await page.setContent(html);
  await page.evaluate(async () => {
    await document.fonts.load('700 46px "Kantumruy Pro"', 'Aa');
    await document.fonts.load('44px "Kantumruy Pro"', 'អក្សរ');
    await document.fonts.ready;
  });
  await page.screenshot({ path: new URL('share.png', publicDir).pathname });
} finally {
  await browser.close();
}
console.log('Wrote share.png to public/');
