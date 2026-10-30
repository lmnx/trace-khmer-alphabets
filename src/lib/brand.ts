// The Aksor logo's shapes, shared by the in-app Logo component and by
// scripts/icons.ts, which writes the static icons in public/.
//
// The mark is ក, the first letter, half traced: a dotted guide, the ink so
// far and a dot where the finger is. It follows Kantumruy Pro's ក, a bar over
// an arch, but is drawn from lines and an arc on a 100 x 100 grid, not copied
// from the font's outlines.

// The whole letter, drawn dotted as the guide.
export const MARK_GUIDE = 'M28 25H72M33 79V57A17 17 0 0 1 67 57V79';
// What is traced so far: the bar, the left leg and half the arch.
export const MARK_INK = 'M28 25H72M33 79V57A17 17 0 0 1 62 45';
// The finger, at the end of the ink.
export const MARK_TIP = { cx: 62, cy: 45, r: 7.5 } as const;

// "aksor" in single strokes of one width, rounded at the ends like the ink,
// on a 206 x 60 grid, with the same dot after it.
export const WORDMARK_VIEWBOX = '0 0 206 60';
export const WORDMARK_STROKE = 8;
export const WORDMARK_PATH = [
  // a
  'M4 40a16 16 0 1 0 32 0a16 16 0 1 0-32 0M36 24V56',
  // k
  'M51 4V56M70 24L51 45M58 37L71 56',
  // s
  'M109 29C106 25 101 24 97 24C91 24 87 27 87 32C87 37 92 39 97 40C103 41 109 43 109 48C109 53 104 56 97 56C91 56 86 54 85 50',
  // o
  'M122 40a16 16 0 1 0 32 0a16 16 0 1 0-32 0',
  // r
  'M170 24V56M170 40C170 30 176 24 187 24',
].join('');
export const WORDMARK_DOT = { cx: 199, cy: 52, r: 6 } as const;
