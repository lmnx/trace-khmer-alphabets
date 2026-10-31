import { describe, expect, it } from 'vitest';
import { letters } from '../src/data/letters';
import { numerals } from '../src/data/numerals';
import type { Form } from '../src/lib/forms';
import { EMPTY_PROGRESS, withResult, type Progress } from '../src/lib/progress';
import type { TraceTarget } from '../src/lib/router';
import { CONSONANT_STARS, NUMBER_STARS, POINTS } from '../src/lib/rumduol';
import type { Stars } from '../src/lib/scoring';
import {
  earnedTiers,
  hasTier,
  isSkyLit,
  isStarLit,
  litCount,
  nextStar,
  resultStory,
  SKY,
  starIndex,
  starOf,
  TIER_GOALS,
} from '../src/lib/sky';

const letter = (order: number, form: Form = 'letter'): TraceTarget => ({ kind: 'letter', order, form });
const number = (digit: number): TraceTarget => ({ kind: 'number', digit });

function light(progress: Progress, targets: readonly TraceTarget[], stars: Stars = 2): Progress {
  return targets.reduce((sum, target) => withResult(sum, target, 80, stars), progress);
}

const everyNumber = Array.from({ length: 10 }, (_, digit) => number(digit));
const everyConsonant = (form: Form = 'letter') => Array.from({ length: 33 }, (_, i) => letter(i + 1, form));

describe('the sky', () => {
  it('has a star for each of the 10 numbers and 33 consonants, numbers first', () => {
    expect(SKY).toHaveLength(43);
    expect(SKY[0]).toEqual({ kind: 'number', digit: 0 });
    expect(SKY[10]).toEqual({ kind: 'consonant', order: 1 });
    expect(SKY[42]).toEqual({ kind: 'consonant', order: 33 });
    expect(litCount(EMPTY_PROGRESS)).toBe(0);
  });

  it("gives both of a consonant's forms the same star", () => {
    expect(starOf(letter(5))).toEqual(starOf(letter(5, 'both')));
    expect(starIndex(starOf(letter(5, 'both')))).toBe(14);
    expect(starIndex(starOf(number(3)))).toBe(3);
  });

  it("lights a consonant's star from either form", () => {
    const viaBase = light(EMPTY_PROGRESS, [letter(5)]);
    const viaFull = light(EMPTY_PROGRESS, [letter(5, 'both')]);
    for (const progress of [viaBase, viaFull]) {
      expect(isStarLit(progress, starOf(letter(5)))).toBe(true);
      expect(litCount(progress)).toBe(1);
    }
    // Both forms lit still makes one star.
    expect(litCount(light(viaBase, [letter(5, 'both')]))).toBe(1);
    // A result with no star lights nothing.
    expect(litCount(withResult(EMPTY_PROGRESS, letter(5, 'both'), 50, 0))).toBe(0);
  });

  it('suggests the first dark star, as its number or base consonant, and nothing once the sky is lit', () => {
    expect(nextStar(EMPTY_PROGRESS)).toEqual(number(0));
    let progress = light(EMPTY_PROGRESS, everyNumber);
    expect(nextStar(progress)).toEqual(letter(1));
    // ក lit through its full form counts, so the suggestion moves on.
    progress = light(progress, [letter(1, 'both')]);
    expect(nextStar(progress)).toEqual(letter(2));
    progress = light(progress, everyConsonant('both'));
    expect(nextStar(progress)).toBeNull();
    expect(isSkyLit(progress)).toBe(true);
  });
});

describe('badges', () => {
  it('starts with none', () => {
    expect(earnedTiers(EMPTY_PROGRESS)).toEqual([]);
  });

  it('gives the seed for all 10 numbers, and not for 9', () => {
    expect(hasTier(light(EMPTY_PROGRESS, everyNumber.slice(0, 9)), 'seed')).toBe(false);
    expect(earnedTiers(light(EMPTY_PROGRESS, everyNumber))).toEqual(['seed']);
  });

  it('needs exactly 10, 22, 43 and 43 characters', () => {
    expect(TIER_GOALS).toEqual({ seed: 10, bud: 22, bloom: 43, apsara: 43 });
  });

  it('gives the bud for any 22 of the 43 characters', () => {
    expect(hasTier(light(EMPTY_PROGRESS, everyConsonant().slice(0, 21)), 'bud')).toBe(false);
    expect(earnedTiers(light(EMPTY_PROGRESS, everyConsonant('both').slice(0, 22)))).toEqual(['bud']);
  });

  it('gives the rumduol in bloom for the whole sky, and the apsara only once every star has three stars', () => {
    const lit = light(EMPTY_PROGRESS, [...everyNumber, ...everyConsonant()], 2);
    expect(earnedTiers(lit)).toEqual(['seed', 'bud', 'bloom']);
    // Three stars on either form of a consonant counts.
    const almost = light(light(lit, everyNumber, 3), everyConsonant('both').slice(0, 32), 3);
    expect(hasTier(almost, 'apsara')).toBe(false);
    expect(earnedTiers(light(almost, [letter(33)], 3))).toEqual(['seed', 'bud', 'bloom', 'apsara']);
  });
});

describe('resultStory', () => {
  const play = (before: Progress, target: TraceTarget, score: number, stars: Stars) =>
    resultStory(before, withResult(before, target, score, stars), target);

  it("tells of a character's first star", () => {
    expect(play(EMPTY_PROGRESS, letter(9, 'both'), 70, 1)).toEqual({
      previous: null,
      newBest: false,
      wasLit: false,
      litNow: true,
      skyLit: false,
      newTiers: [],
      star: 18,
    });
  });

  it("doesn't light a star twice when the other form gets one too", () => {
    const before = light(EMPTY_PROGRESS, [letter(9)]);
    expect(play(before, letter(9, 'both'), 90, 3)).toMatchObject({ previous: null, wasLit: true, litNow: false });
  });

  it('lights nothing for a first try with no star', () => {
    expect(play(EMPTY_PROGRESS, number(0), 30, 0)).toMatchObject({ litNow: false, newBest: false, wasLit: false });
  });

  it('celebrates a new best only when it beats the old one in the same form', () => {
    const before = withResult(EMPTY_PROGRESS, number(0), 70, 1);
    expect(play(before, number(0), 90, 3)).toMatchObject({ newBest: true, litNow: false, previous: { score: 70, stars: 1 } });
    expect(play(before, number(0), 70, 1)).toMatchObject({ newBest: false });
    expect(play(before, number(0), 20, 0)).toMatchObject({ newBest: false, litNow: false });
    // Beating a starless best is a new best too.
    const starless = withResult(EMPTY_PROGRESS, number(0), 30, 0);
    expect(play(starless, number(0), 40, 0)).toMatchObject({ newBest: true, litNow: false });
  });

  it('tells which badges a result earns', () => {
    const before = light(EMPTY_PROGRESS, everyNumber.slice(1));
    expect(play(before, number(0), 80, 2)).toMatchObject({ litNow: true, newTiers: ['seed'], star: 0 });
  });

  it('tells when a result lights the last star in the sky, from either form', () => {
    const before = light(EMPTY_PROGRESS, [...everyNumber, ...everyConsonant().filter((target) => target.kind === 'letter' && target.order !== 16)]);
    expect(play(before, letter(16, 'both'), 75, 2)).toMatchObject({ litNow: true, skyLit: true, newTiers: ['bloom'] });
    // Improving a star once the sky is lit doesn't light it again.
    const after = withResult(before, letter(16, 'both'), 75, 2);
    expect(play(after, letter(16, 'both'), 95, 3)).toMatchObject({ newBest: true, skyLit: false });
  });
});

describe('the rumduol', () => {
  it('has a star for every number and consonant, in the sky’s order', () => {
    expect(NUMBER_STARS).toBe(numerals.length);
    expect(CONSONANT_STARS).toBe(letters.length);
    expect(POINTS).toHaveLength(SKY.length);
  });
});
