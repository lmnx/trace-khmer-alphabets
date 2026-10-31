import { describe, expect, it } from 'vitest';
import type { Form } from '../src/lib/forms';
import { EMPTY_PROGRESS, withResult, type Progress } from '../src/lib/progress';
import type { TraceTarget } from '../src/lib/router';
import type { Stars } from '../src/lib/scoring';
import { isLit, isSkyLit, litCount, nextStar, resultStory, SKY } from '../src/lib/sky';
import { targetKey } from '../src/lib/targets';

const letter = (order: number, form: Form = 'letter'): TraceTarget => ({ kind: 'letter', order, form });
const number = (digit: number): TraceTarget => ({ kind: 'number', digit });

function light(progress: Progress, targets: readonly TraceTarget[], stars: Stars = 2): Progress {
  return targets.reduce((sum, target) => withResult(sum, target, 80, stars), progress);
}

describe('the sky', () => {
  it('has one star for each of the 76 characters, numbers first, then letters, then full forms', () => {
    expect(SKY).toHaveLength(76);
    expect(new Set(SKY.map(targetKey)).size).toBe(76);
    expect(SKY[0]).toEqual(number(0));
    expect(SKY[10]).toEqual(letter(1));
    expect(SKY[43]).toEqual(letter(1, 'both'));
    expect(SKY[75]).toEqual(letter(33, 'both'));
    expect(litCount(EMPTY_PROGRESS)).toBe(0);
  });

  it('lights a star for each character with at least one star, in any order', () => {
    let progress = light(EMPTY_PROGRESS, [letter(20, 'both'), number(7)]);
    progress = withResult(progress, letter(5), 50, 0);
    expect(isLit(progress, letter(20, 'both'))).toBe(true);
    expect(isLit(progress, letter(5))).toBe(false);
    expect(litCount(progress)).toBe(2);
  });

  it('suggests the first character with no star yet, and nothing once the sky is lit', () => {
    expect(nextStar(EMPTY_PROGRESS)).toEqual(number(0));
    let progress = light(EMPTY_PROGRESS, SKY.slice(0, 12));
    expect(nextStar(progress)).toEqual(letter(3));
    // Out of order is fine: the suggestion skips what is already lit.
    progress = light(EMPTY_PROGRESS, [number(0), number(2)]);
    expect(nextStar(progress)).toEqual(number(1));
    progress = light(EMPTY_PROGRESS, SKY);
    expect(nextStar(progress)).toBeNull();
    expect(isSkyLit(progress)).toBe(true);
  });
});

describe('resultStory', () => {
  const play = (before: Progress, target: TraceTarget, score: number, stars: Stars) =>
    resultStory(before, withResult(before, target, score, stars), target);

  it("tells of a character's first star", () => {
    expect(play(EMPTY_PROGRESS, letter(9, 'both'), 70, 1)).toEqual({
      previous: null,
      newBest: false,
      litNow: true,
      skyLit: false,
    });
  });

  it('lights nothing for a first try with no star', () => {
    expect(play(EMPTY_PROGRESS, number(0), 30, 0)).toMatchObject({ litNow: false, newBest: false });
  });

  it('celebrates a new best only when it beats the old one', () => {
    const before = withResult(EMPTY_PROGRESS, number(0), 70, 1);
    expect(play(before, number(0), 90, 3)).toMatchObject({ newBest: true, litNow: false, previous: { score: 70, stars: 1 } });
    expect(play(before, number(0), 70, 1)).toMatchObject({ newBest: false });
    expect(play(before, number(0), 20, 0)).toMatchObject({ newBest: false, litNow: false });
    // Beating a starless best is a new best too.
    const starless = withResult(EMPTY_PROGRESS, number(0), 30, 0);
    expect(play(starless, number(0), 40, 0)).toMatchObject({ newBest: true, litNow: false });
  });

  it('tells when a result lights the last star in the sky, wherever it is', () => {
    const last = letter(16, 'both');
    const before = light(EMPTY_PROGRESS, SKY.filter((target) => targetKey(target) !== targetKey(last)));
    expect(play(before, last, 75, 2)).toMatchObject({ litNow: true, skyLit: true });
    // Improving a star once the sky is lit doesn't light it again.
    const after = withResult(before, last, 75, 2);
    expect(play(after, last, 95, 3)).toMatchObject({ newBest: true, skyLit: false });
  });
});
