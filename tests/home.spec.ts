import { expect, test as base } from '@playwright/test';
import { CSP } from '../plugins/csp';
import { letters } from '../src/data/letters';
import { en } from '../src/i18n/en';
import { traceHref } from '../src/lib/router';

// Every test fails on a CSP violation, a console error, an uncaught
// exception or a request to another origin.
const test = base.extend<{ siteGuard: void }>({
  siteGuard: [
    async ({ page, baseURL }, use) => {
      const origin = new URL(baseURL ?? '').origin;
      const problems: string[] = [];
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.protocol !== 'data:' && url.protocol !== 'blob:' && url.origin !== origin) {
          problems.push(`request to another origin: ${url.href}`);
        }
      });
      page.on('console', (message) => {
        if (message.type() === 'error' || /Content Security Policy/i.test(message.text())) {
          problems.push(`console ${message.type()}: ${message.text()}`);
        }
      });
      page.on('pageerror', (error) => problems.push(`uncaught: ${error.message}`));
      await page.addInitScript(() => {
        document.addEventListener('securitypolicyviolation', (event) => {
          console.error(`Content Security Policy violation: ${event.violatedDirective} ${event.blockedURI}`);
        });
      });
      await use();
      expect(problems).toEqual([]);
    },
    { auto: true },
  ],
});

test('home page shows the title and every letter in Kantumruy Pro', async ({ page }) => {
  const khmerFont = page.waitForResponse((response) => response.url().endsWith('/fonts/kantumruy-pro-khmer.woff2'));
  await page.goto('./');

  await expect(page.getByRole('heading', { name: en.appTitle })).toBeVisible();
  expect((await khmerFont).status()).toBe(200);

  // The letters stay invisible until the font has loaded.
  const khmer = page.getByRole('main').locator('[lang="km"]');
  await expect(khmer).toHaveCount(letters.length);
  for (const letter of await khmer.all()) await expect(letter).toBeVisible();
  expect(await khmer.first().evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Kantumruy Pro"?,/);
  const loadedKhmerFaces = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === 'loaded' && face.unicodeRange.includes('U+1780')).length,
  );
  expect(loadedKhmerFaces).toBe(1);
});

test('the grid shows the 33 letters in two series, in order', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('main').getByRole('link')).toHaveCount(33);
  await expect(page.getByRole('region')).toHaveCount(2);

  for (const series of [1, 2] as const) {
    const expected = letters.filter((letter) => letter.series === series);
    const tiles = page.getByRole('region', { name: en.grid.series[series] }).getByRole('link');
    await expect(tiles).toHaveCount(expected.length);
    for (const [i, letter] of expected.entries()) {
      const tile = tiles.nth(i);
      await expect(tile).toHaveAttribute('href', traceHref(letter.order));
      await expect(tile.locator('[lang="km"]')).toHaveText(letter.char);
      await expect(tile).toContainText(letter.name);
    }
  }
});

test('tiles are at least 64 px square on narrow phones, with no sideways scroll', async ({ page }) => {
  for (const width of [320, 375]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('./');
    const tiles = page.getByRole('main').getByRole('link');
    await expect(tiles).toHaveCount(letters.length);
    const sizes = await tiles.evaluateAll((els) =>
      els.map((el) => {
        const box = el.getBoundingClientRect();
        return Math.min(box.width, box.height);
      }),
    );
    expect(Math.min(...sizes), `smallest tile at ${width} px`).toBeGreaterThanOrEqual(64);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
  }
});

test('tapping a tile opens that letter on the trace page', async ({ page }) => {
  const secondSeries = letters.filter((letter) => letter.series === 2);
  for (const letter of [letters[0], secondSeries[secondSeries.length - 1]]) {
    await page.goto('./');
    await page.getByRole('main').locator(`a[href="${traceHref(letter.order)}"]`).tap();
    await expect(page.getByRole('heading', { name: en.trace.heading(letter.order) })).toBeVisible();
    expect(new URL(page.url()).hash).toBe(traceHref(letter.order));
  }
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
  await expect(page.getByRole('heading', { name: en.trace.heading(1) })).toBeVisible();

  await page.getByRole('link', { name: en.nav.allLetters }).click();
  await expect(page.getByRole('heading', { name: en.appTitle })).toBeVisible();
  expect(new URL(page.url()).hash).toBe('#/');
});
