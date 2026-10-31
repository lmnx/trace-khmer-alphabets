import { letters } from '../data/letters';
import { numerals } from '../data/numerals';
import { glyph, type Form } from './forms';
import type { TraceTarget } from './router';

// The text to trace. parseHash only builds targets that exist, so a letter's
// form always has a glyph here.
export function targetText(target: TraceTarget): string {
  if (target.kind === 'number') return numerals[target.digit].char;
  return glyph(letters[target.order - 1], target.form);
}

// The three sets, in order: the numbers, the letters, and the letters' full
// forms (in Both, ឡ is the letter alone). Previous and Next step within a
// set, and together the sets are the night sky's 76 stars.
export type SetName = 'numbers' | 'letters' | 'both';

export interface TargetSet {
  readonly name: SetName;
  readonly targets: readonly TraceTarget[];
}

function inForm(form: Form): TraceTarget[] {
  return letters.map((letter) => ({ kind: 'letter', order: letter.order, form }));
}

export const SETS: readonly TargetSet[] = [
  { name: 'numbers', targets: numerals.map((numeral) => ({ kind: 'number', digit: numeral.digit })) },
  { name: 'letters', targets: inForm('letter') },
  { name: 'both', targets: inForm('both') },
];

const SET_OF_FORM: Record<Form, SetName> = { letter: 'letters', both: 'both' };

export function setOf(target: TraceTarget): TargetSet {
  const name = target.kind === 'number' ? 'numbers' : SET_OF_FORM[target.form];
  return SETS.find((set) => set.name === name) ?? SETS[0];
}

// A target's name in stored progress: number/0, letter/1, both/1.
export function targetKey(target: TraceTarget): string {
  return target.kind === 'number' ? `number/${target.digit}` : `${target.form}/${target.order}`;
}

// The previous and next target in the same set, or null at either end.
export function neighbours(target: TraceTarget): { previous: TraceTarget | null; next: TraceTarget | null } {
  const { targets } = setOf(target);
  const here = targets.findIndex((other) => targetKey(other) === targetKey(target));
  return { previous: targets[here - 1] ?? null, next: targets[here + 1] ?? null };
}
