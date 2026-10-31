import { useEffect, useRef } from 'react';
import { en } from '../i18n/en';
import { popIn } from '../lib/motion';
import type { Stars } from '../lib/scoring';

// A five-pointed star on a 24 x 24 grid.
export const STAR_PATH = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z';

// A character's best stars, small, for tiles and the trace page: the stars
// earned in star yellow, the rest as faint outlines. With `pop`, the earned
// stars pop in one after another.
export function StarPips({ count, pop = false, className = 'size-3' }: { count: Stars; pop?: boolean; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (pop) ref.current?.querySelectorAll('[data-earned]').forEach((star, i) => popIn(star, 300 + i * 140));
  }, [pop]);
  return (
    <span ref={ref} role="img" aria-label={en.score.stars(count)} className="flex gap-0.5">
      {[1, 2, 3].map((star) => (
        <svg
          key={star}
          data-earned={star <= count ? '' : undefined}
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
