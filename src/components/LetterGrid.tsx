import { useId, type ReactNode } from 'react';
import { letters } from '../data/letters';
import { numerals } from '../data/numerals';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import { glyph, type Form } from '../lib/forms';
import { numberHref, traceHref } from '../lib/router';
import { FormToggle } from './FormToggle';
import { FOCUS } from './styles';

// The numerals ០ to ៩, then all 33 consonants in one block, in the form the
// toggle picks. Each tile shows the character itself, because letter names
// repeat (two "tha", two "tho"). Numbers are star yellow, letters white.
export function LetterGrid({ form }: { form: Form }) {
  const fontReady = useKhmerFontReady();
  return (
    <div className="flex flex-col gap-8">
      <TileSection heading={en.grid.numbers} accent="bg-star">
        {numerals.map((numeral) => (
          <li key={numeral.digit}>
            <Tile
              href={numberHref(numeral.digit)}
              text={numeral.char}
              label={String(numeral.digit)}
              fontReady={fontReady}
              glyphClass="text-star"
            />
          </li>
        ))}
      </TileSection>
      <TileSection heading={en.grid.letters} accent="bg-mint" controls={<FormToggle form={form} fontReady={fontReady} />}>
        {letters.map((letter) => {
          const text = glyph(letter, form);
          return (
            <li key={letter.order}>
              {text === null ? (
                <NoSubscriptTile char={letter.char} fontReady={fontReady} />
              ) : (
                <Tile href={traceHref(letter.order, form)} text={text} label={letter.name} fontReady={fontReady} glyphClass="text-fg" />
              )}
            </li>
          );
        })}
      </TileSection>
    </div>
  );
}

function TileSection({
  heading,
  accent,
  controls,
  children,
}: {
  heading: string;
  accent: string;
  controls?: ReactNode;
  children: ReactNode;
}) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3">
      <h2 id={headingId} className="flex items-center gap-2 text-lg font-bold text-fg">
        <span aria-hidden="true" className={`h-5 w-1.5 rounded-full ${accent}`} />
        {heading}
      </h2>
      {controls}
      {/* At least 4.5rem a tile: four columns at 375 px, never under 64 px. */}
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-3">{children}</ul>
    </section>
  );
}

const TILE = 'flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl pb-2';

function Tile({
  href,
  text,
  label,
  fontReady,
  glyphClass,
}: {
  href: string;
  text: string;
  label: string;
  fontReady: boolean;
  glyphClass: string;
}) {
  return (
    <a href={href} className={`${TILE} press bg-surface hover:bg-surface-hover ${FOCUS}`}>
      <KhmerText text={text} fontReady={fontReady} className={glyphClass} />
      <span className="text-sm leading-none text-fg-muted">{label}</span>
    </a>
  );
}

// ឡ has no subscript form, so in the Subscript view its tile stays in place,
// faded, outlined with dashes and not a link.
function NoSubscriptTile({ char, fontReady }: { char: string; fontReady: boolean }) {
  return (
    <div className={`${TILE} border-2 border-dashed border-line text-fg-faint`}>
      <KhmerText text={char} fontReady={fontReady} className="" />
      <span className="text-sm leading-none">{en.grid.noSubscript}</span>
    </div>
  );
}

function KhmerText({ text, fontReady, className }: { text: string; fontReady: boolean; className: string }) {
  // Hidden until Kantumruy Pro loads, so Khmer never shows in a system font.
  // The font's own line height keeps descenders and subscripts off the label.
  return (
    <span lang="km" className={`text-4xl leading-[normal] ${className} ${fontReady ? '' : 'invisible'}`}>
      {text}
    </span>
  );
}
