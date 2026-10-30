import { useId } from 'react';
import { letters, type Series } from '../data/letters';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import { traceHref } from '../lib/router';

const SERIES: readonly Series[] = [1, 2];

// The 33 consonants in two sections, one tile per letter. Each tile shows the
// letter itself, because names repeat (two "tha", two "tho").
export function LetterGrid() {
  const fontReady = useKhmerFontReady();
  return (
    <div className="flex flex-col gap-8">
      {SERIES.map((series) => (
        <SeriesSection key={series} series={series} fontReady={fontReady} />
      ))}
    </div>
  );
}

function SeriesSection({ series, fontReady }: { series: Series; fontReady: boolean }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-lg font-semibold text-stone-800">
        {en.grid.series[series]}
      </h2>
      {/* At least 4.5rem a tile: four columns at 375 px, never under 64 px. */}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-3">
        {letters
          .filter((letter) => letter.series === series)
          .map((letter) => (
            <li key={letter.order}>
              <a
                href={traceHref(letter.order)}
                className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl pb-2 bg-white text-stone-900 shadow-sm ring-1 ring-stone-300 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:bg-stone-200 motion-safe:transition-colors"
              >
                {/* Hidden until Kantumruy Pro loads, so Khmer never shows in a system font.
                    The font's own line height keeps the descenders of ញ and ឡ off the name. */}
                <span lang="km" className={`text-4xl leading-[normal] ${fontReady ? '' : 'invisible'}`}>
                  {letter.char}
                </span>
                <span className="text-sm leading-none text-stone-600">{letter.name}</span>
              </a>
            </li>
          ))}
      </ul>
    </section>
  );
}
