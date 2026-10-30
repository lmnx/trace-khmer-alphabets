import type { Ref } from 'react';
import { en } from '../i18n/en';
import { useCountUp } from '../lib/motion';
import { starsFor, type Stars, type TraceScore } from '../lib/scoring';
import { RetryIcon } from './icons';
import { STAR_BUTTON } from './styles';

// The result under the canvas. The score counts up, each star pops in as the
// count passes its level, and the word of praise appears at the end. Then
// what the green and rose on the letter mean, and Try again. Screen readers
// get the final score at once, not the count.
export function ScoreOverlay({
  result,
  onTryAgain,
  ref,
}: {
  result: TraceScore;
  onTryAgain: () => void;
  ref?: Ref<HTMLDivElement>;
}) {
  const shown = useCountUp(result.score);
  const counted = shown === result.score;
  return (
    <div
      ref={ref}
      className="flex w-[min(100%,24rem)] flex-col items-center gap-4 rounded-3xl bg-surface p-4 motion-safe:animate-rise"
    >
      <div role="status" className="flex items-center gap-4">
        <p className="sr-only">{en.score.total(result.score)}</p>
        <p aria-hidden="true" className="min-w-[3ch] text-right text-6xl leading-none font-bold text-fg tabular-nums">
          {shown}
        </p>
        <div className="flex flex-col items-start gap-1.5">
          <StarRow count={result.stars} lit={starsFor(shown)} />
          <p
            className={`text-lg font-semibold text-fg motion-safe:transition-opacity motion-safe:duration-300 ${counted ? 'opacity-100' : 'opacity-0'}`}
          >
            {en.score.praise[result.stars]}
          </p>
        </div>
      </div>
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
      <button type="button" onClick={onTryAgain} className={`${STAR_BUTTON} w-full`}>
        <RetryIcon />
        {en.score.tryAgain}
      </button>
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
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </div>
  );
}
