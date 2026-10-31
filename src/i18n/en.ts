// All user-facing English text. km.ts follows with the Khmer toggle.
export const en = {
  appTitle: 'Aksor',
  // The name in Khmer, អក្សរ ("letters"), shown beside the tagline.
  appTitleKhmer: 'អក្សរ',
  tagline: 'Trace the Khmer Alphabet',
  // The browser tab's title on each page.
  pageTitle: {
    home: 'Aksor · Trace the Khmer Alphabet',
    page: (name: string) => `${name} · Aksor`,
  },
  nav: {
    allLetters: 'All letters',
    about: 'About Aksor',
  },
  // The sound switch. Pressed means muted.
  sound: {
    mute: 'Mute sound',
  },
  home: {
    intro: 'Help us relight the sky. One letter, one star.',
  },
  // The first visit's opening.
  opening: {
    title: 'The stars have gone out',
    lines: [
      'The night sky has gone dark. Every Khmer number and letter was once a star up there.',
      'Trace one well to light its star again. Earn badges as the sky fills, up to the Apsara.',
    ],
    start: 'Light the first star',
  },
  // The About page. Its credits follow docs/credits.md.
  about: {
    title: 'About Aksor',
    // The name in Khmer goes between these two, in Kantumruy Pro.
    introBefore: 'Aksor (',
    introAfter:
      ', “letters”) helps you learn to write Khmer. Trace the numbers and the 33 consonants, on their own and with their subscripts, and get a score for each.',
    intro: 'Trace one well to light its star, and relight the night sky one letter at a time.',
    credits: {
      heading: 'Credits',
      font: {
        name: 'Font',
        text: 'Kantumruy Pro, by Tep Sovichet and Wei Huang, under the SIL Open Font License 1.1.',
        link: 'Read the licence',
      },
      sounds: { name: 'Sounds', text: 'Made in code for Aksor. No recordings or samples.' },
      art: { name: 'Art', text: 'The logo, icons, night sky and badges were drawn for Aksor.' },
      review: {
        name: 'Khmer review',
        text: 'Every number, consonant, subscript and badge was checked by Kim, a native Khmer speaker.',
      },
    },
    privacy: {
      heading: 'Your privacy',
      lines: [
        'No accounts, no ads and no tracking.',
        'Your stars are saved only in this browser, on this device. Clearing the site’s data clears them.',
      ],
    },
    source: {
      heading: 'Source code',
      text: 'Aksor is open source.',
      link: 'See the code on GitHub',
    },
  },
  sky: {
    heading: 'Night sky',
    lit: (lit: number, total: number) => `${lit} of ${total} stars lit`,
    next: 'Next star',
    allLit: 'The whole sky is lit!',
  },
  badges: {
    heading: 'Badges',
    earned: (earned: number, total: number) => `${earned} of ${total} earned`,
    has: ', earned',
    notYet: ', not earned yet',
    tiers: {
      seed: { name: 'Seed', rule: (goal: number) => `All ${goal} numbers` },
      bud: { name: 'Bud', rule: (goal: number) => `Any ${goal} characters` },
      bloom: { name: 'Rumduol', rule: (goal: number) => `All ${goal} characters` },
      apsara: { name: 'Apsara', rule: (goal: number) => `3 stars on all ${goal}` },
    },
  },
  grid: {
    numbers: 'Numbers',
    letters: 'Consonants',
    switchLabel: 'Show each consonant with its subscript',
    forms: {
      letter: 'Base consonant',
      both: 'Consonant + subscript',
    },
  },
  trace: {
    letter: (order: number) => `Consonant ${order}`,
    both: (order: number) => `Consonant ${order} + subscript`,
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
      lit: 'A star wakes up in the sky!',
      brighter: 'Your star shines brighter!',
      stillShines: (best: number) => `Your star still shines. Your best is ${best}.`,
      shining: 'Your star still shines.',
      skyLit: 'The whole sky is lit again!',
    },
    badgeEarned: (name: string) => `${name} badge earned!`,
    joins: 'Your star joins the rumduol',
  },
} as const;
