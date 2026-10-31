import type { Best, Progress } from './progress';
import type { TraceTarget } from './router';
import type { Stars } from './scoring';
import { SETS, targetKey } from './targets';

// The night sky story, as pure functions over saved progress. Every
// character, in every form, is a star in one constellation of 76, and it
// lights up once the learner earns at least one star on that character.
// Nothing is locked: any character can be traced at any time.

// The sky's stars in order: the numbers, then the letters, then their full
// forms.
export const SKY: readonly TraceTarget[] = SETS.flatMap((set) => set.targets);

export function bestOf(progress: Progress, target: TraceTarget): Best | null {
  return progress.best[targetKey(target)] ?? null;
}

export function starsOf(progress: Progress, target: TraceTarget): Stars {
  return bestOf(progress, target)?.stars ?? 0;
}

export function isLit(progress: Progress, target: TraceTarget): boolean {
  return starsOf(progress, target) > 0;
}

export function litCount(progress: Progress): number {
  return SKY.filter((target) => isLit(progress, target)).length;
}

export function isSkyLit(progress: Progress): boolean {
  return SKY.every((target) => isLit(progress, target));
}

// A suggestion of what to trace next: the first character, in the sky's
// order, with no star yet. Null once the whole sky is lit.
export function nextStar(progress: Progress): TraceTarget | null {
  return SKY.find((target) => !isLit(progress, target)) ?? null;
}

// What a result means for the story, for the line from the sky and the
// celebrations. `before` and `after` are the progress either side of it.
export interface ResultStory {
  // The best before this result, if there was one.
  readonly previous: Best | null;
  // Beat an earlier best score.
  readonly newBest: boolean;
  // The character's first star: its star in the sky lights up.
  readonly litNow: boolean;
  // This result lit the last star in the sky.
  readonly skyLit: boolean;
}

export function resultStory(before: Progress, after: Progress, target: TraceTarget): ResultStory {
  const previous = bestOf(before, target);
  const now = bestOf(after, target);
  return {
    previous,
    newBest: previous !== null && now !== null && now.score > previous.score,
    litNow: !isLit(before, target) && isLit(after, target),
    skyLit: !isSkyLit(before) && isSkyLit(after),
  };
}
