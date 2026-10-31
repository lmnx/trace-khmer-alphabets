import type { MouseEvent } from 'react';
import { letters } from '../data/letters';
import { en } from '../i18n/en';
import { glyph, type Form } from '../lib/forms';
import { showHome } from '../lib/router';
import { FOCUS } from './styles';

// Base consonant or consonant + subscript, as one switch. Each side shows ក
// in its form, so it reads without knowing the words, and the side that is on
// lights up in mint. Tapping a side picks it; tapping the track flips it.
export function FormToggle({ form, fontReady }: { form: Form; fontReady: boolean }) {
  const both = form === 'both';
  function choose(event: MouseEvent<HTMLButtonElement>) {
    const side = (event.target as HTMLElement).closest<HTMLElement>('[data-side]')?.dataset.side;
    showHome(side === 'letter' || side === 'both' ? side : both ? 'letter' : 'both');
  }
  return (
    <button
      type="button"
      role="switch"
      aria-checked={both}
      aria-label={en.grid.switchLabel}
      onClick={choose}
      className={`flex min-h-16 w-full items-center gap-3 rounded-2xl bg-sunk px-3 py-2 ${FOCUS}`}
    >
      <Side form="letter" on={!both} fontReady={fontReady} />
      <span
        aria-hidden="true"
        className={`relative h-8 w-14 shrink-0 rounded-full ${both ? 'bg-mint' : 'bg-line'} motion-safe:transition-colors`}
      >
        <span
          className={`absolute top-1 left-1 size-6 rounded-full bg-fg ${both ? 'translate-x-6' : 'translate-x-0'} motion-safe:transition-transform`}
        />
      </span>
      <Side form="both" on={both} fontReady={fontReady} />
    </button>
  );
}

function Side({ form, on, fontReady }: { form: Form; on: boolean; fontReady: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-side={form}
      className={`flex flex-1 flex-col items-center gap-0.5 text-center text-sm leading-tight font-semibold ${on ? 'text-mint' : 'text-fg-muted'} motion-safe:transition-colors`}
    >
      <span lang="km" className={`text-2xl leading-[normal] ${fontReady ? '' : 'invisible'}`}>
        {glyph(letters[0], form)}
      </span>
      {en.grid.forms[form]}
    </span>
  );
}
