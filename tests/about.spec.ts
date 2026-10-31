import { en } from '../src/i18n/en';
import { ABOUT_HREF, homeHref, traceHref } from '../src/lib/router';
import { expect, seedProgress, test, WELCOMED } from './fixtures';

test.beforeEach(({ page }) => seedProgress(page, WELCOMED));

test('the (i) button on every page opens About, which credits everyone', async ({ page }) => {
  for (const start of ['./', `./${traceHref(5)}`]) {
    await page.goto(start);
    await page.getByRole('link', { name: en.nav.about }).click();
    await expect(page).toHaveURL(new RegExp(`${ABOUT_HREF}$`));
    await expect(page.getByRole('heading', { level: 1, name: en.about.title })).toBeVisible();
  }

  const credits = page.getByRole('region', { name: en.about.credits.heading });
  const { font, sounds, art, review } = en.about.credits;
  for (const credit of [font, sounds, art, review]) {
    await expect(credits.getByRole('term').filter({ hasText: credit.name })).toBeVisible();
    await expect(credits).toContainText(credit.text);
  }
  await expect(page.getByRole('region', { name: en.about.privacy.heading })).toBeVisible();

  // The name in Khmer shows in Kantumruy Pro once it loads.
  await expect(page.getByRole('main').locator('[lang="km"]')).toHaveText(en.appTitleKhmer);
  await expect(page.getByRole('main').locator('[lang="km"]')).toBeVisible();
});

test('the font licence is served from this site, and the source link opens a new tab', async ({ page, request }) => {
  await page.goto(`./${ABOUT_HREF}`);
  const licence = page.getByRole('link', { name: en.about.credits.font.link });
  const href = await licence.getAttribute('href');
  expect(href).toBe('./fonts/OFL.txt');
  const response = await request.get(new URL(href ?? '', page.url()).href);
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('SIL OPEN FONT LICENSE');

  // Not followed here: the guard fails any request to another origin.
  const source = page.getByRole('link', { name: en.about.source.link });
  await expect(source).toHaveAttribute('href', /^https:\/\/github\.com\//);
  await expect(source).toHaveAttribute('target', '_blank');
  await expect(source).toHaveAttribute('rel', 'noreferrer');
});

test('All letters goes back to the grid', async ({ page }) => {
  await page.goto(`./${ABOUT_HREF}`);
  await page.getByRole('link', { name: en.nav.allLetters }).click();
  await expect(page).toHaveURL(new RegExp(`${homeHref()}$`));
  await expect(page.getByRole('region', { name: en.grid.letters })).toBeVisible();
});
