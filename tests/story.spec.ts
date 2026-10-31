import type { Page } from '@playwright/test';
import { letters } from '../src/data/letters';
import { numerals } from '../src/data/numerals';
import { en } from '../src/i18n/en';
import { STORAGE_KEY, withResult, type Progress } from '../src/lib/progress';
import { homeHref, numberHref, traceHref, type TraceTarget } from '../src/lib/router';
import type { Stars } from '../src/lib/scoring';
import type { Tier } from '../src/lib/sky';
import { targetKey } from '../src/lib/targets';
import { drawLine, drawPath, guideShown, openTrace, settle, traceKa, zigzag } from './draw';
import { expect, seedProgress, test, WELCOMED } from './fixtures';

// The night sky story: the opening, saved progress, the sky's one
// constellation, the celebrations, and what happens when storage is blocked.
// Most of these trace ក more than once, so they get three times the timeout.
test.describe.configure({ timeout: 90_000 });

const ka: TraceTarget = { kind: 'letter', order: 1, form: 'letter' };
const hash = (page: Page) => new URL(page.url()).hash;
const section = (page: Page, heading: string) => page.getByRole('region', { name: heading });
const sky = (page: Page) => section(page, en.sky.heading);
const letterItem = (page: Page, order: number) => section(page, en.grid.letters).getByRole('listitem').nth(order - 1);
const result = (page: Page) => page.getByRole('status');

// Every star in the sky lit, except `left`'s: every number, and every
// consonant in its base form, each with `stars`.
function skyLitBut(left: TraceTarget, stars: Stars = 2): Progress {
  const all: TraceTarget[] = [
    ...numerals.map((numeral): TraceTarget => ({ kind: 'number', digit: numeral.digit })),
    ...letters.map((letter): TraceTarget => ({ kind: 'letter', order: letter.order, form: 'letter' })),
  ];
  const others = all.filter((target) => targetKey(target) !== targetKey(left));
  return others.reduce((progress, target) => withResult(progress, target, 90, stars), WELCOMED);
}

const badges = (page: Page) => section(page, en.badges.heading);
const tier = (page: Page, name: Tier) => badges(page).locator(`[data-tier="${name}"]`);

// How many animations an element is running, polled, since they start once
// the score has counted up.
const animating = (page: Page, selector: string) =>
  expect.poll(() => page.locator(selector).first().evaluate((el) => el.getAnimations().length), { timeout: 5000 });

async function done(page: Page) {
  await page.getByRole('button', { name: en.trace.done }).tap();
  await expect(result(page)).toBeVisible();
}

test('a first visit opens with the story, and its button goes to the first star', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { name: en.opening.title })).toBeVisible();
  for (const line of en.opening.lines) await expect(page.getByText(line)).toBeVisible();
  // Nothing else until the learner starts.
  await expect(section(page, en.grid.letters)).toHaveCount(0);

  await page.getByRole('link', { name: en.opening.start }).tap();
  expect(hash(page)).toBe(numberHref(0));
  await page.getByRole('link', { name: en.nav.allLetters }).tap();
  await expect(sky(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: en.opening.title })).toHaveCount(0);

  // Seen once, so not again after a reload.
  await page.reload();
  await expect(sky(page)).toBeVisible();
  await expect(page.getByRole('heading', { name: en.opening.title })).toHaveCount(0);
});

test('every character is open from the start, and the sky is one rumduol of 43 stars', async ({ page }) => {
  await seedProgress(page, WELCOMED);
  await page.goto('./');
  await expect(section(page, en.grid.numbers).getByRole('link')).toHaveCount(numerals.length);
  await expect(section(page, en.grid.letters).getByRole('link')).toHaveCount(letters.length);
  await expect(sky(page).locator('svg')).toHaveCount(1);
  await expect(sky(page).locator('circle[data-star]')).toHaveCount(43);
  await expect(sky(page)).toContainText(en.sky.lit(0, 43));
  // No names for the parts of the sky.
  for (const name of ['Numbers', 'Letters', 'Both']) await expect(sky(page)).not.toContainText(name);
  await expect(sky(page).getByRole('link', { name: en.sky.next })).toHaveAttribute('href', numberHref(0));
  await expect(badges(page)).toContainText(en.badges.earned(0, 4));
  await expect(badges(page).locator('[data-earned]')).toHaveCount(0);

  // The flower fills from the middle out: the numbers cluster at the heart,
  // the first consonants on the inner petals, the rest on the outer ones.
  const reach = await sky(page)
    .locator('circle[data-star]')
    .evaluateAll((circles) => {
      const points = circles.map((c) => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))]);
      const [cx, cy] = points.slice(0, 10).reduce(([x, y], [px, py]) => [x + px / 10, y + py / 10], [0, 0]);
      const from = (part: number[][]) => part.map(([x, y]) => Math.hypot(x - cx, y - cy));
      return { numbers: Math.max(...from(points.slice(0, 10))), inner: from(points.slice(10, 22)), outer: from(points.slice(22)) };
    });
  expect(reach.numbers).toBeLessThan(20);
  expect(Math.min(...reach.inner)).toBeGreaterThan(reach.numbers);
  expect(Math.max(...reach.outer)).toBeGreaterThan(Math.max(...reach.inner));

  await page.goto(`./${homeHref('both')}`);
  await expect(section(page, en.grid.letters).getByRole('link')).toHaveCount(33);
});

test('a star lights the sky with a burst, pops in at home, and survives a reload', async ({ page }) => {
  await seedProgress(page, WELCOMED);

  // A scribble on ក earns no star, so the sky stays dark.
  await openTrace(page, traceHref(1));
  await drawPath(page, zigzag(0.14));
  await done(page);
  await expect(result(page)).toContainText(en.score.sky.dark);
  await expect(page.getByText(en.score.joins)).toHaveCount(0);

  // A careful trace lights ក's star, though ០ to ៩ have none. Three stars send
  // sparks flying, and the new star pops into the rumduol on the card.
  await page.getByRole('button', { name: en.score.tryAgain }).tap();
  await settle(page);
  await traceKa(page);
  await done(page);
  await expect(result(page)).toContainText(en.score.sky.lit);
  await expect(page.locator('[data-spark]')).toHaveCount(12);
  await animating(page, '[data-spark]').toBeGreaterThan(0);
  await expect(page.getByText(en.score.joins)).toBeVisible();
  await expect(page.locator('a', { hasText: en.score.next })).toHaveAttribute('href', traceHref(2));

  // Back home, ក's star and its tile's stars pop in.
  await page.getByRole('link', { name: en.nav.allLetters }).tap();
  await animating(page, 'section svg circle[data-index="10"]').toBeGreaterThan(0);
  await animating(page, `ul a[href="${traceHref(1)}"] [data-earned]`).toBeGreaterThan(0);

  await page.reload();
  await expect(sky(page)).toContainText(en.sky.lit(1, 43));
  await expect(sky(page).locator('circle[data-lit]')).toHaveCount(1);
  await expect(letterItem(page, 1).getByRole('img', { name: en.score.stars(3) })).toBeVisible();
  // The sky still suggests ០, the first character with no star.
  await expect(sky(page).getByRole('link', { name: en.sky.next })).toHaveAttribute('href', numberHref(0));
  await openTrace(page, traceHref(1));
  await expect(page.getByText(/^Best \d+$/)).toBeVisible();
});

test("a consonant's full form lights the same star as its base form", async ({ page }) => {
  await seedProgress(page, withResult(WELCOMED, { kind: 'letter', order: 1, form: 'both' }, 90, 3));
  await page.goto('./');
  await expect(sky(page)).toContainText(en.sky.lit(1, 43));
  await expect(sky(page).locator('circle[data-lit]')).toHaveCount(1);
  // ក is lit through ក្ក, so the base form's tile stays empty but the sky moves on.
  await expect(letterItem(page, 1).getByRole('img')).toHaveCount(0);
  await page.goto(`./${homeHref('both')}`);
  await expect(letterItem(page, 1).getByRole('img', { name: en.score.stars(3) })).toBeVisible();

  // Tracing ក itself now adds no new star.
  await openTrace(page, traceHref(1));
  await traceKa(page);
  await done(page);
  await expect(result(page)).toContainText(en.score.sky.brighter);
  await page.getByRole('link', { name: en.nav.allLetters }).tap();
  await expect(sky(page)).toContainText(en.sky.lit(1, 43));
});

test('beating your best is celebrated', async ({ page }) => {
  await seedProgress(page, withResult(WELCOMED, ka, 70, 1));
  await openTrace(page, traceHref(1));
  await expect(page.getByText(en.trace.best(70))).toBeVisible();
  await traceKa(page);
  await done(page);
  await expect(result(page).getByText(en.score.newBest)).toBeVisible();
  await expect(result(page)).toContainText(en.score.sky.brighter);

  // A worse try is no new best, and the best stays.
  await page.getByRole('button', { name: en.score.tryAgain }).tap();
  await drawLine(page, [0.2, 0.5], [0.8, 0.5]);
  await done(page);
  await expect(result(page).getByText(en.score.newBest)).toHaveCount(0);
  await expect(result(page)).toContainText('Your best is');
});

test('lighting the last star brings in the whole rumduol and its badge', async ({ page }) => {
  await seedProgress(page, skyLitBut(ka));
  await page.goto('./');
  await expect(sky(page)).toContainText(en.sky.lit(42, 43));
  // The seed for the numbers, the bud for half the sky.
  await expect(badges(page)).toContainText(en.badges.earned(2, 4));
  await expect(tier(page, 'bud')).toHaveAttribute('data-earned', '');
  await expect(tier(page, 'bloom')).not.toHaveAttribute('data-earned');

  await openTrace(page, traceHref(1));
  await traceKa(page);
  await done(page);
  await expect(result(page)).toContainText(en.score.sky.skyLit);
  await expect(page.getByText(en.score.badgeEarned(en.badges.tiers.bloom.name))).toBeVisible();
  // The rumduol's stars pop in, then all 43 are lit.
  await settle(page);
  await expect(page.locator('circle[data-lit]')).toHaveCount(43);

  await page.goto('./');
  await expect(page.getByText(en.sky.allLit)).toBeVisible();
  await expect(badges(page)).toContainText(en.badges.earned(3, 4));
  await expect(tier(page, 'bloom')).toHaveAttribute('data-earned', '');
  await expect(tier(page, 'apsara')).not.toHaveAttribute('data-earned');
});

test('three stars on every star earns the apsara, with nothing moving under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedProgress(page, skyLitBut(ka, 3));
  await openTrace(page, traceHref(1));
  await traceKa(page);
  await done(page);
  // The bloom and the apsara come together; the card shows the top one.
  await expect(page.getByText(en.score.badgeEarned(en.badges.tiers.apsara.name))).toBeVisible();
  // Sparks for the score and for the badge, all still under reduced motion.
  await expect(page.locator('[data-spark]')).toHaveCount(24);
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);

  await page.goto('./');
  await expect(badges(page)).toContainText(en.badges.earned(4, 4));
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});

test('the app works with storage blocked, and forgets on reload', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
  });
  await page.goto('./');
  await page.getByRole('link', { name: en.opening.start }).tap();
  // Moving round by taps keeps the page, and the progress in memory.
  await page.getByRole('link', { name: en.nav.allLetters }).tap();
  await page.locator(`a[href="${traceHref(1)}"]`).tap();
  await guideShown(page);
  await traceKa(page);
  await done(page);
  await expect(result(page)).toContainText(en.score.sky.lit);

  await page.getByRole('link', { name: en.nav.allLetters }).tap();
  await expect(sky(page)).toContainText(en.sky.lit(1, 43));
  await page.reload();
  await expect(page.getByRole('heading', { name: en.opening.title })).toBeVisible();
});

test('the app works when saving fails or the saved progress is corrupt', async ({ page }) => {
  await page.addInitScript((key) => {
    if (window.localStorage.getItem(key) === null) window.localStorage.setItem(key, '{"v":1,"best":{"letter/1":');
    Storage.prototype.setItem = () => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    };
  }, STORAGE_KEY);
  await page.goto('./');
  await expect(page.getByRole('heading', { name: en.opening.title })).toBeVisible();
  await openTrace(page, traceHref(1));
  await traceKa(page);
  await done(page);
  await expect(result(page)).toContainText(en.score.sky.lit);
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY)).toBe('{"v":1,"best":{"letter/1":');
});

test('progress saved in another tab shows up here', async ({ page, context }) => {
  await seedProgress(page, WELCOMED);
  await page.goto('./');
  await expect(sky(page)).toContainText(en.sky.lit(0, 43));

  const other = await context.newPage();
  await other.goto('./');
  await other.evaluate(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify({ v: 1, welcomed: true, best: { 'letter/1': { score: 90, stars: 3 } } })] as const,
  );
  await expect(sky(page)).toContainText(en.sky.lit(1, 43));
});
