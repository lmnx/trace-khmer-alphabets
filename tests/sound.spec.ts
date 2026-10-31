import type { Page } from '@playwright/test';
import { en } from '../src/i18n/en';
import { traceHref, type TraceTarget } from '../src/lib/router';
import { drawLine, openTrace, settle, traceKa } from './draw';
import { expect, seedProgress, skyLitBut, test, WELCOMED } from './fixtures';

// Sound: nothing before the first tap, then a tick per stroke, a chime per
// star and a fanfare for a badge, all silenced by the mute button, which
// lasts across a reload. The page's AudioContext is wrapped so the tests can
// see its state and count the notes it starts; the sounds still play.
test.describe.configure({ timeout: 60_000 });

const ka: TraceTarget = { kind: 'letter', order: 1, form: 'letter' };
const mute = (page: Page) => page.getByRole('button', { name: en.sound.mute });

interface Heard {
  contexts: number;
  state: string | null;
  notes: number;
  triangles: number;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const spy = { contexts: [] as AudioContext[], oscillators: [] as OscillatorNode[] };
    Object.assign(window, { soundSpy: spy });
    const Real = window.AudioContext;
    window.AudioContext = class extends Real {
      constructor(options?: AudioContextOptions) {
        super(options);
        spy.contexts.push(this);
      }
      createOscillator() {
        const oscillator = super.createOscillator();
        spy.oscillators.push(oscillator);
        return oscillator;
      }
    };
  });
});

function heard(page: Page): Promise<Heard> {
  return page.evaluate(() => {
    const spy = (window as unknown as { soundSpy: { contexts: AudioContext[]; oscillators: OscillatorNode[] } }).soundSpy;
    return {
      contexts: spy.contexts.length,
      state: spy.contexts[0]?.state ?? null,
      notes: spy.oscillators.length,
      triangles: spy.oscillators.filter((oscillator) => oscillator.type === 'triangle').length,
    };
  });
}

test('the audio wakes on the first tap, and each stroke ticks', async ({ page }) => {
  await seedProgress(page, WELCOMED);
  await page.goto('./');
  await expect.poll(() => heard(page)).toMatchObject({ contexts: 0, notes: 0 });

  // A tap on a tile opens the trace page and wakes the audio.
  await page.getByRole('link', { name: 'ក' }).first().tap();
  await expect.poll(async () => (await heard(page)).state).toBe('running');
  expect((await heard(page)).contexts).toBe(1);

  await openTrace(page, traceHref(1));
  await drawLine(page, [0.2, 0.2], [0.8, 0.8]);
  await expect.poll(async () => (await heard(page)).state).toBe('running');
  await drawLine(page, [0.2, 0.8], [0.8, 0.2]);
  expect((await heard(page)).notes).toBe(2);
});

test('a three-star result chimes once per star', async ({ page }) => {
  await openTrace(page, traceHref(1));
  await traceKa(page);
  const before = (await heard(page)).notes;
  await page.getByRole('button', { name: en.trace.done }).tap();
  await expect(page.getByRole('status').getByRole('img', { name: en.score.stars(3) })).toBeVisible();
  await settle(page);
  // Each chime is a bell of three notes. No badge, so no fanfare.
  await expect.poll(async () => (await heard(page)).notes - before).toBe(9);
  expect((await heard(page)).triangles).toBe(0);
});

test('a new badge plays a fanfare', async ({ page }) => {
  await seedProgress(page, skyLitBut(ka));
  await openTrace(page, traceHref(1));
  await traceKa(page);
  await page.getByRole('button', { name: en.trace.done }).tap();
  await expect(page.getByText(en.score.badgeEarned(en.badges.tiers.bloom.name))).toBeVisible();
  await expect.poll(async () => (await heard(page)).triangles).toBeGreaterThan(0);
});

test('mute silences every sound and lasts across a reload', async ({ page }) => {
  await seedProgress(page, WELCOMED);
  await page.goto('./');
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'false');
  await mute(page).tap();
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'true');

  await page.reload();
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'true');

  await openTrace(page, traceHref(1));
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'true');
  await traceKa(page);
  await page.getByRole('button', { name: en.trace.done }).tap();
  await expect(page.getByRole('status')).toBeVisible();
  await settle(page);
  expect((await heard(page)).notes).toBe(0);

  // Sound back on: a tick says so, and that lasts too.
  await mute(page).tap();
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(async () => (await heard(page)).notes).toBe(1);
  await page.reload();
  await expect(mute(page)).toHaveAttribute('aria-pressed', 'false');
});
