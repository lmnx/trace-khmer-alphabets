import { letters } from '../data/letters';
import { numerals } from '../data/numerals';
import type { Best, Progress } from './progress';
import type { TraceTarget } from './router';
import type { Stars } from './scoring';
import { targetKey } from './targets';

// The night sky story, as pure functions over saved progress. The sky has a
// star for each number and each consonant, 43 in all. A consonant's star
// lights once either of its forms, the base consonant or the consonant with
// its subscript, earns at least one star. Nothing is locked: any character
// can be traced at any time.

export type SkyStar = { kind: 'number'; digit: number } | { kind: 'consonant'; order: number };

// The sky's stars in order: the numbers, then the consonants.
export const SKY: readonly SkyStar[] = [
  ...numerals.map((numeral): SkyStar => ({ kind: 'number', digit: numeral.digit })),
  ...letters.map((letter): SkyStar => ({ kind: 'consonant', order: letter.order })),
];

// The star a character lights: its number, or its consonant in either form.
export function starOf(target: TraceTarget): SkyStar {
  return target.kind === 'number' ? target : { kind: 'consonant', order: target.order };
}

export function starIndex(star: SkyStar): number {
  return star.kind === 'number' ? star.digit : numerals.length + star.order - 1;
}

export function bestOf(progress: Progress, target: TraceTarget): Best | null {
  return progress.best[targetKey(target)] ?? null;
}

export function starsOf(progress: Progress, target: TraceTarget): Stars {
  return bestOf(progress, target)?.stars ?? 0;
}

// The traceable forms behind a sky star.
function formsOf(star: SkyStar): TraceTarget[] {
  if (star.kind === 'number') return [star];
  return [
    { kind: 'letter', order: star.order, form: 'letter' },
    { kind: 'letter', order: star.order, form: 'both' },
  ];
}

export function isStarLit(progress: Progress, star: SkyStar): boolean {
  return formsOf(star).some((target) => starsOf(progress, target) > 0);
}

export function litCount(progress: Progress): number {
  return SKY.filter((star) => isStarLit(progress, star)).length;
}

export function isSkyLit(progress: Progress): boolean {
  return SKY.every((star) => isStarLit(progress, star));
}

// A star's best: the more stars of its forms.
export function bestStarsOf(progress: Progress, star: SkyStar): Stars {
  return Math.max(...formsOf(star).map((target) => starsOf(progress, target))) as Stars;
}

// The badges, in tiers that grow like a flower: the seed for every number,
// the bud for half the sky, the rumduol in bloom for the whole sky, and the
// apsara, in her crown of flowers, for three stars on every star.
export type Tier = 'seed' | 'bud' | 'bloom' | 'apsara';

export const TIERS: readonly Tier[] = ['seed', 'bud', 'bloom', 'apsara'];

// How many characters each tier needs: lit for the seed, bud and bloom, with
// three stars for the apsara. The seed counts only the numbers.
export const TIER_GOALS: Readonly<Record<Tier, number>> = {
  seed: numerals.length,
  bud: Math.ceil(SKY.length / 2),
  bloom: SKY.length,
  apsara: SKY.length,
};

export function hasTier(progress: Progress, tier: Tier): boolean {
  switch (tier) {
    case 'seed':
      return SKY.filter((star) => star.kind === 'number').every((star) => isStarLit(progress, star));
    case 'bud':
      return litCount(progress) >= TIER_GOALS.bud;
    case 'bloom':
      return isSkyLit(progress);
    case 'apsara':
      return SKY.every((star) => bestStarsOf(progress, star) === 3);
  }
}

export function earnedTiers(progress: Progress): Tier[] {
  return TIERS.filter((tier) => hasTier(progress, tier));
}

// A suggestion of what to trace next: the first star in the sky's order
// that is still dark, as its number or base consonant. Null once the whole
// sky is lit.
export function nextStar(progress: Progress): TraceTarget | null {
  const star = SKY.find((each) => !isStarLit(progress, each));
  if (!star) return null;
  return formsOf(star)[0];
}

// What a result means for the story, for the line from the sky and the
// celebrations. `before` and `after` are the progress either side of it.
export interface ResultStory {
  // This form's best before this result, if there was one.
  readonly previous: Best | null;
  // Beat an earlier best score in this form.
  readonly newBest: boolean;
  // The character's star in the sky was already lit, by either form.
  readonly wasLit: boolean;
  // The character's star in the sky lit up with this result.
  readonly litNow: boolean;
  // This result lit the last star in the sky.
  readonly skyLit: boolean;
  // The badges this result earned, lowest tier first.
  readonly newTiers: readonly Tier[];
  // The character's star: its place in SKY.
  readonly star: number;
}

export function resultStory(before: Progress, after: Progress, target: TraceTarget): ResultStory {
  const previous = bestOf(before, target);
  const now = bestOf(after, target);
  const star = starOf(target);
  const wasLit = isStarLit(before, star);
  return {
    previous,
    newBest: previous !== null && now !== null && now.score > previous.score,
    wasLit,
    litNow: !wasLit && isStarLit(after, star),
    skyLit: !isSkyLit(before) && isSkyLit(after),
    newTiers: TIERS.filter((tier) => !hasTier(before, tier) && hasTier(after, tier)),
    star: starIndex(star),
  };
}
