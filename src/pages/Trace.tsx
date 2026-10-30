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
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center gap-3 py-4 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]">
      <nav className="w-full">
        <a href={back} className="inline-flex min-h-12 items-center text-lg text-stone-700 underline">
          {en.nav.allLetters}
        </a>
      </nav>
      <div className="flex w-full items-center justify-between gap-2">
        <StepLink href={previous} label={en.trace.previous} direction="previous" />
        <h1 className="text-center text-xl font-semibold text-stone-900">{heading(target)}</h1>
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
// end it stays in place as a faint, inert arrow so the heading doesn't shift.
function StepLink({ href, label, direction }: { href: string | null; label: string; direction: 'previous' | 'next' }) {
  const box = 'flex size-12 shrink-0 items-center justify-center rounded-full';
  const chevron = (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={direction === 'previous' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
  if (href === null) return <span className={`${box} text-stone-300`}>{chevron}</span>;
  return (
    <a
      href={href}
      aria-label={label}
      className={`${box} bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:bg-stone-200 motion-safe:transition-colors`}
    >
      {chevron}
    </a>
  );
}
