import { expect, test as base } from '@playwright/test';
import { CSP } from '../plugins/csp';
import { en } from '../src/i18n/en';

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

test('home page shows the title and ក in Kantumruy Pro', async ({ page }) => {
  const khmerFont = page.waitForResponse((response) => response.url().endsWith('/fonts/kantumruy-pro-khmer.woff2'));
  await page.goto('./');

  await expect(page.getByRole('heading', { name: en.appTitle })).toBeVisible();
  expect((await khmerFont).status()).toBe(200);

  // The letter stays invisible until the font has loaded.
  const letter = page.getByText('ក');
  await expect(letter).toBeVisible();
  expect(await letter.evaluate((el) => getComputedStyle(el).fontFamily)).toMatch(/^"?Kantumruy Pro"?,/);
  const loadedKhmerFaces = await page.evaluate(() =>
    [...document.fonts].filter((face) => face.status === 'loaded' && face.unicodeRange.includes('U+1780')).length,
  );
  expect(loadedKhmerFaces).toBe(1);
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
