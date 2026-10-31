import { en } from '../i18n/en';
import type { Stars } from '../lib/scoring';

// A five-pointed star on a 24 x 24 grid.
export const STAR_PATH = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';

// A character's best stars, small, for tiles and the trace page: the stars
// earned in star yellow, the rest as faint outlines.
export function StarPips({ count, className = 'size-3' }: { count: Stars; className?: string }) {
  return (
    <span role="img" aria-label={en.score.stars(count)} className="flex gap-0.5">
      {[1, 2, 3].map((star) => (
        <svg
          key={star}
          aria-hidden="true"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          strokeLinejoin="round"
          className={`${className} ${star <= count ? 'fill-star stroke-star' : 'fill-none stroke-fg-faint'}`}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}
