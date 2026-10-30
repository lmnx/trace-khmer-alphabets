// The Khmer numerals ០ to ៩, U+17E0 to U+17E9 in order. Each tile is labelled
// with its Western digit, so the numerals need no romanization and no CSV.

export interface Numeral {
  readonly digit: number;
  readonly char: string;
}

export const numerals: readonly Numeral[] = Array.from({ length: 10 }, (_, digit) => ({
  digit,
  char: String.fromCodePoint(0x17e0 + digit),
}));
