import type { Letter } from '../data/letters';

// What a letter tile shows: the letter, or its full form, the letter with
// its own subscript (coeng) under it, like ក្ក. The Subscript form on its own
// was dropped on 2026-10-31.
export type Form = 'letter' | 'both';

export const FORMS: readonly Form[] = ['letter', 'both'];

const COENG = String.fromCodePoint(0x17d2);
// A subscript on its own sits under a dotted circle, the way Khmer
// dictionaries and keyboards show it. No form shows one now, but guide.ts
// still draws one correctly, should the Subscript form come back.
export const DOTTED_CIRCLE = String.fromCodePoint(0x25cc);

// The text for a letter in a form. ឡ has no subscript, so in Both it shows
// alone.
export function glyph(letter: Letter, form: Form): string {
  if (form === 'letter' || !letter.subscript) return letter.char;
  return letter.char + COENG + letter.char;
}
