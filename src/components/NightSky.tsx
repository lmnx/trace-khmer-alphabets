import { useEffect, useId, useRef } from 'react';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import { freshStar } from '../lib/fresh';
import { popIn, sparkle } from '../lib/motion';
import type { Progress } from '../lib/progress';
import { targetHref, type TraceTarget } from '../lib/router';
import { DUST, HEIGHT, LINKS, POINTS, WIDTH } from '../lib/rumduol';
import { isStarLit, litCount, nextStar, SKY, starIndex, starOf } from '../lib/sky';
import { targetText } from '../lib/targets';
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
      {/* The star the learner just lit pops again on the way back. */}
      <Constellation progress={progress} next={next} fresh={freshStar()} />
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

// The constellation: a rumduol flower, one star per number and consonant in
// the sky's order, joined by lines that follow the flower's outline and light
// once the stars at both ends are lit. The star of `next` twinkles in mint,
// the `fresh` star (its place in SKY) pops in, and with `celebrate` every star
// pops in one after another.
export function Constellation({
  progress,
  next = null,
  fresh = null,
  celebrate = false,
  className = '',
}: {
  progress: Progress;
  next?: TraceTarget | null;
  fresh?: number | null;
  celebrate?: boolean;
  className?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (celebrate) sparkle(svgRef.current, 12);
  }, [celebrate]);
  useEffect(() => {
    if (fresh !== null) popIn(svgRef.current?.querySelector(`[data-index="${fresh}"]`) ?? null, 250);
  }, [fresh]);
  const lit = SKY.map((star) => isStarLit(progress, star));
  const nextIndex = next ? starIndex(starOf(next)) : -1;
  return (
    <svg ref={svgRef} aria-hidden="true" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className={`h-auto w-full ${className}`}>
      {DUST.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={0.7} className="fill-fg-faint/40" />
      ))}
      {LINKS.map(({ i, j, path }) => (
        <polyline
          key={`${i}-${j}`}
          points={path.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')}
          fill="none"
          strokeWidth={lit[i] && lit[j] ? 1.2 : 0.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={lit[i] && lit[j] ? 'stroke-star/55' : 'stroke-line'}
        />
      ))}
      {POINTS.map(([x, y], i) => (
        <circle
          key={i}
          data-star=""
          data-index={i}
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
