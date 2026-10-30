// All user-facing English text. km.ts follows with the Khmer toggle.
export const en = {
  appTitle: 'Trace the Khmer Alphabet',
  nav: {
    allLetters: 'All letters',
  },
  home: {
    intro: 'Tap a number or letter to trace it.',
  },
  grid: {
    numbers: 'Numbers',
    letters: 'Letters',
    formLegend: 'Show letters as',
    forms: {
      letter: 'Letter',
      subscript: 'Subscript',
      both: 'Both',
    },
    noSubscript: 'none',
  },
  trace: {
    letter: (order: number) => `Letter ${order}`,
    subscript: (order: number) => `Subscript of letter ${order}`,
    both: (order: number) => `Letter ${order} with its subscript`,
    number: (digit: number) => `Number ${digit}`,
    previous: 'Previous',
    next: 'Next',
    canvas: 'Tracing area',
    undo: 'Undo',
    clear: 'Clear',
    done: 'Done',
  },
} as const;
