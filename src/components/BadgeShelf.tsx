import { useEffect, useRef } from 'react';
import { en } from '../i18n/en';
import { sparkle } from '../lib/motion';
import { LockIcon } from './icons';

// The Apsara badge, the reward for lighting the whole sky. Until then its
// place is a dashed circle, the mark for what isn't there yet.
export function BadgeShelf({ earned }: { earned: boolean }) {
  return (
    <section className="flex items-center gap-4 px-1">
      {earned ? (
        <ApsaraBadge className="size-20 shrink-0" />
      ) : (
        <span className="flex size-20 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-line text-fg-faint">
          <LockIcon className="size-7" />
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <h2 className={`text-lg font-bold ${earned ? 'text-star' : 'text-fg'}`}>{en.badge.apsara}</h2>
        <p className="text-fg-muted">{earned ? en.badge.earned : en.badge.locked}</p>
      </div>
    </section>
  );
}

// An apsara, a celestial dancer, on a round badge ringed with stars. Drawn
// for the app in the logo's style, single rounded strokes and flat shapes on
// a 100 x 100 grid, and not traced from any carving, photo or emblem. The
// native-speaker reviewer checks it like all Khmer content. With `celebrate`,
// the ring of stars pops in.
export function ApsaraBadge({ className = '', celebrate = false }: { className?: string; celebrate?: boolean }) {
  const svgRef = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (celebrate) sparkle(svgRef.current, 60);
  }, [celebrate]);
  return (
    <svg ref={svgRef} aria-hidden="true" viewBox="0 0 100 100" className={className}>
      <circle cx="50" cy="50" r="50" className="fill-sunk" />
      {RING.map(([x, y], i) => (
        <path key={i} data-star="" d={sparklePath(x, y, i % 2 ? 2.2 : 3.6)} className="origin-center fill-star [transform-box:fill-box]" />
      ))}
      {/* The crown, the head, the bodice and the skirt. */}
      <g className="fill-star">
        <path d={CROWN} />
        <circle cx="50" cy="27.6" r="5" />
        <path d={BODICE} />
        <path d={SKIRT} />
      </g>
      {/* The collar, the belt and the skirt's front pleat, cut out. */}
      <path d={CUTS} fill="none" strokeWidth={1.4} strokeLinecap="round" className="stroke-sunk" />
      <g fill="none" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round" className="stroke-star">
        <path d={ARMS} />
        <path d={LEGS} />
      </g>
    </svg>
  );
}

// A tiered crown rising to a spire.
const CROWN = 'M45.2 23.8L46.4 19.6H47.6L48.3 14.6H49L50 5L51 14.6H51.7L52.4 19.6H53.6L54.8 23.8Z';
// Narrow at the waist.
const BODICE = 'M44.2 36.6Q50 34 55.8 36.6Q54 43.5 52.7 50.2H47.3Q46 43.5 44.2 36.6Z';
// The sampot, fitted at the hips, with its front pleat fanning out below.
const SKIRT = 'M47.2 49.4H52.8Q58.6 55.5 57.8 65.6Q50 68.2 42.2 65.6Q41.4 55.5 47.2 49.4ZM47.6 66.4L50 72L52.4 66.4Z';
const CUTS = 'M45.6 37.2Q50 40.4 54.4 37.2M47.4 52.2H52.6M50 54.2V66.6';
// Both arms bent, the hands bent back at the wrist: one raised beside the
// head, the other held out at the shoulder.
const ARMS =
  'M55.6 38.2Q61.2 38.8 64.4 35.6Q66.6 31 65.4 25.6C65.4 22.4 67.6 20.8 70 21.8' +
  'M44.4 38.2Q39.2 41.6 36.2 44.6Q32.8 42.6 30.6 39.2C28.8 37 28.8 34.6 31 33.8';
// Knees bent out: the weight on one foot, the other leg lifted to the side
// with the foot flexed up.
const LEGS = 'M46.6 65.8Q42.4 70.4 41.8 76.4Q42.4 82.4 45 87.4L40.4 89M53.8 65.4Q60.4 62.2 65 63.6Q63.4 70.4 61.6 75.6Q64.6 74.6 66 71.4';

// A four-pointed sparkle centred on (x, y).
function sparklePath(x: number, y: number, r: number): string {
  return `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z`;
}

// Eight stars round the edge, big and small in turn, clear of the crown.
const RING = Array.from({ length: 8 }, (_, i): [number, number] => {
  const angle = (Math.PI * 2 * i) / 8 - Math.PI / 2 + Math.PI / 8;
  return [50 + 41 * Math.cos(angle), 50 + 41 * Math.sin(angle)];
});
