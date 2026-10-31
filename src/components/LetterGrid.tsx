import { useId, type ReactNode } from 'react';
import { letters } from '../data/letters';
import { numerals } from '../data/numerals';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import { freshTile } from '../lib/fresh';
import { glyph, type Form } from '../lib/forms';
import type { Best, Progress } from '../lib/progress';
import { targetHref, type TraceTarget } from '../lib/router';
import { bestOf, nextStar } from '../lib/sky';
import { targetKey } from '../lib/targets';
import { FormToggle } from './FormToggle';
import { KhmerText } from './KhmerText';
import { StarPips } from './Stars';
import { FOCUS } from './styles';

// The numerals ០ to ៩, then all 33 consonants in one block, in the form the
// toggle picks. Each tile shows the character itself, because letter names
// repeat (two "tha", two "tho"). Numbers are star yellow, letters white.
// Every tile is open. A tile shows its best stars once traced, and the next
// star the sky suggests is ringed in star yellow.
export function LetterGrid({ form, progress }: { form: Form; progress: Progress }) {
  const fontReady = useKhmerFontReady();
  const next = nextStar(progress);
  const isNext = (target: TraceTarget) => next !== null && targetKey(next) === targetKey(target);
  // The tile whose stars just went up shows them popping in.
  const fresh = freshTile();

  function tile(target: TraceTarget, text: string, label: string, glyphClass: string) {
    return (
      <Tile
        href={targetHref(target)}
        text={text}
        label={label}
        best={bestOf(progress, target)}
        next={isNext(target)}
        fresh={fresh === targetKey(target)}
        fontReady={fontReady}
        glyphClass={glyphClass}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <TileSection heading={en.grid.numbers} accent="bg-star">
        {numerals.map((numeral) => (
          <li key={numeral.digit}>
            {tile({ kind: 'number', digit: numeral.digit }, numeral.char, String(numeral.digit), 'text-star')}
          </li>
        ))}
      </TileSection>
      <TileSection
        heading={en.grid.letters}
        accent="bg-mint"
        controls={<FormToggle form={form} fontReady={fontReady} />}
      >
        {letters.map((letter) => (
          <li key={letter.order}>
            {tile({ kind: 'letter', order: letter.order, form }, glyph(letter, form), letter.name, 'text-fg')}
          </li>
        ))}
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
  best,
  next,
  fresh,
  fontReady,
  glyphClass,
}: {
  href: string;
  text: string;
  label: string;
  best: Best | null;
  next: boolean;
  fresh: boolean;
  fontReady: boolean;
  glyphClass: string;
}) {
  return (
    <a
      href={href}
      data-next={next ? '' : undefined}
      className={`${TILE} press bg-surface hover:bg-surface-hover ${next ? 'ring-3 ring-star ring-inset' : ''} ${FOCUS}`}
    >
      <TileGlyph text={text} fontReady={fontReady} className={glyphClass} />
      {/* The best stars sit beside the label, clear of tall characters. */}
      <span className="flex items-center gap-1 text-sm leading-none text-fg-muted">
        {label}
        {best && <StarPips count={best.stars} pop={fresh} className="size-2.5" />}
      </span>
    </a>
  );
}

// The font's own line height keeps descenders and stacked subscripts off the
// label.
function TileGlyph({ text, fontReady, className = '' }: { text: string; fontReady: boolean; className?: string }) {
  return <KhmerText text={text} fontReady={fontReady} className={`text-4xl leading-[normal] ${className}`} />;
}
