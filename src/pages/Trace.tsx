import { en } from '../i18n/en';
import { homeHref } from '../lib/router';

// Phase 2 adds the TraceCanvas here.
export function Trace({ order }: { order: number }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">{en.trace.heading(order)}</h1>
      <a href={homeHref} className="inline-flex min-h-12 items-center px-4 text-lg text-stone-700 underline">
        {en.nav.allLetters}
      </a>
    </main>
  );
}
