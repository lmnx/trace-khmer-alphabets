import { useEffect, useId, useRef } from 'react';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import { sparkle } from '../lib/motion';
import type { Progress } from '../lib/progress';
import { targetHref } from '../lib/router';
import { isLit, litCount, nextStar, SKY } from '../lib/sky';
import { SETS, targetKey, targetText, type SetName } from '../lib/targets';
import { KhmerText } from './KhmerText';
import { STAR_BUTTON } from './styles';

// The home page's night sky: one constellation of every character's star,
// how many are lit, and a button to a character with no star yet.
export function NightSky({ progress }: { progress: Progress }) {
  const fontReady = useKhmerFontReady();
  const headingId = useId();
  const next = nextStar(progress);
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-3xl bg-sunk p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id={headingId} className="text-lg font-bold text-fg">
          {en.sky.heading}
        </h2>
        <p className="text-sm text-fg-muted">{en.sky.lit(litCount(progress), SKY.length)}</p>
      </div>
      <Constellation progress={progress} next={next ? targetKey(next) : null} />
      {next ? (
        <a href={targetHref(next)} className={STAR_BUTTON}>
          {en.sky.next}
          <KhmerText text={targetText(next)} fontReady={fontReady} className="text-xl leading-none" />
        </a>
      ) : (
        <p className="flex min-h-12 items-center justify-center font-semibold text-star">{en.sky.allLit}</p>
      )}
    </section>
  );
}

// The constellation: a rumduol flower, one star per character in the sky's
// order, joined by lines that light once the stars at both ends are lit.
// `next` (a target key) twinkles in mint. With `celebrate`, every star pops in
// one after another.
export function Constellation({
  progress,
  next = null,
  celebrate = false,
  className = '',
}: {
  progress: Progress;
  next?: string | null;
  celebrate?: boolean;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (celebrate) sparkle(svgRef.current, 12);
  }, [celebrate]);
  const lit = SKY.map((target) => isLit(progress, target));
  const nextIndex = next === null ? -1 : SKY.findIndex((target) => targetKey(target) === next);
  return (
    <svg ref={svgRef} aria-hidden="true" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`h-auto w-full ${className}`}>
      {DUST.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.7} className="fill-fg-faint/40" />
      ))}
      {LINKS.map(([i, j]) => (
        <line
          key={`${i}-${j}`}
          x1={POINTS[i][0]}
          y1={POINTS[i][1]}
          x2={POINTS[j][0]}
          y2={POINTS[j][1]}
          strokeWidth={lit[i] && lit[j] ? 1.2 : 0.8}
          strokeLinecap="round"
          className={lit[i] && lit[j] ? 'stroke-star/55' : 'stroke-line'}
        />
      ))}
      {POINTS.map(([x, y], i) => (
        <circle
          key={i}
          data-star=""
          data-lit={lit[i] ? '' : undefined}
          cx={x}
          cy={y}
          r={lit[i] || i === nextIndex ? 3 : 1.6}
          className={`origin-center [transform-box:fill-box] ${
            lit[i] ? 'fill-star' : i === nextIndex ? 'fill-mint motion-safe:animate-twinkle' : 'fill-fg-faint'
          }`}
        />
      ))}
    </svg>
  );
}

// The rumduol, Cambodia's national flower, seen from above and drawn for
// the app: three broad, pointed outer petals, and three small rounded inner
// petals closing into a dome over the heart. Each part of the sky is its own
// part of the flower, filling from the middle out: the numbers ring the
// heart, the letters light the inner petals, eleven to a petal, and their
// full forms light the outer petals. Inner petals hide the outer ones where
// they cover them, as in a line drawing, and stars are spaced evenly along
// every visible edge.

type Point = readonly [x: number, y: number];

const WIDTH = 320;
const HEIGHT = 240;
const CENTRE: Point = [160, 138];
const HEART_RADIUS = 13;
// Nothing but the heart's ring inside this radius.
const HEART_CLEAR = 20;

// A fixed pseudo-random offset from -0.5 to 0.5.
function jitter(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x) - 0.5;
}

function lengthOf(line: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < line.length; i++) total += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]);
  return total;
}

// `count` points spaced evenly along a polyline, by length, the first and
// last half a step in from its ends.
function resample(line: readonly Point[], count: number): Point[] {
  const lengths = [0];
  for (let i = 1; i < line.length; i++) {
    lengths.push(lengths[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]));
  }
  const total = lengths[lengths.length - 1];
  return Array.from({ length: count }, (_, k) => {
    const at = ((k + 0.5) / count) * total;
    let i = 1;
    while (i < line.length - 1 && lengths[i] < at) i++;
    const t = (at - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
    return [line[i - 1][0] + (line[i][0] - line[i - 1][0]) * t, line[i - 1][1] + (line[i][1] - line[i - 1][1]) * t];
  });
}

function inside([x, y]: Point, polygon: readonly Point[]): boolean {
  let within = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) within = !within;
  }
  return within;
}

// A petal's outline, pointing `angle` degrees clockwise from the right: out
// along one edge to the tip and back along the other. `fullness` below 1
// rounds the tip, `peak` sets how near the base it is widest, and `curl`
// bends it clockwise towards the tip.
function petal(angle: number, length: number, width: number, peak: number, fullness: number, curl = 0): Point[] {
  const a = (angle * Math.PI) / 180;
  const out: Point = [Math.cos(a), Math.sin(a)];
  const side: Point = [-Math.sin(a), Math.cos(a)];
  const edge = (s: number, sign: number): Point => {
    const half = width * Math.sin(Math.PI * s ** peak) ** fullness * sign + curl * length * s * s;
    return [CENTRE[0] + out[0] * length * s + side[0] * half, CENTRE[1] + out[1] * length * s + side[1] * half];
  };
  const steps = 120;
  const one = Array.from({ length: steps + 1 }, (_, i) => edge(i / steps, -1));
  const other = Array.from({ length: steps }, (_, i) => edge(1 - (i + 1) / steps, 1));
  return [...one, ...other];
}

// Inner petals, rounded, between the outer ones: upper left, upper right,
// then down. Outer petals, pointed: up, lower right, lower left.
const INNER = [210, 330, 90].map((angle) => petal(angle, 62, 27, 0.85, 0.7));
const OUTER = [270, 30, 150].map((angle) => petal(angle, 118, 31, 0.75, 0.85, 0.16));

// The runs of a petal's outline that nothing in front of it covers.
function visible(outline: readonly Point[], fronts: readonly (readonly Point[])[]): Point[][] {
  const runs: Point[][] = [];
  let run: Point[] = [];
  for (const point of outline) {
    const hidden =
      Math.hypot(point[0] - CENTRE[0], point[1] - CENTRE[1]) < HEART_CLEAR || fronts.some((front) => inside(point, front));
    if (hidden) {
      if (run.length > 1) runs.push(run);
      run = [];
    } else {
      run.push(point);
    }
  }
  if (run.length > 1) runs.push(run);
  return runs;
}

// `count` stars along a petal's visible runs, shared out by length.
function petalStars(outline: readonly Point[], fronts: readonly (readonly Point[])[], count: number): Point[][] {
  const runs = visible(outline, fronts);
  const lengths = runs.map(lengthOf);
  const sum = lengths.reduce((a, b) => a + b, 0);
  const counts = lengths.map((length) => Math.round((length / sum) * count));
  // Rounding can leave the total one off: settle it on the longest run.
  const longest = lengths.indexOf(Math.max(...lengths));
  counts[longest] += count - counts.reduce((a, b) => a + b, 0);
  return runs.map((run, i) => resample(run, counts[i])).filter((group) => group.length > 0);
}

function heart(count: number): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * i) / count;
    return [CENTRE[0] + HEART_RADIUS * Math.cos(angle), CENTRE[1] + HEART_RADIUS * Math.sin(angle)];
  });
}

const sizeOf = (name: SetName) => SETS.find((set) => set.name === name)?.targets.length ?? 0;
const PER_PETAL = sizeOf('letters') / 3;

// In the sky's order: the heart, the inner petals, the outer petals.
const GROUPS: Point[][] = [
  heart(sizeOf('numbers')),
  ...INNER.flatMap((outline, i) => petalStars(outline, INNER.slice(0, i), PER_PETAL)),
  ...OUTER.flatMap((outline) => petalStars(outline, INNER, sizeOf('both') / 3)),
];

// Every star, a little off its line so the sky looks hand-placed.
const POINTS: readonly Point[] = GROUPS.flat().map(([x, y], i) => [x + 1.2 * jitter(i, 1), y + 1.2 * jitter(i, 2)]);

// Lines along each run of stars and round the heart, and from the ends of
// each run to the nearest star of another part, so the flower is one figure.
const LINKS: readonly (readonly [number, number])[] = (() => {
  const links = new Map<string, [number, number]>();
  const add = (i: number, j: number) => links.set(`${Math.min(i, j)}-${Math.max(i, j)}`, [Math.min(i, j), Math.max(i, j)]);
  const groupOf: number[] = [];
  const ends: number[] = [];
  let start = 0;
  GROUPS.forEach((group, g) => {
    for (let k = 0; k < group.length; k++) groupOf.push(g);
    for (let k = 0; k + 1 < group.length; k++) add(start + k, start + k + 1);
    if (g === 0) add(start + group.length - 1, start);
    else ends.push(start, start + group.length - 1);
    start += group.length;
  });
  const distance = (i: number, j: number) => Math.hypot(POINTS[i][0] - POINTS[j][0], POINTS[i][1] - POINTS[j][1]);
  for (const end of ends) {
    let best = -1;
    for (let j = 0; j < POINTS.length; j++) {
      if (groupOf[j] !== groupOf[end] && (best < 0 || distance(end, j) < distance(end, best))) best = j;
    }
    if (best >= 0 && distance(end, best) < 24) add(end, best);
  }
  return [...links.values()];
})();

// Faint specks of distant stars, which no character lights.
const DUST: readonly Point[] = Array.from({ length: 44 }, (_, i) => [
  (jitter(i, 7) + 0.5) * WIDTH,
  (jitter(i, 8) + 0.5) * HEIGHT,
]);
