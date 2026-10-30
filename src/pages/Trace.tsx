import { en } from '../i18n/en';
import { homeHref, type TraceTarget } from '../lib/router';

// Phase 2 adds the TraceCanvas here.
export function Trace({ target }: { target: TraceTarget }) {
  const heading = target.kind === 'number' ? en.trace.number(target.digit) : en.trace[target.form](target.order);
  // Back to the grid in the form this letter was opened from.
  const back = homeHref(target.kind === 'letter' ? target.form : 'letter');
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">{heading}</h1>
      <a href={back} className="inline-flex min-h-12 items-center px-4 text-lg text-stone-700 underline">
        {en.nav.allLetters}
      </a>
    </main>
  );
}
