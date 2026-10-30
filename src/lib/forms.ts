import type { Letter } from '../data/letters';

// What a letter tile shows: the letter, its subscript (coeng) form, or the
// letter with its own subscript under it, like ក្ក.
export type Form = 'letter' | 'subscript' | 'both';

export const FORMS: readonly Form[] = ['letter', 'subscript', 'both'];

const COENG = String.fromCodePoint(0x17d2);
// A subscript has no base of its own, so it sits under a dotted circle, the
// way Khmer dictionaries and keyboards show it.
const DOTTED_CIRCLE = String.fromCodePoint(0x25cc);

// The text for a letter in a form, or null when the letter has no subscript.
export function glyph(letter: Letter, form: Form): string | null {
  if (form === 'letter') return letter.char;
  if (!letter.subscript) return null;
  return form === 'subscript' ? DOTTED_CIRCLE + COENG + letter.char : letter.char + COENG + letter.char;
}
