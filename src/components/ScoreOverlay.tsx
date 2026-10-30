import { en } from '../i18n/en';
import type { Stars, TraceScore } from '../lib/scoring';

// The canvas paints the letter in these colours after Done. The legend below
// uses the matching Tailwind colours.
export const COVERED_COLOR = '#16a34a'; // green-600
export const MISSED_COLOR = '#dc2626'; // red-600

// The result under the canvas: the score, the stars, a word of praise, what
// the green and red mean, and Try again.
export function ScoreOverlay({ result, onTryAgain }: { result: TraceScore; onTryAgain: () => void }) {
  return (
    <div className="flex w-[min(100%,24rem)] flex-col items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-300">
      <div role="status" className="flex items-center gap-4">
        <p className="text-5xl font-semibold text-stone-900 tabular-nums">{result.score}</p>
        <div className="flex flex-col items-start gap-1">
          <StarRow count={result.stars} />
          <p className="text-lg text-stone-700">{en.score.praise[result.stars]}</p>
        </div>
      </div>
      <ul className="flex gap-4 text-sm text-stone-700">
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-green-600" />
          {en.score.covered}
        </li>
        <li className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-3 rounded-sm bg-red-600" />
          {en.score.missed}
        </li>
      </ul>
      <button
        type="button"
        onClick={onTryAgain}
        className="min-h-12 w-full rounded-xl bg-sky-700 px-4 text-base font-semibold text-white hover:bg-sky-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:bg-sky-900 motion-safe:transition-colors"
      >
        {en.score.tryAgain}
      </button>
    </div>
  );
}

function StarRow({ count }: { count: Stars }) {
  return (
    <div role="img" aria-label={en.score.stars(count)} className="flex gap-1">
      {[1, 2, 3].map((star) => (
        <svg
          key={star}
          aria-hidden="true"
          viewBox="0 0 24 24"
          className={`size-7 ${star <= count ? 'fill-amber-400 stroke-amber-500' : 'fill-stone-200 stroke-stone-300'}`}
          strokeWidth={1.5}
          strokeLinejoin="round"
        >
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </div>
  );
}
