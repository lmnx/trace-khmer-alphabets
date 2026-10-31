import { expect, test as base, type Page } from '@playwright/test';
import { serializeProgress, STORAGE_KEY, type Progress } from '../src/lib/progress';

// Every test fails on a CSP violation, a console error, an uncaught
// exception or a request to another origin.
export const test = base.extend<{ siteGuard: void }>({
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

export { expect };

// Progress from an earlier visit, saved before the app loads. Only when nothing
// is saved yet, so a reload keeps whatever the app has saved since.
export async function seedProgress(page: Page, progress: Progress) {
  await page.addInitScript(
    ([key, value]) => {
      if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, value);
    },
    [STORAGE_KEY, serializeProgress(progress)] as const,
  );
}

// A returning learner who has seen the opening, with no stars yet.
export const WELCOMED: Progress = { welcomed: true, best: {} };
