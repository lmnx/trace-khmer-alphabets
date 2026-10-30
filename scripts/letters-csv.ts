// Turns src/data/letters.csv into the source of src/data/letters.ts. Pure
// functions, so tests can check that letters.ts is up to date with the CSV.
// The CSV is edited by hand, so every row is checked before anything is written.

export interface LetterRow {
  order: number;
  char: string;
  unicode: string;
  name: string;
  series: 1 | 2;
}

const HEADER = 'order,char,unicode,name,series';
// One romanization: Latin letters, with diacritics, apostrophes or hyphens.
const NAME = /^\p{Script=Latin}[\p{Script=Latin}\p{M}'-]*$/u;
const UNICODE = /^U\+[0-9A-F]{4,5}$/;

export function parseLettersCsv(csv: string): LetterRow[] {
  // Tolerate a byte-order mark and Windows line endings from spreadsheet apps.
  const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/);
  while (lines.at(-1) === '') lines.pop();

  if (lines[0] !== HEADER) {
    throw new Error(`letters.csv line 1: expected the header "${HEADER}"`);
  }

  const chars = new Set<string>();
  return lines.slice(1).map((line, index) => {
    const lineNumber = index + 2;
    const fail = (problem: string): never => {
      throw new Error(`letters.csv line ${lineNumber}: ${problem}`);
    };

    const fields = line.split(',');
    if (fields.length !== 5) fail(`expected 5 fields, found ${fields.length}`);
    const [order, char, unicode, name, series] = fields;

    if (order !== String(index + 1)) fail(`expected order ${index + 1}, found "${order}"`);
    if ([...char].length !== 1) fail(`expected one character, found "${char}"`);
    if (!UNICODE.test(unicode)) fail(`expected a code point like U+1780, found "${unicode}"`);
    const codePoint = `U+${char.codePointAt(0)?.toString(16).toUpperCase().padStart(4, '0')}`;
    if (unicode !== codePoint) fail(`${char} is ${codePoint}, not ${unicode}`);
    if (chars.has(char)) fail(`${char} appears twice`);
    chars.add(char);
    if (!NAME.test(name)) fail(`expected a romanized name, found "${name}"`);
    if (series !== '1' && series !== '2') fail(`expected series 1 or 2, found "${series}"`);

    return { order: index + 1, char, unicode, name, series: series === '1' ? 1 : 2 };
  });
}

export function renderLettersModule(rows: readonly LetterRow[]): string {
  // JSON.stringify quotes every string, so no CSV value can break out of it.
  const entries = rows.map(
    ({ order, char, unicode, name, series }) =>
      `  { order: ${order}, char: ${JSON.stringify(char)}, unicode: ${JSON.stringify(unicode)}, ` +
      `name: ${JSON.stringify(name)}, series: ${series} },`,
  );
  return [
    '// Generated from src/data/letters.csv by scripts/generate-letters.ts.',
    '// Do not edit by hand: change the CSV, then run `npm run letters`.',
    '',
    'export type Series = 1 | 2;',
    '',
    'export interface Letter {',
    '  readonly order: number;',
    '  readonly char: string;',
    '  readonly unicode: string;',
    '  readonly name: string;',
    '  readonly series: Series;',
    '}',
    '',
    'export const letters: readonly Letter[] = [',
    ...entries,
    '];',
    '',
  ].join('\n');
}
