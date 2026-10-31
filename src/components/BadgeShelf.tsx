import { useId, type ReactNode } from 'react';
import { en } from '../i18n/en';
import type { Progress } from '../lib/progress';
import { hasTier, TIER_GOALS, TIERS, type Tier } from '../lib/sky';

// The badges, in tiers that grow like a flower: the seed, the bud, the
// rumduol in bloom, and the apsara in her crown of flowers. A badge not yet
// earned is a dashed circle, the mark for what isn't there yet, with its
// tier's name and exactly what earns it.
export function BadgeShelf({ progress }: { progress: Progress }) {
  const headingId = useId();
  const earned = TIERS.filter((tier) => hasTier(progress, tier)).length;
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h2 id={headingId} className="text-lg font-bold text-fg">
          {en.badges.heading}
        </h2>
        <p className="text-sm text-fg-muted">{en.badges.earned(earned, TIERS.length)}</p>
      </div>
      <ul className="grid grid-cols-4 gap-2">
        {TIERS.map((tier) => {
          const has = hasTier(progress, tier);
          return (
            <li
              key={tier}
              data-tier={tier}
              data-earned={has ? '' : undefined}
              className="flex flex-col items-center gap-1 text-center"
            >
              {has ? <TierIcon tier={tier} className="w-full max-w-18" /> : <NotYet className="w-full max-w-18" />}
              <span className={`text-sm leading-tight font-semibold ${has ? 'text-fg' : 'text-fg-muted'}`}>
                {en.badges.tiers[tier].name}
                <span className="sr-only">{has ? en.badges.has : en.badges.notYet}</span>
              </span>
              <span className="text-xs leading-tight text-fg-muted">{en.badges.tiers[tier].rule(TIER_GOALS[tier])}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// A tier's icon, in flat filled shapes on an 80 x 80 grid centred on 0, 0.
// Drawn for the app, not traced from any photo, carving or emblem.
export function TierIcon({ tier, className = '' }: { tier: Tier; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="-40 -40 80 80" className={className}>
      {ICONS[tier]}
    </svg>
  );
}

function NotYet({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="-40 -40 80 80" className={className}>
      <circle r="30" fill="none" strokeWidth={2} strokeDasharray="5 5" className="stroke-line" />
      <path
        d={LOCK}
        transform="translate(-9 -9) scale(0.75)"
        fill="none"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-fg-faint"
      />
    </svg>
  );
}

const LOCK = 'M8 11V8a4 4 0 0 1 8 0v3M7 11h10a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z';

// A line drawn with rounded ends, for stems and sprouts.
function Stroke({ d, width, className }: { d: string; width: number; className: string }) {
  return <path d={d} fill="none" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" className={className} />;
}

// A small three-petalled flower centred on x, y, for the apsara's crown.
function Floret({ x, y, r, petals, heart }: { x: number; y: number; r: number; petals: string; heart: string }) {
  return (
    <g>
      {[0, 120, 240].map((angle) => (
        <ellipse
          key={angle}
          cx={x}
          cy={y - r * 0.55}
          rx={r * 0.42}
          ry={r * 0.62}
          transform={`rotate(${angle} ${x} ${y})`}
          className={petals}
        />
      ))}
      <circle cx={x} cy={y} r={r * 0.3} className={heart} />
    </g>
  );
}

// The rumduol's petals, seen from above: broad pointed outer petals with a
// slight turn, and small rounded inner ones closing over the heart.
const OUTER_PETAL = 'M0 -5C13 -12 12 -30 0 -37C-12 -30 -13 -12 0 -5Z';
const INNER_PETAL = 'M0 1C9 -3 10 -15 0 -19C-10 -15 -9 -3 0 1Z';

const ICONS: Record<Tier, ReactNode> = {
  // A seed in the soil, putting out its first sprout.
  seed: (
    <g>
      <Stroke d="M-27 28Q0 20 27 28" width={3} className="stroke-soil-deep" />
      <path d="M-3 -8C11 -6 16 11 4 21C-10 23 -18 7 -3 -8Z" className="fill-soil" />
      <Stroke d="M-2 -3Q3 8 2 17" width={2} className="stroke-soil-deep" />
      <Stroke d="M-3 -8Q-7 -21 1 -28" width={3} className="stroke-leaf" />
      <path d="M1 -28C7 -33 14 -31 15 -26C9 -22 4 -23 1 -28Z" className="fill-leaf" />
    </g>
  ),
  // A closed bud on a leafy stem.
  bud: (
    <g>
      <Stroke d="M0 33Q3 16 0 2" width={3.5} className="stroke-leaf" />
      <g className="fill-leaf">
        <path d="M1 22C-6 14 -16 14 -21 19C-15 25 -6 26 1 22Z" />
        <path d="M1 12C8 4 18 4 22 9C17 15 8 16 1 12Z" />
      </g>
      <path d="M0 -30C12 -21 13 -6 0 3C-13 -6 -12 -21 0 -30Z" className="fill-star" />
      <path d="M-9 -4C-6 3 -2 4 0 3C2 4 6 3 9 -4C4 0 -4 0 -9 -4Z" className="fill-mint" />
    </g>
  ),
  // The rumduol in bloom.
  bloom: (
    <g>
      {[8, 128, 248].map((angle) => (
        <path key={angle} d={OUTER_PETAL} transform={`rotate(${angle})`} className="fill-star" />
      ))}
      {[60, 180, 300].map((angle) => (
        <path key={angle} d={INNER_PETAL} transform={`rotate(${angle})`} className="fill-cream" />
      ))}
      <circle r="4" className="fill-soil" />
    </g>
  ),
  // The apsara, a celestial dancer, as a bust in a tiered crown hung with
  // flowers, a garland at her neck and one hand raised and bent back. The
  // native-speaker reviewer checks it like all Khmer content.
  apsara: (
    <g>
      <g className="fill-star">
        <path d="M-17 30Q-16 17 -7 14H7Q16 17 17 30Z" />
        <circle cy="-4" r="8" />
        <path d="M-9 -10L-6.5 -17H-4.5L-3.5 -23H-1.8L0 -32L1.8 -23H3.5L4.5 -17H6.5L9 -10Z" />
      </g>
      <Stroke d="M13 17L20 5Q22 -2 27 0" width={4} className="stroke-star" />
      <Floret x={-11} y={-13} r={7} petals="fill-missed" heart="fill-cream" />
      <Floret x={11} y={-13} r={7} petals="fill-mint" heart="fill-cream" />
      <Floret x={0} y={-33} r={5} petals="fill-cream" heart="fill-soil" />
      {[-8, -4, 0, 4, 8].map((x, i) => (
        <circle key={x} cx={x} cy={17 - Math.abs(x) * 0.25} r="2" className={i % 2 ? 'fill-mint' : 'fill-missed'} />
      ))}
    </g>
  ),
};
