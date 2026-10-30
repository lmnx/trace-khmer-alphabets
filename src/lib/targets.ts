import { letters } from '../data/letters';
import { numerals } from '../data/numerals';
import { glyph } from './forms';
import { numberHref, targetHref, traceHref, type TraceTarget } from './router';

// The text to trace. parseHash only builds targets that exist, so a letter's
// form always has a glyph here.
export function targetText(target: TraceTarget): string {
  if (target.kind === 'number') return numerals[target.digit].char;
  return glyph(letters[target.order - 1], target.form) ?? letters[target.order - 1].char;
}

// Links to the previous and next target in the same set: the numbers, or the
// letters in one form (Subscript skips ឡ). Null at either end of the set.
export function neighbours(target: TraceTarget): { previous: string | null; next: string | null } {
  const set =
    target.kind === 'number'
      ? numerals.map((numeral) => numberHref(numeral.digit))
      : letters
          .filter((letter) => glyph(letter, target.form) !== null)
          .map((letter) => traceHref(letter.order, target.form));
  const here = set.indexOf(targetHref(target));
  return { previous: set[here - 1] ?? null, next: set[here + 1] ?? null };
}
