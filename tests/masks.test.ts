import { describe, expect, it } from 'vitest';
import { inStripeGap, MISSED_STRIPES } from '../src/lib/masks';
import { SCORING } from '../src/lib/scoring';

describe('the stripes on missed parts', () => {
  it('leave a gap of the same width in every period, along any row', () => {
    for (const y of [0, 1, 100, SCORING.size - 1]) {
      const row = Array.from({ length: SCORING.size }, (_, x) => inStripeGap(y * SCORING.size + x));
      for (let start = 0; start + MISSED_STRIPES.period <= row.length; start += MISSED_STRIPES.period) {
        expect(row.slice(start, start + MISSED_STRIPES.period).filter(Boolean)).toHaveLength(MISSED_STRIPES.gap);
      }
    }
  });

  it('run diagonally, so the next row shifts by one pixel', () => {
    expect(inStripeGap(SCORING.size + 1)).toBe(inStripeGap(2));
    expect(inStripeGap(SCORING.size)).toBe(inStripeGap(1));
  });
});
