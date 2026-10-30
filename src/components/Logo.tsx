import { MARK_GUIDE, MARK_INK, MARK_TIP, WORDMARK_DOT, WORDMARK_PATH, WORDMARK_STROKE, WORDMARK_VIEWBOX } from '../lib/brand';

// The Aksor icon and wordmark in the theme's colours. Both are decorative:
// whatever shows them also carries the name as text.

export function AppIcon({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className={className}>
      <rect width="100" height="100" rx="24" className="fill-surface" />
      <path d={MARK_GUIDE} fill="none" strokeWidth={5} strokeLinecap="round" strokeDasharray="0 10" className="stroke-fg/45" />
      <path d={MARK_INK} fill="none" strokeWidth={9} strokeLinecap="round" className="stroke-ink" />
      <circle {...MARK_TIP} className="fill-star" />
    </svg>
  );
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox={WORDMARK_VIEWBOX} className={className}>
      <path
        d={WORDMARK_PATH}
        fill="none"
        stroke="currentColor"
        strokeWidth={WORDMARK_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle {...WORDMARK_DOT} className="fill-star" />
    </svg>
  );
}
