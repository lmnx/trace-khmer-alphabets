import { AboutLink } from '../components/AboutLink';
import { ChevronLeft, ChevronRight, GridIcon } from '../components/icons';
import { AppIcon } from '../components/Logo';
import { SoundToggle } from '../components/SoundToggle';
import { StarPips } from '../components/Stars';
import { FOCUS } from '../components/styles';
import { TraceCanvas } from '../components/TraceCanvas';
import { letters } from '../data/letters';
import { en } from '../i18n/en';
import { markFreshStar, markFreshTile } from '../lib/fresh';
import { usePage } from '../lib/page';
import { getProgress, recordResult, useProgress } from '../lib/progress';
import { homeHref, targetHref, type TraceTarget } from '../lib/router';
import type { TraceScore } from '../lib/scoring';
import { bestOf, resultStory, starsOf, type ResultStory } from '../lib/sky';
import { neighbours, targetKey, targetText } from '../lib/targets';

// The trace page. Every result is saved, keeping the character's best, and
// its first star lights the character's star in the night sky.
export function Trace({ target }: { target: TraceTarget }) {
  // Back to the grid in the form this letter was opened from.
  const back = homeHref(target.kind === 'letter' ? target.form : 'letter');
  const { previous, next } = neighbours(target);
  const nextHref = next ? targetHref(next) : null;
  const title = heading(target);
  usePage(en.pageTitle.page(title));

  // Saves the result, and notes what it earned for the home page to show off:
  // a newly lit star in the sky, and a tile whose stars went up.
  function onScore(result: TraceScore): ResultStory {
    const before = getProgress();
    recordResult(target, result.score, result.stars);
    const after = getProgress();
    const story = resultStory(before, after, target);
    if (story.litNow) markFreshStar(story.star);
    if (starsOf(after, target) > starsOf(before, target)) markFreshTile(targetKey(target));
    return story;
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center gap-3 pt-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(1.5rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] motion-safe:animate-enter">
      <nav className="flex w-full items-center justify-between">
        <a
          href={back}
          className={`press inline-flex min-h-12 items-center gap-2 rounded-full bg-surface pr-5 pl-4 text-base font-semibold text-fg hover:bg-surface-hover ${FOCUS}`}
        >
          <GridIcon />
          {en.nav.allLetters}
        </a>
        <div className="flex items-center gap-2">
          <AboutLink />
          <SoundToggle />
          <AppIcon className="size-10" />
        </div>
      </nav>
      <div className="flex w-full items-center justify-between gap-2">
        <StepLink href={previous ? targetHref(previous) : null} label={en.trace.previous} direction="previous" />
        <div className="flex flex-col items-center gap-0.5">
          <h1 tabIndex={-1} className="text-center text-xl font-bold text-fg outline-none">
            {title}
          </h1>
          <BestLine target={target} />
        </div>
        <StepLink href={nextHref} label={en.trace.next} direction="next" />
      </div>
      {/* Keyed by the target, so moving to another character starts with no strokes. */}
      <TraceCanvas key={targetHref(target)} text={targetText(target)} onScore={onScore} next={nextHref} />
    </main>
  );
}

function heading(target: TraceTarget): string {
  if (target.kind === 'number') return en.trace.number(target.digit);
  // ឡ opened from Both is the letter alone, since it has no subscript.
  const form = target.form === 'both' && !letters[target.order - 1].subscript ? 'letter' : target.form;
  return en.trace[form](target.order);
}

// Under the heading: the character's best stars and score so far.
function BestLine({ target }: { target: TraceTarget }) {
  const best = bestOf(useProgress(), target);
  return (
    <p className="flex items-center gap-1.5 text-sm text-fg-muted">
      <StarPips count={best?.stars ?? 0} />
      {best ? en.trace.best(best.score) : en.trace.notYet}
    </p>
  );
}

// A round arrow to the previous or next character in the same set. At either
// end it stays in place as a faint, dashed, inert circle so the heading
// doesn't shift.
function StepLink({ href, label, direction }: { href: string | null; label: string; direction: 'previous' | 'next' }) {
  const box = 'flex size-12 shrink-0 items-center justify-center rounded-full';
  const chevron = direction === 'previous' ? <ChevronLeft /> : <ChevronRight />;
  if (href === null) return <span className={`${box} border-2 border-dashed border-line text-fg-faint`}>{chevron}</span>;
  return (
    <a href={href} aria-label={label} className={`${box} press bg-surface text-fg hover:bg-surface-hover ${FOCUS}`}>
      {chevron}
    </a>
  );
}
