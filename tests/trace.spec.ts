import type { Page } from '@playwright/test';
import { en } from '../src/i18n/en';
import { numberHref, traceHref } from '../src/lib/router';
import { expect, test } from './fixtures';

type Share = [x: number, y: number];

const canvas = (page: Page) => page.getByRole('img', { name: en.trace.canvas });
const hash = (page: Page) => new URL(page.url()).hash;
// The guide is drawn at 15% opacity, so anything stronger is ink.
const GUIDE_ALPHA_MAX = Math.ceil(255 * 0.15) + 1;

async function canvasPoint(page: Page, [x, y]: Share): Promise<[number, number]> {
  const box = await canvas(page).boundingBox();
  if (!box) throw new Error('canvas not on screen');
  return [box.x + x * box.width, box.y + y * box.height];
}

// Drags the mouse across the canvas, between points given as shares of its size.
async function drawLine(page: Page, from: Share, to: Share) {
  await page.mouse.move(...(await canvasPoint(page, from)));
  await page.mouse.down();
  await page.mouse.move(...(await canvasPoint(page, to)), { steps: 12 });
  await page.mouse.up();
}

// The canvas's alpha at a point (a share of its size), or its strongest alpha anywhere.
async function alpha(page: Page, at?: Share): Promise<number> {
  return canvas(page).evaluate((element, point) => {
    const el = element as HTMLCanvasElement;
    const ctx = el.getContext('2d');
    if (!ctx) return -1;
    if (point) return ctx.getImageData(Math.floor(point[0] * el.width), Math.floor(point[1] * el.height), 1, 1).data[3];
    const data = ctx.getImageData(0, 0, el.width, el.height).data;
    let max = 0;
    for (let i = 3; i < data.length; i += 4) max = Math.max(max, data[i]);
    return max;
  }, at);
}

// Opens a trace page and waits until the guide is drawn: by then the font has
// loaded and the canvas has been sized, so strokes count and pixels can be read.
// Then waits for the page's entrance to finish, so the canvas has stopped
// moving before anything is drawn on it.
async function openTrace(page: Page, href: string) {
  await page.goto(`./${href}`);
  await expect.poll(() => alpha(page)).toBeGreaterThan(0);
  await settle(page);
}

async function settle(page: Page) {
  await page.evaluate(() => Promise.allSettled(document.getAnimations().map((animation) => animation.finished)));
}

test('the trace page shows the character faintly on a sharp, square canvas that fits the screen', async ({ page }) => {
  await openTrace(page, traceHref(1));
  const info = await canvas(page).evaluate((element) => {
    const el = element as HTMLCanvasElement;
    const box = el.getBoundingClientRect();
    return {
      backing: [el.width, el.height],
      css: [box.width, box.height],
      dpr: window.devicePixelRatio,
      touchAction: getComputedStyle(el).touchAction,
      viewport: window.innerWidth,
    };
  });
  expect(info.touchAction).toBe('none');
  expect(info.css[0]).toBeCloseTo(info.css[1], 0);
  expect(info.css[0]).toBeLessThanOrEqual(info.viewport - 32);
  expect(info.backing[0]).toBe(Math.round(info.css[0] * info.dpr));
  expect(info.backing[1]).toBe(info.backing[0]);

  // The guide is faint.
  expect(await alpha(page)).toBeLessThanOrEqual(GUIDE_ALPHA_MAX);
});

test('drawing adds strokes, Undo removes the last one and Clear removes them all', async ({ page }) => {
  await openTrace(page, traceHref(1));
  const undo = page.getByRole('button', { name: en.trace.undo });
  const clear = page.getByRole('button', { name: en.trace.clear });
  await expect(undo).toBeDisabled();
  await expect(clear).toBeDisabled();
  await expect(page.getByRole('button', { name: en.trace.done })).toBeDisabled();

  await drawLine(page, [0.2, 0.2], [0.8, 0.2]);
  await drawLine(page, [0.3, 0.4], [0.3, 0.9]);
  await expect(canvas(page)).toHaveAttribute('data-strokes', '2');
  expect(await alpha(page, [0.5, 0.2])).toBe(255);
  expect(await alpha(page, [0.3, 0.65])).toBe(255);

  await undo.tap();
  await expect(canvas(page)).toHaveAttribute('data-strokes', '1');
  expect(await alpha(page, [0.3, 0.65])).toBeLessThanOrEqual(GUIDE_ALPHA_MAX);
  expect(await alpha(page, [0.5, 0.2])).toBe(255);

  await clear.tap();
  await expect(canvas(page)).toHaveAttribute('data-strokes', '0');
  expect(await alpha(page, [0.5, 0.2])).toBeLessThanOrEqual(GUIDE_ALPHA_MAX);
  await expect(undo).toBeDisabled();
});

// The longest run of pixels at least `min` opaque along a row of the canvas,
// in device pixels. The row and its ends are shares of the canvas.
async function runAcross(page: Page, y: number, from: number, to: number, min: number): Promise<number> {
  return canvas(page).evaluate(
    (element, [y, from, to, min]) => {
      const el = element as HTMLCanvasElement;
      const row = el.getContext('2d')?.getImageData(0, Math.floor(y * el.height), el.width, 1).data;
      if (!row) return -1;
      let best = 0;
      let run = 0;
      for (let x = Math.floor(from * el.width); x < to * el.width; x++) {
        run = row[x * 4 + 3] >= min ? run + 1 : 0;
        best = Math.max(best, run);
      }
      return best;
    },
    [y, from, to, min],
  );
}

test("the ink is as wide as the letter's own strokes", async ({ page }) => {
  await openTrace(page, traceHref(1));
  // ក's left leg, in the faint guide.
  const guide = await runAcross(page, 0.85, 0.15, 0.45, 19);
  // A line down the empty middle of ក, under its arch.
  await drawLine(page, [0.5, 0.55], [0.5, 0.95]);
  const ink = await runAcross(page, 0.75, 0.35, 0.65, 128);
  expect(guide).toBeGreaterThan(0);
  expect(Math.abs(ink - guide) / guide).toBeLessThan(0.1);
});

test('a finger drag on the canvas draws instead of scrolling the page', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Touch drags are sent through the Chrome DevTools Protocol');
  // Short enough that the page can scroll.
  await page.setViewportSize({ width: 412, height: 400 });
  await openTrace(page, traceHref(1));
  expect(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight)).toBe(true);

  const cdp = await page.context().newCDPSession(page);
  async function fingerDrag(from: [number, number], to: [number, number]) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from[0], y: from[1] }] });
    for (let step = 1; step <= 12; step++) {
      const x = from[0] + ((to[0] - from[0]) * step) / 12;
      const y = from[1] + ((to[1] - from[1]) * step) / 12;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  // An upward drag would scroll the page down, but on the canvas it draws.
  await fingerDrag(await canvasPoint(page, [0.5, 0.8]), await canvasPoint(page, [0.5, 0.2]));
  await expect(canvas(page)).toHaveAttribute('data-strokes', '1');
  expect(await page.evaluate(() => window.scrollY)).toBe(0);

  // The same drag on the heading does scroll, so the check above means something.
  const heading = await page.getByRole('heading').boundingBox();
  if (!heading) throw new Error('heading not on screen');
  const left = heading.x + 4;
  await fingerDrag([left, heading.y + heading.height], [left, heading.y - 40]);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test('the arrows step through the same set, and each character starts blank', async ({ page }) => {
  await openTrace(page, traceHref(1));
  await expect(page.getByRole('link', { name: en.trace.previous })).toHaveCount(0);
  await drawLine(page, [0.2, 0.2], [0.8, 0.2]);
  await expect(canvas(page)).toHaveAttribute('data-strokes', '1');
  await page.getByRole('link', { name: en.trace.next }).tap();
  await expect(page.getByRole('heading', { name: en.trace.letter(2) })).toBeVisible();
  expect(hash(page)).toBe(traceHref(2));
  await expect(canvas(page)).toHaveAttribute('data-strokes', '0');

  // Subscript skips ឡ (letter 32), which has no subscript.
  await openTrace(page, traceHref(31, 'subscript'));
  await page.getByRole('link', { name: en.trace.next }).tap();
  expect(hash(page)).toBe(traceHref(33, 'subscript'));
  await expect(page.getByRole('link', { name: en.trace.next })).toHaveCount(0);

  await openTrace(page, numberHref(9));
  await expect(page.getByRole('link', { name: en.trace.next })).toHaveCount(0);
  await expect(page.getByRole('link', { name: en.trace.previous })).toHaveAttribute('href', numberHref(8));
});

// Runs of guide pixels along a row or a column of the canvas, as [start, end]
// shares of its size. Read before any ink is drawn.
async function guideRuns(page: Page, along: 'row' | 'column', at: number): Promise<[number, number][]> {
  return canvas(page).evaluate(
    (element, [along, at]) => {
      const el = element as HTMLCanvasElement;
      const ctx = el.getContext('2d');
      if (!ctx) return [];
      const size = el.width;
      const line = Math.floor(Number(at) * size);
      const data = along === 'row' ? ctx.getImageData(0, line, size, 1).data : ctx.getImageData(line, 0, 1, size).data;
      const runs: [number, number][] = [];
      let start = -1;
      for (let i = 0; i <= size; i++) {
        const on = i < size && data[i * 4 + 3] >= 19;
        if (on && start < 0) start = i;
        if (!on && start >= 0) {
          runs.push([start / size, i / size]);
          start = -1;
        }
      }
      return runs;
    },
    [along, at] as const,
  );
}

const middle = ([start, end]: [number, number]) => (start + end) / 2;

// Traces ក along the middle of its strokes, worked out from the guide: the
// bar as one stroke, then up the left leg, over the arch and down the right.
async function traceKa(page: Page) {
  const [leftLeg, rightLeg] = await guideRuns(page, 'row', 0.8);
  const [bar, archTop] = await guideRuns(page, 'column', 0.5);
  const half = (bar[1] - bar[0]) / 2;
  const [barRow] = await guideRuns(page, 'row', middle(bar));
  const leftColumn = await guideRuns(page, 'column', middle(leftLeg));
  const bottom = leftColumn[leftColumn.length - 1][1] - half;
  const x0 = middle(leftLeg);
  const x1 = middle(rightLeg);
  const radius = (x1 - x0) / 2;
  const centre: Share = [(x0 + x1) / 2, middle(archTop) + radius];

  await drawPath(page, [
    [barRow[0] + half, middle(bar)],
    [barRow[1] - half, middle(bar)],
  ]);
  const arch = Array.from({ length: 17 }, (_, i): Share => {
    const angle = Math.PI - (Math.PI * i) / 16;
    return [centre[0] + radius * Math.cos(angle), centre[1] - radius * Math.sin(angle)];
  });
  await drawPath(page, [[x0, bottom], ...arch, [x1, bottom]]);
}

async function drawPath(page: Page, points: Share[]) {
  await page.mouse.move(...(await canvasPoint(page, points[0])));
  await page.mouse.down();
  for (const point of points.slice(1)) await page.mouse.move(...(await canvasPoint(page, point)), { steps: 4 });
  await page.mouse.up();
}

// How many opaque pixels of the canvas are nearer the theme's covered colour
// (green) than its missed colour (rose), and the other way round.
async function resultColours(page: Page): Promise<{ covered: number; missed: number }> {
  return canvas(page).evaluate((element) => {
    const el = element as HTMLCanvasElement;
    const data = el.getContext('2d')?.getImageData(0, 0, el.width, el.height).data ?? new Uint8ClampedArray();
    const style = getComputedStyle(document.documentElement);
    const rgb = (name: string) => {
      const value = Number.parseInt(style.getPropertyValue(name).trim().slice(1), 16);
      return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
    };
    const [coveredRgb, missedRgb] = [rgb('--covered'), rgb('--missed')];
    const distance = (i: number, to: number[]) => to.reduce((sum, c, k) => sum + (data[i + k] - c) ** 2, 0);
    let covered = 0;
    let missed = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      if (distance(i, coveredRgb) < distance(i, missedRgb)) covered++;
      else missed++;
    }
    return { covered, missed };
  });
}

async function scoreShown(page: Page): Promise<number> {
  return Number((await page.getByRole('status').textContent())?.match(/\d+/)?.[0]);
}

test('a careful trace of ក scores 3 stars and shows the letter in green', async ({ page }) => {
  await openTrace(page, traceHref(1));
  await traceKa(page);
  await page.getByRole('button', { name: en.trace.done }).tap();

  await expect(page.getByRole('status')).toBeVisible();
  const score = await scoreShown(page);
  expect(score).toBeGreaterThanOrEqual(88);
  await expect(page.getByRole('img', { name: en.score.stars(3) })).toBeVisible();
  const colours = await resultColours(page);
  expect(colours.covered).toBeGreaterThan(colours.missed * 10);
});

// Lines back and forth across the whole canvas, `spacing` apart (a share of its size).
function zigzag(spacing: number): Share[] {
  const points: Share[] = [];
  for (let y = 0.05, i = 0; y <= 0.95 + 1e-9; y += spacing, i++) points.push([i % 2 ? 0.95 : 0.05, y]);
  return points;
}

test('a scribble scores under 40 with no stars, and Try again starts over', async ({ page }) => {
  await openTrace(page, traceHref(1));
  // Lines about one and a half ink widths apart, over the whole box.
  await drawPath(page, zigzag(0.14));
  await page.getByRole('button', { name: en.trace.done }).tap();

  expect(await scoreShown(page)).toBeLessThan(40);
  await expect(page.getByRole('img', { name: en.score.stars(0) })).toBeVisible();
  // No drawing while the result is up.
  await drawLine(page, [0.2, 0.5], [0.8, 0.5]);
  await expect(canvas(page)).toHaveAttribute('data-strokes', '1');

  await page.getByRole('button', { name: en.score.tryAgain }).tap();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(canvas(page)).toHaveAttribute('data-strokes', '0');
  await expect(page.getByRole('button', { name: en.trace.done })).toBeDisabled();
});

test('colouring in the whole box earns no star', async ({ page }) => {
  await openTrace(page, traceHref(1));
  // Lines closer together than the ink is wide.
  await drawPath(page, zigzag(0.08));
  await page.getByRole('button', { name: en.trace.done }).tap();

  expect(await scoreShown(page)).toBeLessThan(60);
  await expect(page.getByRole('img', { name: en.score.stars(0) })).toBeVisible();
});

test('half a letter earns no star and shows the missed part in rose', async ({ page }) => {
  await openTrace(page, traceHref(1));
  const [bar] = await guideRuns(page, 'column', 0.5);
  const [barRow] = await guideRuns(page, 'row', middle(bar));
  await drawPath(page, [
    [barRow[0], middle(bar)],
    [barRow[1], middle(bar)],
  ]);
  await page.getByRole('button', { name: en.trace.done }).tap();

  expect(await scoreShown(page)).toBeLessThan(60);
  await expect(page.getByRole('img', { name: en.score.stars(0) })).toBeVisible();
  const colours = await resultColours(page);
  expect(colours.missed).toBeGreaterThan(colours.covered);
  expect(colours.covered).toBeGreaterThan(0);
});

// The guide's ink box on the canvas, as shares of its size.
async function guideBox(page: Page): Promise<{ width: number; height: number }> {
  return canvas(page).evaluate((element) => {
    const el = element as HTMLCanvasElement;
    const data = el.getContext('2d')?.getImageData(0, 0, el.width, el.height).data ?? new Uint8ClampedArray();
    let [minX, minY, maxX, maxY] = [el.width, el.height, -1, -1];
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 19) continue;
      const x = ((i - 3) / 4) % el.width;
      const y = Math.floor((i - 3) / 4 / el.width);
      [minX, minY, maxX, maxY] = [Math.min(minX, x), Math.min(minY, y), Math.max(maxX, x), Math.max(maxY, y)];
    }
    return { width: (maxX - minX + 1) / el.width, height: (maxY - minY + 1) / el.height };
  });
}

test('a subscript is drawn on its own, as big as a letter', async ({ page }) => {
  // ្ក sits under its letter, ្រ is written before it, and ្ស beside it.
  for (const order of [1, 27, 30]) {
    await openTrace(page, traceHref(order, 'subscript'));
    const box = await guideBox(page);
    expect(Math.max(box.width, box.height), `letter ${order}`).toBeGreaterThan(0.75);
    expect(Math.max(box.width, box.height), `letter ${order}`).toBeLessThan(0.85);
  }
});

// The number on screen, which counts up. Screen readers get the score from the
// status's hidden text instead.
const countedScore = (page: Page) => page.getByRole('status').locator('p[aria-hidden="true"]');

test('the score counts up to the final score and lights all three stars', async ({ page }) => {
  await openTrace(page, traceHref(1));
  await traceKa(page);
  await page.getByRole('button', { name: en.trace.done }).tap();

  const score = await scoreShown(page);
  await expect(countedScore(page)).toHaveText(String(score));
  // Every star is lit once the count is over.
  await expect(page.getByRole('img', { name: en.score.stars(3) }).locator('svg.fill-star')).toHaveCount(3);
});

test('with reduced motion nothing animates, and the score shows at once', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: en.appTitle })).toBeVisible();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);

  await openTrace(page, traceHref(1));
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await traceKa(page);
  await page.getByRole('button', { name: en.trace.done }).tap();
  const score = await scoreShown(page);
  expect(await countedScore(page).textContent()).toBe(String(score));
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
});
