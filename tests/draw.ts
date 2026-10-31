import type { Page } from '@playwright/test';
import { en } from '../src/i18n/en';
import { expect } from './fixtures';

// Drawing on the trace page's canvas and reading it back, shared by the e2e tests.

export type Share = [x: number, y: number];

export const canvas = (page: Page) => page.getByRole('img', { name: en.trace.canvas });
// The guide is drawn at 15% opacity, so anything stronger is ink.
export const GUIDE_ALPHA_MAX = Math.ceil(255 * 0.15) + 1;

export async function canvasPoint(page: Page, [x, y]: Share): Promise<[number, number]> {
  const box = await canvas(page).boundingBox();
  if (!box) throw new Error('canvas not on screen');
  return [box.x + x * box.width, box.y + y * box.height];
}

// Drags the mouse across the canvas, between points given as shares of its size.
export async function drawLine(page: Page, from: Share, to: Share) {
  await page.mouse.move(...(await canvasPoint(page, from)));
  await page.mouse.down();
  await page.mouse.move(...(await canvasPoint(page, to)), { steps: 12 });
  await page.mouse.up();
}

// The canvas's alpha at a point (a share of its size), or its strongest alpha anywhere.
export async function alpha(page: Page, at?: Share): Promise<number> {
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
export async function openTrace(page: Page, href: string) {
  await page.goto(`./${href}`);
  await guideShown(page);
}

export async function guideShown(page: Page) {
  await expect.poll(() => alpha(page)).toBeGreaterThan(0);
  await settle(page);
}

export async function settle(page: Page) {
  await page.evaluate(() => Promise.allSettled(document.getAnimations().map((animation) => animation.finished)));
}

// Runs of guide pixels along a row or a column of the canvas, as [start, end]
// shares of its size. Read before any ink is drawn.
export async function guideRuns(page: Page, along: 'row' | 'column', at: number): Promise<[number, number][]> {
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

export const middle = ([start, end]: [number, number]) => (start + end) / 2;

// Traces ក along the middle of its strokes, worked out from the guide: the
// bar as one stroke, then up the left leg, over the arch and down the right.
export async function traceKa(page: Page) {
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

export async function drawPath(page: Page, points: Share[]) {
  await page.mouse.move(...(await canvasPoint(page, points[0])));
  await page.mouse.down();
  for (const point of points.slice(1)) await page.mouse.move(...(await canvasPoint(page, point)), { steps: 4 });
  await page.mouse.up();
}

export async function scoreShown(page: Page): Promise<number> {
  return Number((await page.getByRole('status').textContent())?.match(/\d+/)?.[0]);
}

// Lines back and forth across the whole canvas, `spacing` apart (a share of its size).
export function zigzag(spacing: number): Share[] {
  const points: Share[] = [];
  for (let y = 0.05, i = 0; y <= 0.95 + 1e-9; y += spacing, i++) points.push([i % 2 ? 0.95 : 0.05, y]);
  return points;
}
