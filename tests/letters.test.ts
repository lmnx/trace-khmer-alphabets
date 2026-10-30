import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseLettersCsv, renderLettersModule } from '../scripts/letters-csv';
import { letters } from '../src/data/letters';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('letters.ts', () => {
  it('is up to date with letters.csv (run `npm run letters` if not)', () => {
    const csv = read('../src/data/letters.csv');
    expect(read('../src/data/letters.ts')).toBe(renderLettersModule(parseLettersCsv(csv)));
  });

  it('has the 33 consonants: 15 in the first series and 18 in the second', () => {
    expect(letters).toHaveLength(33);
    expect(letters.filter((letter) => letter.series === 1)).toHaveLength(15);
    expect(letters.filter((letter) => letter.series === 2)).toHaveLength(18);
    expect(letters.map((letter) => letter.order)).toEqual(Array.from({ length: 33 }, (_, i) => i + 1));
  });

  it('matches every char to its unicode code point', () => {
    for (const letter of letters) {
      const codePoints = [...letter.char].map((char) => char.codePointAt(0));
      expect(codePoints, letter.unicode).toEqual([Number.parseInt(letter.unicode.slice(2), 16)]);
    }
  });

  it('uses only Khmer consonants, leaving out the obsolete U+179D and U+179E', () => {
    for (const letter of letters) {
      const codePoint = letter.char.codePointAt(0) ?? 0;
      expect(codePoint >= 0x1780 && codePoint <= 0x17a2, letter.unicode).toBe(true);
      expect([0x179d, 0x179e], letter.unicode).not.toContain(codePoint);
    }
    expect(new Set(letters.map((letter) => letter.char)).size).toBe(letters.length);
  });

  it('gives every letter a subscript form except ឡ', () => {
    expect(letters.filter((letter) => !letter.subscript).map((letter) => letter.char)).toEqual(['ឡ']);
  });
});

describe('parseLettersCsv', () => {
  const header = 'order,char,unicode,name,series,subscript';

  it('accepts Windows line endings and a byte-order mark', () => {
    expect(parseLettersCsv(`\uFEFF${header}\r\n1,ក,U+1780,kâ,1,yes\r\n`)).toEqual([
      { order: 1, char: 'ក', unicode: 'U+1780', name: 'kâ', series: 1, subscript: true },
    ]);
  });

  it('rejects rows that would put wrong data in the app', () => {
    const bad: Record<string, string> = {
      'a different header': 'order,char,code,name,series,subscript\n1,ក,U+1780,ka,1,yes',
      'a code point that does not match the char': `${header}\n1,ក,U+1781,ka,1,yes`,
      'a gap in the order': `${header}\n2,ក,U+1780,ka,1,yes`,
      'a char given twice': `${header}\n1,ក,U+1780,ka,1,yes\n2,ក,U+1780,ka,1,yes`,
      'two chars in one cell': `${header}\n1,កខ,U+1780,ka,1,yes`,
      'a third series': `${header}\n1,ក,U+1780,ka,3,yes`,
      'a subscript that is not yes or no': `${header}\n1,ក,U+1780,ka,1,true`,
      'a missing field': `${header}\n1,ក,U+1780,ka,1`,
      'an extra field': `${header}\n1,ក,U+1780,ka,1,yes,x`,
      'a name that is not romanized': `${header}\n1,ក,U+1780,<b>,1,yes`,
      'an empty name': `${header}\n1,ក,U+1780,,1,yes`,
    };
    for (const [problem, csv] of Object.entries(bad)) {
      expect(() => parseLettersCsv(csv), problem).toThrow(/^letters\.csv line \d+:/);
    }
  });
});
