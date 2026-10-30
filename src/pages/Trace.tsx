import { ChevronLeft, ChevronRight, GridIcon } from '../components/icons';
import { AppIcon } from '../components/Logo';
import { FOCUS } from '../components/styles';
import { TraceCanvas } from '../components/TraceCanvas';
import { letters } from '../data/letters';
import { en } from '../i18n/en';
import { homeHref, targetHref, type TraceTarget } from '../lib/router';
import { neighbours, targetText } from '../lib/targets';

export function Trace({ target }: { target: TraceTarget }) {
  // Back to the grid in the form this letter was opened from.
  const back = homeHref(target.kind === 'letter' ? target.form : 'letter');
  const { previous, next } = neighbours(target);
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
        <AppIcon className="size-10" />
      </nav>
      <div className="flex w-full items-center justify-between gap-2">
        <StepLink href={previous} label={en.trace.previous} direction="previous" />
        <h1 className="text-center text-xl font-bold text-fg">{heading(target)}</h1>
        <StepLink href={next} label={en.trace.next} direction="next" />
      </div>
      {/* Keyed by the target, so moving to another character starts with no strokes. */}
      <TraceCanvas key={targetHref(target)} text={targetText(target)} />
    </main>
  );
}

function heading(target: TraceTarget): string {
  if (target.kind === 'number') return en.trace.number(target.digit);
  // ឡ opened from Both is the letter alone, since it has no subscript.
  const form = target.form === 'both' && !letters[target.order - 1].subscript ? 'letter' : target.form;
  return en.trace[form](target.order);
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
