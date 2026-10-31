import { describe, expect, it } from 'vitest';
import { letters } from '../src/data/letters';
import { numerals } from '../src/data/numerals';
import { glyph } from '../src/lib/forms';

const byChar = (char: string) => {
  const letter = letters.find((candidate) => candidate.char === char);
  if (!letter) throw new Error(`no letter ${char}`);
  return letter;
};

describe('glyph', () => {
  it('shows a letter, or its full form with its subscript stacked under it', () => {
    const ka = byChar('ក');
    expect(glyph(ka, 'letter')).toBe('ក');
    expect(glyph(ka, 'both')).toBe('ក\u17D2ក');
  });

  it('shows ឡ alone in Both, since it has no subscript', () => {
    const la = byChar('ឡ');
    expect(glyph(la, 'letter')).toBe('ឡ');
    expect(glyph(la, 'both')).toBe('ឡ');
  });
});

describe('numerals', () => {
  it('are ០ to ៩, each with its digit', () => {
    expect(numerals.map((numeral) => numeral.char).join('')).toBe('០១២៣៤៥៦៧៨៩');
    expect(numerals.map((numeral) => numeral.digit)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });
});
