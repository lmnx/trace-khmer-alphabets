import { useEffect, useRef, type Ref } from 'react';
import { en } from '../i18n/en';
import { playChime, playFanfare } from '../lib/audio';
import { burst, useCountUp } from '../lib/motion';
import { useProgress } from '../lib/progress';
import { starsFor, type Stars, type TraceScore } from '../lib/scoring';
import { TIER_GOALS, type ResultStory, type Tier } from '../lib/sky';
import { TierIcon } from './BadgeShelf';
import { ChevronRight, RetryIcon } from './icons';
import { Constellation } from './NightSky';
import { STAR_PATH } from './Stars';
import { GO_BUTTON, STAR_BUTTON } from './styles';

// The result under the canvas. The score counts up, each star pops in as the
// count passes its level, and the word of praise appears at the end, with
// "New best!" when it beats the character's best and a line from the sky.
// Three stars or a new best sends little stars flying from the score. Below,
// a newly lit star pops into the rumduol, and a new badge drops in with
// sparks round it; lighting the last star brings the whole flower in, star by
// star. A chime rings as each star pops in, and a fanfare plays for a new
// badge or the whole sky.
// Then what the green and rose on the letter mean, Try again and Next.
// Screen readers get the final score at once, not the count.
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
  const lit = starsFor(shown);
  useResultSounds(lit, counted, story);
  const reveal = `motion-safe:transition-[opacity,scale] motion-safe:duration-300 ${counted ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`;
  return (
    <div
      ref={ref}
      className="flex w-[min(100%,24rem)] flex-col items-center gap-4 rounded-3xl bg-surface p-4 motion-safe:animate-rise"
    >
      <div role="status" className="flex flex-col items-center gap-3">
        <div className="relative flex items-center gap-4">
          <StarBurst run={counted && (result.stars === 3 || story.newBest)} />
          <p className="sr-only">{en.score.total(result.score)}</p>
          <p aria-hidden="true" className="min-w-[3ch] text-right text-6xl leading-none font-bold text-fg tabular-nums">
            {shown}
          </p>
          <div className="flex flex-col items-start gap-1.5">
            <StarRow count={result.stars} lit={lit} />
            <p className={`text-lg font-semibold text-fg ${reveal}`}>{en.score.praise[result.stars]}</p>
          </div>
        </div>
        {story.newBest && (
          <p className={`rounded-full bg-star px-3 py-1 text-sm font-bold text-on-star ${reveal}`}>{en.score.newBest}</p>
        )}
        <p className={`text-center text-balance text-fg-muted ${reveal}`}>{skyLine(story, result.stars)}</p>
      </div>
      {story.newTiers.length > 0 ? (
        <BadgeEarned tier={story.newTiers[story.newTiers.length - 1]} skyLit={story.skyLit} />
      ) : (
        story.litNow && <StarJoins star={story.star} />
      )}
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

// A chime as each star pops in, climbing star by star, and a fanfare once the
// count ends if the result earned a badge or lit the whole sky. With reduced
// motion the stars all show at once, so their chimes play one after another.
function useResultSounds(lit: Stars, counted: boolean, story: ResultStory) {
  const chimed = useRef(0);
  useEffect(() => {
    const from = chimed.current;
    for (let star = from + 1; star <= lit; star++) playChime(star as Exclude<Stars, 0>, (star - from - 1) * 0.16);
    chimed.current = Math.max(from, lit);
  }, [lit]);

  const celebrate = story.newTiers.length > 0 || story.skyLit;
  const fanfared = useRef(false);
  useEffect(() => {
    if (!counted || !celebrate || fanfared.current) return;
    fanfared.current = true;
    playFanfare(story.skyLit, 0.4);
  }, [counted, celebrate, story.skyLit]);
}

// The line from the sky: what this result did to the character's star,
// which either of a consonant's forms can light.
function skyLine(story: ResultStory, stars: Stars): string {
  const lines = en.score.sky;
  if (story.skyLit) return lines.skyLit;
  if (story.litNow) return lines.lit;
  if (!story.wasLit) return lines.dark;
  if (story.newBest) return lines.brighter;
  // The star was lit by the consonant's other form: this is a first try here.
  if (!story.previous) return stars > 0 ? lines.brighter : lines.shining;
  return lines.stillShines(story.previous.score);
}

// A newly lit star popping into the rumduol.
function StarJoins({ star }: { star: number }) {
  const progress = useProgress();
  return (
    <div className="flex w-full flex-col items-center gap-1 rounded-2xl bg-sunk p-3">
      <Constellation progress={progress} fresh={star} className="max-w-64" />
      <p className="text-sm font-semibold text-star">{en.score.joins}</p>
    </div>
  );
}

// A badge just earned: its icon drops in and sparks fly round it. If the
// result lit the whole sky, the rumduol comes in first, star by star.
function BadgeEarned({ tier, skyLit }: { tier: Tier; skyLit: boolean }) {
  const progress = useProgress();
  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-2xl bg-sunk p-3">
      {skyLit && <Constellation progress={progress} celebrate />}
      <div className="relative">
        <StarBurst run />
        <TierIcon tier={tier} className="w-24 motion-safe:animate-drop" />
      </div>
      <p className="font-bold text-star">{en.score.badgeEarned(en.badges.tiers[tier].name)}</p>
      <p className="text-sm text-fg-muted">{en.badges.tiers[tier].rule(TIER_GOALS[tier])}</p>
    </div>
  );
}

// Little stars that fly out from the score, invisible until they run.
const SPARKS = Array.from({ length: 12 }, (_, i): [number, number] => {
  const angle = (i / 12) * Math.PI * 2 + 0.3;
  const reach = i % 2 ? 70 : 96;
  return [Math.round(Math.cos(angle) * reach), Math.round(Math.sin(angle) * reach * 0.6)];
});

function StarBurst({ run }: { run: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (run) burst(ref.current);
  }, [run]);
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {SPARKS.map(([x, y], i) => (
        <svg key={i} data-spark="" data-x={x} data-y={y} viewBox="0 0 24 24" className={`absolute opacity-0 ${i % 3 ? 'size-3 fill-star' : 'size-4 fill-mint'}`}>
          <path d={STAR_PATH} />
        </svg>
      ))}
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
