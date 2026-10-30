// `npm run letters`: regenerates src/data/letters.ts from src/data/letters.csv.
import { readFileSync, writeFileSync } from 'node:fs';
import { parseLettersCsv, renderLettersModule } from './letters-csv.ts';

const csvUrl = new URL('../src/data/letters.csv', import.meta.url);
const moduleUrl = new URL('../src/data/letters.ts', import.meta.url);

const rows = parseLettersCsv(readFileSync(csvUrl, 'utf8'));
writeFileSync(moduleUrl, renderLettersModule(rows));
console.log(`Wrote ${rows.length} letters to src/data/letters.ts`);
