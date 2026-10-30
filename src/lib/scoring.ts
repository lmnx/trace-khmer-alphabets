// Scores a trace by its shape, not its stroke order. Pure functions over
// square masks (1 = set) and stroke paths, with no DOM access, so they run in
// unit tests. src/lib/masks.ts draws the masks in the browser.
//
// Coverage: the share of the letter within `reach` px of the learner's ink, so
// every part of the letter has to be traced.
// Precision: how close the middle of the learner's strokes keeps to the middle
// of the letter's strokes. Each point along the strokes earns full credit
// within `wobble` px of the middle, then 1 - stray², where stray runs from 0
// there to 1 at `precision` px. So the wobble in a careful trace costs nothing
// and bigger strays cost more and more. The points are averaged.
// Score = coverage x precision x 100.
//
// Tuned with Kim on a phone. The first version only asked whether ink landed
// inside an allowed zone, so any rough trace scored 90+. A straight-line
// falloff then put 95+ out of reach even for careful traces. On a ក-shaped
// letter this curve gives 99+ up to 4 px off, 94 at 6 px, 79 at 9 px and 49
// at 12 px (a scoring pixel is about 1.3 px on a phone), and scribbles stay
// around 20.

export const SCORING = {
  // Masks are size x size pixels.
  size: 256,
  // A pixel of the letter within this many pixels of ink counts as traced.
  reach: 8,
  // Wobble up to this many pixels from the middle of the letter's strokes is free.
  wobble: 2,
  // Points this many pixels from the middle of the letter's strokes earn nothing.
  precision: 18,
  // Scores for 1, 2 and 3 stars.
  stars: [60, 75, 88],
} as const;

export type Mask = Uint8Array;
export type Stars = 0 | 1 | 2 | 3;
// A stroke's points in mask pixels.
export type Path = readonly (readonly [x: number, y: number])[];

export interface TraceScore {
  coverage: number;
  precision: number;
  score: number;
  stars: Stars;
  // Pixels of the letter the ink reached (shown green) and missed (red).
  covered: Mask;
  missed: Mask;
}

// The squared distance from every pixel to the nearest set pixel, exactly
// (Felzenszwalb and Huttenlocher's two-pass transform). Infinity if none is set.
export function squaredDistances(mask: Mask, size: number = SCORING.size): Float64Array {
  const distances = new Float64Array(size * size);
  for (let i = 0; i < distances.length; i++) distances[i] = mask[i] ? 0 : Infinity;
  const line = new Float64Array(size);
  const result = new Float64Array(size);
  const hulls = new Int32Array(size);
  const bounds = new Float64Array(size + 1);

  function transform() {
    let k = -1;
    for (let q = 0; q < size; q++) {
      if (line[q] === Infinity) continue;
      let s = -Infinity;
      while (k >= 0) {
        const p = hulls[k];
        s = (line[q] + q * q - (line[p] + p * p)) / (2 * (q - p));
        if (s > bounds[k]) break;
        k--;
      }
      k++;
      hulls[k] = q;
      bounds[k] = k === 0 ? -Infinity : s;
      bounds[k + 1] = Infinity;
    }
    if (k < 0) {
      result.fill(Infinity);
      return;
    }
    let j = 0;
    for (let q = 0; q < size; q++) {
      while (bounds[j + 1] < q) j++;
      const p = hulls[j];
      result[q] = (q - p) * (q - p) + line[p];
    }
  }

  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) line[y] = distances[y * size + x];
    transform();
    for (let y = 0; y < size; y++) distances[y * size + x] = result[y];
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) line[x] = distances[y * size + x];
    transform();
    for (let x = 0; x < size; x++) distances[y * size + x] = result[x];
  }
  return distances;
}

// The mask grown by `radius` pixels in every direction.
export function grow(mask: Mask, radius: number, size: number = SCORING.size): Mask {
  const distances = squaredDistances(mask, size);
  const grown = new Uint8Array(mask.length);
  for (let i = 0; i < grown.length; i++) grown[i] = distances[i] <= radius * radius ? 1 : 0;
  return grown;
}

// Points along each path, one pixel apart, so a slow, dense stroke counts no
// more than a quick one of the same length.
export function samplePaths(paths: readonly Path[]): [number, number][] {
  const points: [number, number][] = [];
  for (const path of paths) {
    if (path.length === 0) continue;
    points.push([path[0][0], path[0][1]]);
    let carry = 0;
    for (let i = 1; i < path.length; i++) {
      const [x0, y0] = path[i - 1];
      const [x1, y1] = path[i];
      const length = Math.hypot(x1 - x0, y1 - y0);
      let at = 1 - carry;
      for (; at <= length; at += 1) points.push([x0 + ((x1 - x0) * at) / length, y0 + ((y1 - y0) * at) / length]);
      carry = length - (at - 1);
    }
  }
  return points;
}

export function starsFor(score: number): Stars {
  return SCORING.stars.filter((threshold) => score >= threshold).length as Stars;
}

// `strokeWidth` is the letter's stroke width in mask pixels, so a point's
// distance from the middle of a stroke can be read off its distance to the
// stroke's edge.
export function scoreTrace(
  target: Mask,
  ink: Mask,
  paths: readonly Path[],
  strokeWidth: number,
  config: typeof SCORING = SCORING,
): TraceScore {
  const { size } = config;
  const reached = grow(ink, config.reach, size);
  const covered = new Uint8Array(target.length);
  const missed = new Uint8Array(target.length);
  let letterPixels = 0;
  let coveredPixels = 0;
  for (let i = 0; i < target.length; i++) {
    if (!target[i]) continue;
    letterPixels++;
    if (reached[i]) {
      covered[i] = 1;
      coveredPixels++;
    } else {
      missed[i] = 1;
    }
  }

  // Distance to the letter from outside it, and to its edge from inside it.
  const toLetter = squaredDistances(target, size);
  const outside = new Uint8Array(target.length);
  for (let i = 0; i < outside.length; i++) outside[i] = target[i] ? 0 : 1;
  const toEdge = squaredDistances(outside, size);
  const half = strokeWidth / 2;

  const points = samplePaths(paths);
  let credit = 0;
  for (const [x, y] of points) {
    const px = Math.min(size - 1, Math.max(0, Math.floor(x)));
    const py = Math.min(size - 1, Math.max(0, Math.floor(y)));
    const i = py * size + px;
    const offMiddle = target[i] ? Math.max(0, half - Math.sqrt(toEdge[i])) : half + Math.sqrt(toLetter[i]);
    const stray = Math.max(0, offMiddle - config.wobble) / (config.precision - config.wobble);
    credit += Math.max(0, 1 - stray ** 2);
  }

  const coverage = letterPixels === 0 ? 0 : coveredPixels / letterPixels;
  const precision = points.length === 0 ? 0 : credit / points.length;
  const score = Math.round(coverage * precision * 100);
  return { coverage, precision, score, stars: starsFor(score), covered, missed };
}
