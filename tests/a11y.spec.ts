import type { Page } from '@playwright/test';
import { en } from '../src/i18n/en';
import { ABOUT_HREF, homeHref, numberHref, traceHref } from '../src/lib/router';
import { drawLine, openTrace } from './draw';
import { expect, seedProgress, test, WELCOMED } from './fixtures';

const hash = (page: Page) => new URL(page.url()).hash;

// Every link, button and switch on the page has a name a screen reader can say.
async function expectAllNamed(page: Page) {
  const controls = page.locator('a, button, [role="switch"]');
  expect(await controls.count()).toBeGreaterThan(0);
  for (const control of await controls.all()) await expect(control).toHaveAccessibleName(/\S/);
}

test.beforeEach(({ page }) => seedProgress(page, WELCOMED));

test('every link and button has an accessible name, on every page', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('link', { name: en.nav.about })).toBeVisible();
  await expectAllNamed(page);

  await page.goto(`./${homeHref('both')}`);
  await expectAllNamed(page);

  await openTrace(page, traceHref(1));
  await expectAllNamed(page);
  await drawLine(page, [0.2, 0.2], [0.8, 0.2]);
  await page.getByRole('button', { name: en.trace.done }).click();
  await expect(page.getByRole('button', { name: en.score.tryAgain })).toBeVisible();
  await expectAllNamed(page);

  await page.goto(`./${ABOUT_HREF}`);
  await expect(page.getByRole('heading', { level: 1, name: en.about.title })).toBeVisible();
  await expectAllNamed(page);
});

test('each page names the browser tab', async ({ page }) => {
  await page.goto('./');
  await expect(page).toHaveTitle(en.pageTitle.home);
  await page.goto(`./${numberHref(3)}`);
  await expect(page).toHaveTitle(en.pageTitle.page(en.trace.number(3)));
  await page.goto(`./${traceHref(2, 'both')}`);
  await expect(page).toHaveTitle(en.pageTitle.page(en.trace.both(2)));
  await page.goto(`./${ABOUT_HREF}`);
  await expect(page).toHaveTitle(en.pageTitle.page(en.about.title));
});

test('the grid works with a keyboard, and each new page starts at its heading', async ({ page, browserName }) => {
  // Safari moves Tab between form controls only, unless the reader turns on
  // "Press Tab to highlight each item".
  test.skip(browserName === 'webkit', 'Safari skips links on Tab by default');
  await page.goto('./');
  const tile = page.getByRole('region', { name: en.grid.letters }).locator(`a[href="${traceHref(1)}"]`);
  await expect(tile.locator('[lang="km"]')).toBeVisible();

  // Tab reaches the first consonant's tile, with the focus ring showing.
  let focused = '';
  for (let presses = 0; presses < 40 && focused !== traceHref(1); presses++) {
    await page.keyboard.press('Tab');
    focused = await page.evaluate(() => document.activeElement?.getAttribute('href') ?? '');
  }
  await expect(tile).toBeFocused();
  expect(await tile.evaluate((el) => getComputedStyle(el).outlineStyle)).not.toBe('none');

  // Enter opens it, and focus lands on its heading.
  await page.keyboard.press('Enter');
  await expect.poll(() => hash(page)).toBe(traceHref(1));
  await expect(page.getByRole('heading', { level: 1, name: en.trace.letter(1) })).toBeFocused();

  // Tab goes on to the Next arrow.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: en.trace.next })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect.poll(() => hash(page)).toBe(traceHref(2));
  await expect(page.getByRole('heading', { level: 1, name: en.trace.letter(2) })).toBeFocused();

  // All letters leads back to the grid.
  await page.getByRole('link', { name: en.nav.allLetters }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(() => hash(page)).toBe(homeHref());
  await expect(page.getByRole('heading', { level: 1, name: en.appTitle })).toBeFocused();

  // The switch flips with Space, and stays on the same page.
  const formSwitch = page.getByRole('switch', { name: en.grid.switchLabel });
  await formSwitch.focus();
  await page.keyboard.press('Space');
  await expect(formSwitch).toBeChecked();
  await expect.poll(() => hash(page)).toBe(homeHref('both'));
});

test('the suggested tile tells screen readers it is the next star', async ({ page }) => {
  await page.goto('./');
  const next = page.locator('a[data-next]');
  await expect(next).toHaveCount(1);
  await expect(next).toHaveAccessibleName(new RegExp(`${en.sky.next}$`));
});
