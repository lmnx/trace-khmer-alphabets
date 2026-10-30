// Class lists shared by the components. The design is flat: solid colours and
// no shadows. Buttons shrink a little while pressed (the press utility in
// src/index.css), and disabled ones sink into the background.

export const FOCUS = 'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-mint';

const BASE = `press inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 text-base font-semibold ${FOCUS}`;
const DISABLED = 'disabled:cursor-default disabled:bg-sunk disabled:text-fg-faint';

// Undo, Clear and the like.
export const BUTTON = `${BASE} bg-surface text-fg enabled:hover:bg-surface-hover ${DISABLED}`;
// Done: green, for finishing.
export const GO_BUTTON = `${BASE} bg-go text-on-go enabled:hover:brightness-110 ${DISABLED}`;
// Try again: star yellow, for playing again.
export const STAR_BUTTON = `${BASE} bg-star text-on-star hover:brightness-110`;
