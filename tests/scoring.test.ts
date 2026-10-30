import { describe, expect, it } from 'vitest';
import {
  grow,
  samplePaths,
  scoreTrace,
  SCORING,
  squaredDistances,
  starsFor,
  type Mask,
  type Path,
} from '../src/lib/scoring';

const N = SCORING.size;
type Segment = [x0: number, y0: number, x1: number, y1: number];

// A mask of thick lines with round ends, the way a pen draws them.
function pen(segments: Segment[], width: number): Mask {
  const mask = new Uint8Array(N * N);
  const reach = (width / 2) ** 2;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      for (const [x0, y0, x1, y1] of segments) {
        const length = (x1 - x0) ** 2 + (y1 - y0) ** 2;
        const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - x0) * (x1 - x0) + (py - y0) * (y1 - y0)) / length));
        if ((px - x0 - t * (x1 - x0)) ** 2 + (py - y0 - t * (y1 - y0)) ** 2 <= reach) {
          mask[y * N + x] = 1;
          break;
        }
      }
    }
  }
  return mask;
}

const pathsOf = (segments: Segment[]): Path[] => segments.map(([x0, y0, x1, y1]) => [[x0, y0], [x1, y1]]);

// A letter shaped like ក, in 24 px strokes filling about 80% of the box: a bar
// over an arch on two legs. `stray` moves every stroke that far from the
// middle of the letter's stroke, towards the inside of the letter.
const WIDTH = 24;
function letter(stray = 0): Segment[] {
  const radius = 58 - stray;
  const arch = Array.from({ length: 25 }, (_, i) => {
    const angle = Math.PI - (Math.PI * i) / 24;
    return [128 + radius * Math.cos(angle), 128 - radius * Math.sin(angle)];
  });
  return [
    [56, 40 + stray, 200, 40 + stray],
    [70 + stray, 225, 70 + stray, 128],
    ...arch.slice(1).map(([x, y], i): Segment => [arch[i][0], arch[i][1], x, y]),
    [186 - stray, 128, 186 - stray, 225],
  ];
}
const target = pen(letter(), WIDTH);

function trace(segments: Segment[]) {
  return scoreTrace(target, pen(segments, WIDTH), pathsOf(segments), WIDTH);
}

// Lines back and forth across the whole box, `spacing` apart.
function zigzag(spacing: number): Segment[] {
  const segments: Segment[] = [];
  for (let y = 8, left = true; y < N - 8; y += spacing, left = !left) {
    segments.push(left ? [8, y, N - 8, y + spacing] : [N - 8, y, 8, y + spacing]);
  }
  return segments;
}

const count = (mask: Mask) => mask.reduce((sum, pixel) => sum + pixel, 0);

describe('scoreTrace', () => {
  it('gives a careful trace, up to a few pixels off the middle, 99 or more', () => {
    for (const stray of [0, 1, 2, 3, 4]) {
      const careful = trace(letter(stray));
      expect(careful.score, `${stray} px off`).toBeGreaterThanOrEqual(99);
      expect(careful.stars).toBe(3);
    }
  });

  it('takes more and more points off as the trace strays beyond the free wobble', () => {
    const scores = [4, 6, 9, 12].map((stray) => trace(letter(stray)).score);
    for (let i = 1; i < scores.length; i++) expect(scores[i], `${scores}`).toBeLessThan(scores[i - 1]);
    // A quarter of a stroke off still scores well; a rough trace lands
    // between 50 and 75; along the edge (half a stroke off) is under 60.
    expect(trace(letter(6)).score).toBeGreaterThanOrEqual(85);
    expect(trace(letter(9)).score).toBeGreaterThanOrEqual(60);
    expect(trace(letter(9)).score).toBeLessThan(80);
    expect(trace(letter(12)).score).toBeGreaterThanOrEqual(35);
    expect(trace(letter(12)).score).toBeLessThan(60);
  });

  it('gives a scribble over the whole box, or colouring it in, under 40 and no stars', () => {
    for (const spacing of [WIDTH * 0.8, WIDTH * 1.5, WIDTH * 3]) {
      const scribble = trace(zigzag(spacing));
      expect(scribble.score, `spacing ${spacing}`).toBeLessThan(40);
      expect(scribble.stars).toBe(0);
    }
  });

  it('gives an empty canvas 0', () => {
    expect(scoreTrace(target, new Uint8Array(N * N), [], WIDTH)).toMatchObject({
      coverage: 0,
      precision: 0,
      score: 0,
      stars: 0,
    });
  });

  it('gives half the letter no star, and splits the letter into covered and missed', () => {
    const half = trace(letter().slice(0, 2));
    expect(half.stars).toBe(0);
    expect(half.precision).toBeGreaterThan(0.9);
    expect(count(half.covered) + count(half.missed)).toBe(count(target));
    expect(count(half.missed)).toBeGreaterThan(0);
    for (let i = 0; i < target.length; i++) expect(half.covered[i] & half.missed[i]).toBe(0);
  });

  it('counts the letter as covered within reach of the ink, and not beyond', () => {
    const letterBar = pen([[40, 100, 216, 100]], WIDTH);
    const shifted = (by: number): Segment[] => [[40, 100 + by, 216, 100 + by]];
    const coverage = (by: number) => scoreTrace(letterBar, pen(shifted(by), WIDTH), pathsOf(shifted(by)), WIDTH).coverage;
    // Ink as wide as the bar, moved down by `reach`, still reaches its top edge.
    expect(coverage(SCORING.reach)).toBe(1);
    // A whole stroke and `reach` further down, it reaches none of it.
    expect(coverage(WIDTH + SCORING.reach + 2)).toBe(0);
  });
});

describe('samplePaths', () => {
  it('spaces points one pixel apart along each path, across its corners', () => {
    expect(samplePaths([[[0, 0], [10, 0]]])).toHaveLength(11);
    const corner = samplePaths([[[0, 0], [2.5, 0], [2.5, 2.5]]]);
    expect(corner.map(([x, y]) => [x, y])).toEqual([
      [0, 0],
      [1, 0],
      [2, 0],
      [2.5, 0.5],
      [2.5, 1.5],
      [2.5, 2.5],
    ]);
    expect(samplePaths([[[5, 5]], []])).toEqual([[5, 5]]);
  });
});

describe('starsFor', () => {
  it('gives 1, 2 and 3 stars from 60, 75 and 88', () => {
    expect(SCORING.stars).toEqual([60, 75, 88]);
    expect([0, 59, 60, 74, 75, 87, 88, 100].map(starsFor)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
});

describe('squaredDistances and grow', () => {
  const single = new Uint8Array(N * N);
  single[100 * N + 100] = 1;

  it('measures exact squared distances to the nearest set pixel', () => {
    const distances = squaredDistances(single);
    expect(distances[100 * N + 100]).toBe(0);
    expect(distances[100 * N + 103]).toBe(9);
    expect(distances[104 * N + 103]).toBe(25);
    expect(distances[0]).toBe(100 * 100 * 2);
    expect(squaredDistances(new Uint8Array(N * N))[0]).toBe(Infinity);
  });

  it('grows a mask into a disc', () => {
    // Every pixel with dx² + dy² <= 4: a 13-pixel disc.
    expect(count(grow(single, 2))).toBe(13);
    expect(count(grow(single, 0))).toBe(1);
  });
});
