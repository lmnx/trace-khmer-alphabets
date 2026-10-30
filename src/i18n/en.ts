// All user-facing English text. km.ts follows with the Khmer toggle.
export const en = {
  appTitle: 'Trace the Khmer Alphabet',
  nav: {
    allLetters: 'All letters',
  },
  home: {
    intro: 'Tap a letter to trace it.',
  },
  grid: {
    series: {
      1: 'First series',
      2: 'Second series',
    },
  },
  trace: {
    heading: (order: number) => `Letter ${order}`,
  },
} as const;
