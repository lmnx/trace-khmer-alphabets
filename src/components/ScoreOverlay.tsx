import type { Ref } from 'react';
import { en } from '../i18n/en';
import { useCountUp } from '../lib/motion';
import { useProgress } from '../lib/progress';
import { starsFor, type Stars, type TraceScore } from '../lib/scoring';
import type { ResultStory } from '../lib/sky';
import { ApsaraBadge } from './BadgeShelf';
import { ChevronRight, RetryIcon } from './icons';
import { Constellation } from './NightSky';
import { STAR_PATH } from './Stars';
import { GO_BUTTON, STAR_BUTTON } from './styles';

// The result under the canvas. The score counts up, each star pops in as the
// count passes its level, and the word of praise appears at the end, with
// "New best!" when it beats the character's best and a line from the sky.
// Lighting the last star brings the whole constellation in, star by star,
// and the Apsara badge. Then what the green and rose on the letter mean, Try
// again and Next. Screen readers get the final score at once, not the count.
export function ScoreOverlay({
  result,
  story,
  next,
  onTryAgain,
  ref,
}: {
  result: TraceScore;
  story: ResultStory;
  next: string | null;
  onTryAgain: () => void;
  ref?: Ref<HTMLDivElement>;
}) {
  const shown = useCountUp(result.score);
  const counted = shown === result.score;
  const reveal = `motion-safe:transition-[opacity,scale] motion-safe:duration-300 ${counted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`;
  return (
    <div
      ref={ref}
      className="flex w-[min(100%,24rem)] flex-col items-center gap-4 rounded-3xl bg-surface p-4 motion-safe:animate-rise"
    >
      <div role="status" className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-4">
          <p className="sr-only">{en.score.total(result.score)}</p>
          <p aria-hidden="true" className="min-w-[3ch] text-right text-6xl leading-none font-bold text-fg tabular-nums">
            {shown}
          </p>
          <div className="flex flex-col items-start gap-1.5">
            <StarRow count={result.stars} lit={starsFor(shown)} />
            <p className={`text-lg font-semibold text-fg ${reveal}`}>{en.score.praise[result.stars]}</p>
          </div>
        </div>
        {story.newBest && (
          <p className={`rounded-full bg-star px-3 py-1 text-sm font-bold text-on-star ${reveal}`}>{en.score.newBest}</p>
        )}
        <p className={`text-center text-balance text-fg-muted ${reveal}`}>{skyLine(story)}</p>
      </div>
      {story.skyLit && <SkyLit />}
      <ul className="flex gap-5 text-sm text-fg-muted">
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-full bg-covered" />
          {en.score.covered}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true" className="size-3 rounded-full bg-missed" />
          {en.score.missed}
        </li>
      </ul>
      <div className={`grid w-full gap-2 ${next ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <button type="button" onClick={onTryAgain} className={STAR_BUTTON}>
          <RetryIcon />
          {en.score.tryAgain}
        </button>
        {next && (
          <a href={next} className={GO_BUTTON}>
            {en.score.next}
            <ChevronRight />
          </a>
        )}
      </div>
    </div>
  );
}

// The line from the sky: what this result did to the character's star.
function skyLine(story: ResultStory): string {
  const lines = en.score.sky;
  if (story.skyLit) return lines.skyLit;
  if (story.litNow) return lines.lit;
  // Not lit before, and still no star.
  if (!story.previous || story.previous.stars === 0) return lines.dark;
  return story.newBest ? lines.brighter : lines.stillShines(story.previous.score);
}

// The finale: the whole constellation lit, popping in star by star, and
// the Apsara badge.
function SkyLit() {
  const progress = useProgress();
  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-2xl bg-sunk p-3">
      <Constellation progress={progress} celebrate />
      <ApsaraBadge celebrate className="size-24 motion-safe:animate-pop" />
      <p className="font-bold text-star">{en.score.apsaraEarned}</p>
    </div>
  );
}

// The stars earned, named for screen readers by the final count. `lit` is how
// many the count on screen has reached so far.
function StarRow({ count, lit }: { count: Stars; lit: Stars }) {
  return (
    <div role="img" aria-label={en.score.stars(count)} className="flex gap-1">
      {[1, 2, 3].map((star) => (
        <svg
          key={star}
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          strokeLinejoin="round"
          className={`size-9 ${star <= lit ? 'scale-100 rotate-0 fill-star stroke-star' : 'scale-75 -rotate-12 fill-sunk stroke-fg-faint'} motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.34,1.8,0.64,1)]`}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}
