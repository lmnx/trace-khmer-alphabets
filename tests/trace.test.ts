import { describe, expect, it } from 'vitest';
import { fitGlyph, STROKE_EM, SUBSCRIPT_STROKE_EM, templateStrokeWidth } from '../src/lib/guide';
import type { Form } from '../src/lib/forms';
import { neighbours, SETS, setOf, targetKey, targetText } from '../src/lib/targets';

const letter = (order: number, form: Form = 'letter') => ({ kind: 'letter', order, form }) as const;
const number = (digit: number) => ({ kind: 'number', digit }) as const;

describe('fitGlyph', () => {
  it('scales the ink to fill 80% of the square and centres it', () => {
    // Measured at 100 px: 50 wide (10 left of the origin, 40 right), 100 tall (70 up, 30 down).
    const ink = { left: 10, right: 40, ascent: 70, descent: 30 };
    const { fontSize, x, y } = fitGlyph(ink, 1000);
    const scale = fontSize / 100;
    expect(fontSize).toBeCloseTo(800);
    expect(y - ink.ascent * scale).toBeCloseTo(100);
    expect(y + ink.descent * scale).toBeCloseTo(900);
    expect(x - ink.left * scale).toBeCloseTo(300);
    expect(x + ink.right * scale).toBeCloseTo(700);
  });

  it('fits a wide glyph by its width', () => {
    const { fontSize, x } = fitGlyph({ left: 0, right: 200, ascent: 40, descent: 10 }, 500);
    expect(fontSize).toBeCloseTo(200);
    expect(x).toBeCloseTo(50);
  });
});

describe('templateStrokeWidth', () => {
  it("is the font's pen width at the guide's size, as a share of the square", () => {
    expect([STROKE_EM, SUBSCRIPT_STROKE_EM]).toEqual([0.07, 0.06]);
    expect(templateStrokeWidth({ fontSize: 1000, x: 0, y: 0, strokeEm: STROKE_EM }, 1000)).toBeCloseTo(0.07);
    // A stack drawn smaller to fit gets thinner ink.
    expect(templateStrokeWidth({ fontSize: 500, x: 0, y: 0, strokeEm: STROKE_EM }, 1000)).toBeCloseTo(0.035);
    // A subscript's own strokes are thinner.
    expect(templateStrokeWidth({ fontSize: 1000, x: 0, y: 0, strokeEm: SUBSCRIPT_STROKE_EM }, 1000)).toBeCloseTo(0.06);
  });
});

describe('targetText', () => {
  const coeng = String.fromCodePoint(0x17d2);

  it('gives the character to trace for each kind of target', () => {
    expect(targetText({ kind: 'letter', order: 1, form: 'letter' })).toBe('ក');
    expect(targetText({ kind: 'letter', order: 1, form: 'both' })).toBe(`ក${coeng}ក`);
    expect(targetText({ kind: 'letter', order: 32, form: 'both' })).toBe('ឡ');
    expect(targetText({ kind: 'letter', order: 33, form: 'both' })).toBe(`អ${coeng}អ`);
    expect(targetText({ kind: 'number', digit: 5 })).toBe('៥');
  });
});

describe('neighbours', () => {
  it('steps through the letters, with nothing before the first or after the last', () => {
    expect(neighbours(letter(1))).toEqual({ previous: null, next: letter(2) });
    expect(neighbours(letter(33))).toEqual({ previous: letter(32), next: null });
  });

  it('stays in the same form, ឡ included in Both', () => {
    expect(neighbours(letter(31, 'both')).next).toEqual(letter(32, 'both'));
    expect(neighbours(letter(33, 'both'))).toEqual({ previous: letter(32, 'both'), next: null });
  });

  it('steps through the numbers 0 to 9', () => {
    expect(neighbours(number(0))).toEqual({ previous: null, next: number(1) });
    expect(neighbours(number(9))).toEqual({ previous: number(8), next: null });
  });
});

describe('SETS', () => {
  it('has the numbers, the letters and their full forms, 76 characters, each with its own key', () => {
    expect(SETS.map((set) => [set.name, set.targets.length])).toEqual([
      ['numbers', 10],
      ['letters', 33],
      ['both', 33],
    ]);
    const keys = SETS.flatMap((set) => set.targets.map(targetKey));
    expect(new Set(keys).size).toBe(76);
    expect(keys).toContain('number/0');
    expect(keys).toContain('both/32');
    expect(keys.some((key) => key.startsWith('subscript/'))).toBe(false);
  });

  it('puts each target in its own set', () => {
    expect(setOf(number(3)).name).toBe('numbers');
    expect(setOf(letter(3)).name).toBe('letters');
    expect(setOf(letter(3, 'both')).name).toBe('both');
  });
});
