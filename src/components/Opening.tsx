import { useId } from 'react';
import { en } from '../i18n/en';
import { markWelcomed } from '../lib/progress';
import { targetHref, type TraceTarget } from '../lib/router';
import { STAR_BUTTON } from './styles';

// The first visit's opening: a dark sky with one faint star, two lines of
// story, and one button that goes straight to the first star to light.
export function Opening({ first }: { first: TraceTarget }) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col items-center gap-4 rounded-3xl bg-sunk px-5 py-8 text-center motion-safe:animate-rise"
    >
      <svg aria-hidden="true" viewBox="0 0 160 48" className="h-12 w-40">
        {DARK_STARS.map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} className="fill-fg-faint" />
        ))}
        <circle cx="80" cy="24" r="4" className="origin-center fill-star [transform-box:fill-box] motion-safe:animate-twinkle" />
      </svg>
      <h2 id={headingId} className="text-2xl leading-tight font-bold text-balance text-star">
        {en.opening.title}
      </h2>
      {en.opening.lines.map((line) => (
        <p key={line} className="max-w-sm text-lg text-balance text-fg-muted">
          {line}
        </p>
      ))}
      <a href={targetHref(first)} onClick={markWelcomed} className={`${STAR_BUTTON} mt-2 px-6`}>
        {en.opening.start}
      </a>
    </section>
  );
}

// [x, y, r] of the dark stars around the one still shining.
const DARK_STARS = [
  [12, 30, 1.6],
  [34, 12, 2],
  [52, 36, 1.4],
  [108, 10, 1.6],
  [126, 34, 2],
  [148, 18, 1.4],
] as const;
