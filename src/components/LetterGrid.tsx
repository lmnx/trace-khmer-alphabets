import { useId, type ReactNode } from 'react';
import { letters } from '../data/letters';
import { numerals } from '../data/numerals';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import { glyph, type Form } from '../lib/forms';
import { numberHref, traceHref } from '../lib/router';
import { FormToggle } from './FormToggle';

// The numerals ០ to ៩, then all 33 consonants in one block, in the form the
// toggle picks. Each tile shows the character itself, because letter names
// repeat (two "tha", two "tho").
export function LetterGrid({ form }: { form: Form }) {
  const fontReady = useKhmerFontReady();
  return (
    <div className="flex flex-col gap-8">
      <TileSection heading={en.grid.numbers}>
        {numerals.map((numeral) => (
          <li key={numeral.digit}>
            <Tile href={numberHref(numeral.digit)} text={numeral.char} label={String(numeral.digit)} fontReady={fontReady} />
          </li>
        ))}
      </TileSection>
      <TileSection heading={en.grid.letters} controls={<FormToggle form={form} fontReady={fontReady} />}>
        {letters.map((letter) => {
          const text = glyph(letter, form);
          return (
            <li key={letter.order}>
              {text === null ? (
                <NoSubscriptTile char={letter.char} fontReady={fontReady} />
              ) : (
                <Tile href={traceHref(letter.order, form)} text={text} label={letter.name} fontReady={fontReady} />
              )}
            </li>
          );
        })}
      </TileSection>
    </div>
  );
}

function TileSection({ heading, controls, children }: { heading: string; controls?: ReactNode; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="text-lg font-semibold text-stone-800">
        {heading}
      </h2>
      {controls}
      {/* At least 4.5rem a tile: four columns at 375 px, never under 64 px. */}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-3">{children}</ul>
    </section>
  );
}

const TILE = 'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl pb-2';

function Tile({ href, text, label, fontReady }: { href: string; text: string; label: string; fontReady: boolean }) {
  return (
    <a
      href={href}
      className={`${TILE} bg-white text-stone-900 shadow-sm ring-1 ring-stone-300 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 active:bg-stone-200 motion-safe:transition-colors`}
    >
      <KhmerText text={text} fontReady={fontReady} />
      <span className="text-sm leading-none text-stone-600">{label}</span>
    </a>
  );
}

// ឡ has no subscript form, so in the Subscript and Both views its tile stays
// in place, greyed out and not a link.
function NoSubscriptTile({ char, fontReady }: { char: string; fontReady: boolean }) {
  return (
    <div className={`${TILE} bg-stone-100 text-stone-400 ring-1 ring-stone-200`}>
      <KhmerText text={char} fontReady={fontReady} />
      <span className="text-sm leading-none text-stone-500">{en.grid.noSubscript}</span>
    </div>
  );
}

function KhmerText({ text, fontReady }: { text: string; fontReady: boolean }) {
  // Hidden until Kantumruy Pro loads, so Khmer never shows in a system font.
  // The font's own line height keeps descenders and subscripts off the label.
  return (
    <span lang="km" className={`text-4xl leading-[normal] ${fontReady ? '' : 'invisible'}`}>
      {text}
    </span>
  );
}
