import type { Page } from '@playwright/test';
import { CSP } from '../plugins/csp';
import { letters } from '../src/data/letters';
import { numerals } from '../src/data/numerals';
import { en } from '../src/i18n/en';
import { glyph } from '../src/lib/forms';
import { homeHref, numberHref, traceHref } from '../src/lib/router';
import { expect, seedProgress, test, WELCOMED } from './fixtures';

const section = (page: Page, heading: string) => page.getByRole('region', { name: heading });
const hash = (page: Page) => new URL(page.url()).hash;

// A returning learner, so the home page shows the sky and the grid, not the opening.
test.beforeEach(({ page }) => seedProgress(page, WELCOMED));

const formSwitch = (page: Page) => page.getByRole('switch', { name: en.grid.switchLabel });

test('home page shows the title, numbers and letters in Kantumruy Pro', async ({ page }) => {
  const khmerFont = page.waitForResponse((response) => response.url().endsWith('/fonts/kantumruy-pro-khmer.woff2'));
  await page.goto('./');

  await expect(page.getByRole('heading', { name: en.appTitle })).toBeVisible();
  expect((await khmerFont).status()).toBe(200);

  // The tiles' Khmer text stays invisible until the font has loaded.
  const khmer = page.getByRole('main').locator('ul [lang="km"]');
  await expect(khmer).toHaveCount(numerals.length + letters.length);
  for (const text of await khmer.all()) await expect(text).toBeVisible();
  expect(await khmer.first().evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Kantumruy Pro"?,/);
  const loadedKhmerFaces = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === 'loaded' && face.unicodeRange.includes('U+1780')).length,
  );
  expect(loadedKhmerFaces).toBe(1);
});

test('the grid shows ០ to ៩, then all 33 letters in one block, in order, all open', async ({ page }) => {
  await page.goto('./');
  // The night sky, the badges, the numbers and the consonants.
  await expect(page.getByRole('region')).toHaveCount(4);

  const numberTiles = section(page, en.grid.numbers).getByRole('link');
  await expect(numberTiles).toHaveCount(10);
  for (const [i, numeral] of numerals.entries()) {
    const tile = numberTiles.nth(i);
    await expect(tile).toHaveAttribute('href', numberHref(numeral.digit));
    await expect(tile.locator('[lang="km"]')).toHaveText(numeral.char);
    await expect(tile).toContainText(String(numeral.digit));
  }

  const letterTiles = section(page, en.grid.letters).getByRole('link');
  await expect(letterTiles).toHaveCount(33);
  for (const [i, letter] of letters.entries()) {
    const tile = letterTiles.nth(i);
    await expect(tile).toHaveAttribute('href', traceHref(letter.order));
    await expect(tile.locator('[lang="km"]')).toHaveText(letter.char);
    await expect(tile).toContainText(letter.name);
  }
});

test('the switch shows each consonant with its subscript, with ឡ alone', async ({ page }) => {
  await page.goto('./');
  await expect(formSwitch(page)).toHaveAttribute('aria-checked', 'false');
  await expect(formSwitch(page)).toContainText(en.grid.forms.letter);
  await expect(formSwitch(page)).toContainText(en.grid.forms.both);
  const historyLength = await page.evaluate(() => history.length);
  const items = section(page, en.grid.letters).getByRole('listitem');

  // Tapping the side that's off picks it.
  await formSwitch(page).locator('[data-side="both"]').tap();
  await expect(formSwitch(page)).toHaveAttribute('aria-checked', 'true');
  expect(hash(page)).toBe(homeHref('both'));
  await expect(section(page, en.grid.letters).getByRole('link')).toHaveCount(33);
  for (const [i, letter] of letters.entries()) {
    const item = items.nth(i);
    await expect(item.getByRole('link')).toHaveAttribute('href', traceHref(letter.order, 'both'));
    await expect(item.locator('[lang="km"]')).toHaveText(glyph(letter, 'both'));
  }
  await expect(items.nth(31).locator('[lang="km"]')).toHaveText('ឡ');
  // The numbers don't change with the toggle.
  await expect(section(page, en.grid.numbers).getByRole('link')).toHaveCount(10);

  // Tapping the side that's on keeps it; the switch flips it back.
  await formSwitch(page).locator('[data-side="both"]').tap();
  expect(hash(page)).toBe(homeHref('both'));
  await formSwitch(page).press('Enter');
  await expect(formSwitch(page)).toHaveAttribute('aria-checked', 'false');
  expect(hash(page)).toBe(homeHref('letter'));
  // Switching forms replaces the history entry instead of adding one per tap.
  expect(await page.evaluate(() => history.length)).toBe(historyLength);
});

test('tiles, buttons and the toggle are big enough to tap on narrow phones, with no sideways scroll', async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('./');
    const tiles = page.getByRole('main').locator('ul li > a');
    await expect(tiles).toHaveCount(numerals.length + letters.length);
    const sizes = await tiles.evaluateAll((els) =>
      els.map((el) => {
        const box = el.getBoundingClientRect();
        return Math.min(box.width, box.height);
      }),
    );
    expect(Math.min(...sizes), `smallest tile at ${width} px`).toBeGreaterThanOrEqual(64);
    // To the nearest 0.01 px: while the page slides in, a box's edges can sit
    // between pixels and its height come out a hair under.
    const targets = page.getByRole('main').locator('a, button');
    const heights = await targets.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height * 100) / 100));
    expect(Math.min(...heights), `shortest tap target at ${width} px`).toBeGreaterThanOrEqual(48);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test('tapping a tile opens it on the trace page, and the back link keeps the form', async ({ page }) => {
  await page.goto('./');
  await page.locator(`ul a[href="${numberHref(0)}"]`).tap();
  await expect(page.getByRole('heading', { name: en.trace.number(0) })).toBeVisible();
  expect(hash(page)).toBe(numberHref(0));

  await page.goto('./');
  const last = letters[letters.length - 1];
  await page.locator(`ul a[href="${traceHref(last.order)}"]`).tap();
  await expect(page.getByRole('heading', { name: en.trace.letter(last.order) })).toBeVisible();

  await page.goto(`./${homeHref('both')}`);
  await page.locator(`ul a[href="${traceHref(1, 'both')}"]`).tap();
  await expect(page.getByRole('heading', { name: en.trace.both(1) })).toBeVisible();
  await page.getByRole('link', { name: en.nav.allLetters }).tap();
  expect(hash(page)).toBe(homeHref('both'));
  await expect(formSwitch(page)).toHaveAttribute('aria-checked', 'true');

  // ឡ has no subscript, so in Both it opens as the letter alone.
  const la = letters.find((letter) => !letter.subscript);
  if (!la) throw new Error('expected a letter with no subscript');
  await page.locator(`ul a[href="${traceHref(la.order, 'both')}"]`).tap();
  await expect(page.getByRole('heading', { name: en.trace.letter(la.order) })).toBeVisible();
  await page.getByRole('link', { name: en.nav.allLetters }).tap();
  expect(hash(page)).toBe(homeHref('both'));
});

test('the build carries the CSP and referrer meta tags before any script', async ({ page }) => {
  await page.goto('./');
  await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveAttribute('content', CSP);
  await expect(page.locator('meta[name="referrer"]')).toHaveAttribute('content', 'no-referrer');

  const cspComesFirst = await page.evaluate(() => {
    const head = [...document.head.children];
    const csp = head.findIndex((el) => el.getAttribute('http-equiv') === 'Content-Security-Policy');
    const firstResource = head.findIndex((el) => el.matches('script, link[rel="stylesheet"], link[rel="modulepreload"]'));
    return csp !== -1 && csp < firstResource;
  });
  expect(cspComesFirst).toBe(true);
});

test('hash routes open a letter and come back home', async ({ page }) => {
  await page.goto('./#/trace/1');
  await expect(page.getByRole('heading', { name: en.trace.letter(1) })).toBeVisible();

  await page.getByRole('link', { name: en.nav.allLetters }).click();
  await expect(page.getByRole('heading', { name: en.appTitle })).toBeVisible();
  expect(hash(page)).toBe('#/');
});

test('the icons and the manifest come from the site itself, under its sub-path', async ({ page, request, baseURL }) => {
  await page.goto('./');
  const hrefs = await page
    .locator('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="manifest"]')
    .evaluateAll((links) => links.map((link) => (link as HTMLLinkElement).href));
  expect(hrefs).toHaveLength(4);
  for (const href of hrefs) {
    expect(href.startsWith(baseURL ?? '-'), href).toBe(true);
    expect((await request.get(href)).status(), href).toBe(200);
  }

  const manifestUrl = hrefs.find((href) => href.endsWith('.webmanifest')) ?? '';
  const manifest = (await (await request.get(manifestUrl)).json()) as { short_name: string; icons: { src: string }[] };
  expect(manifest.short_name).toBe(en.appTitle);
  for (const icon of manifest.icons) {
    const url = new URL(icon.src, manifestUrl).href;
    expect(url.startsWith(baseURL ?? '-'), url).toBe(true);
    expect((await request.get(url)).status(), url).toBe(200);
  }
});
