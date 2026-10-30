// Generated from src/data/letters.csv by scripts/generate-letters.ts.
// Do not edit by hand: change the CSV, then run `npm run letters`.

export type Series = 1 | 2;

export interface Letter {
  readonly order: number;
  readonly char: string;
  readonly unicode: string;
  readonly name: string;
  readonly series: Series;
}

export const letters: readonly Letter[] = [
  { order: 1, char: "ក", unicode: "U+1780", name: "ka", series: 1 },
  { order: 2, char: "ខ", unicode: "U+1781", name: "kha", series: 1 },
  { order: 3, char: "គ", unicode: "U+1782", name: "ko", series: 2 },
  { order: 4, char: "ឃ", unicode: "U+1783", name: "kho", series: 2 },
  { order: 5, char: "ង", unicode: "U+1784", name: "ngo", series: 2 },
  { order: 6, char: "ច", unicode: "U+1785", name: "cha", series: 1 },
  { order: 7, char: "ឆ", unicode: "U+1786", name: "chha", series: 1 },
  { order: 8, char: "ជ", unicode: "U+1787", name: "cho", series: 2 },
  { order: 9, char: "ឈ", unicode: "U+1788", name: "chho", series: 2 },
  { order: 10, char: "ញ", unicode: "U+1789", name: "nho", series: 2 },
  { order: 11, char: "ដ", unicode: "U+178A", name: "da", series: 1 },
  { order: 12, char: "ឋ", unicode: "U+178B", name: "tha", series: 1 },
  { order: 13, char: "ឌ", unicode: "U+178C", name: "do", series: 2 },
  { order: 14, char: "ឍ", unicode: "U+178D", name: "tho", series: 2 },
  { order: 15, char: "ណ", unicode: "U+178E", name: "na", series: 1 },
  { order: 16, char: "ត", unicode: "U+178F", name: "ta", series: 1 },
  { order: 17, char: "ថ", unicode: "U+1790", name: "tha", series: 1 },
  { order: 18, char: "ទ", unicode: "U+1791", name: "to", series: 2 },
  { order: 19, char: "ធ", unicode: "U+1792", name: "tho", series: 2 },
  { order: 20, char: "ន", unicode: "U+1793", name: "no", series: 2 },
  { order: 21, char: "ប", unicode: "U+1794", name: "ba", series: 1 },
  { order: 22, char: "ផ", unicode: "U+1795", name: "pha", series: 1 },
  { order: 23, char: "ព", unicode: "U+1796", name: "po", series: 2 },
  { order: 24, char: "ភ", unicode: "U+1797", name: "pho", series: 2 },
  { order: 25, char: "ម", unicode: "U+1798", name: "mo", series: 2 },
  { order: 26, char: "យ", unicode: "U+1799", name: "yo", series: 2 },
  { order: 27, char: "រ", unicode: "U+179A", name: "ro", series: 2 },
  { order: 28, char: "ល", unicode: "U+179B", name: "lo", series: 2 },
  { order: 29, char: "វ", unicode: "U+179C", name: "vo", series: 2 },
  { order: 30, char: "ស", unicode: "U+179F", name: "sa", series: 1 },
  { order: 31, char: "ហ", unicode: "U+17A0", name: "ha", series: 1 },
  { order: 32, char: "ឡ", unicode: "U+17A1", name: "la", series: 1 },
  { order: 33, char: "អ", unicode: "U+17A2", name: "a", series: 1 },
];
