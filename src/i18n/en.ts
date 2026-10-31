// All user-facing English text. km.ts follows with the Khmer toggle.
export const en = {
  appTitle: 'Aksor',
  // The name in Khmer, អក្សរ ("letters"), shown beside the tagline.
  appTitleKhmer: 'អក្សរ',
  tagline: 'Trace the Khmer Alphabet',
  nav: {
    allLetters: 'All letters',
  },
  home: {
    intro: 'Help us relight the sky. One letter, one star.',
  },
  // The first visit's opening.
  opening: {
    title: 'The stars have gone out',
    lines: [
      'The night sky has gone dark. Every Khmer number and letter was once a star up there.',
      'Trace one well to light its star again. Light the whole sky to earn the Apsara badge.',
    ],
    start: 'Light the first star',
  },
  sky: {
    heading: 'Night sky',
    lit: (lit: number, total: number) => `${lit} of ${total} stars lit`,
    next: 'Next star',
    allLit: 'The whole sky is lit!',
  },
  badge: {
    apsara: 'Apsara badge',
    earned: 'You lit the whole sky.',
    locked: 'Light the whole sky to earn it.',
  },
  grid: {
    numbers: 'Numbers',
    letters: 'Letters',
    formLegend: 'Show letters as',
    forms: {
      letter: 'Letter',
      both: 'Both',
    },
  },
  trace: {
    letter: (order: number) => `Letter ${order}`,
    both: (order: number) => `Letter ${order} with its subscript`,
    number: (digit: number) => `Number ${digit}`,
    previous: 'Previous',
    next: 'Next',
    best: (score: number) => `Best ${score}`,
    notYet: 'No stars yet',
    canvas: 'Tracing area',
    undo: 'Undo',
    clear: 'Clear',
    done: 'Done',
  },
  score: {
    // For screen readers, while the number on screen counts up.
    total: (score: number) => `Score ${score} out of 100.`,
    stars: (count: number) => `${count} of 3 stars`,
    // Indexed by the number of stars.
    praise: ['Keep practising', 'Good try', 'Great', 'Excellent'],
    newBest: 'New best!',
    covered: 'Traced',
    missed: 'Missed',
    tryAgain: 'Try again',
    next: 'Next',
    // A line from the sky after each result.
    sky: {
      dark: 'This star is still dark. One star lights it.',
      lit: 'A star wakes up and joins the constellation!',
      brighter: 'Your star shines brighter!',
      stillShines: (best: number) => `Your star still shines. Your best is ${best}.`,
      skyLit: 'The whole sky is lit again!',
    },
    apsaraEarned: 'You earned the Apsara badge!',
  },
} as const;
