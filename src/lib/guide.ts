import { KHMER_FONT_FAMILY } from './fonts';
import { DOTTED_CIRCLE } from './forms';

// Lays out a guide glyph so its ink, not its font box, fills a share of a
// square and sits in the middle. TraceCanvas uses it for the faint letter, and
// masks.ts for the scoring mask at 256 x 256, so both line up.

// How far the ink reaches from the text's origin, as in TextMetrics'
// actualBoundingBox values.
export interface Ink {
  left: number;
  right: number;
  ascent: number;
  descent: number;
}

// Where to draw text: its font size and origin.
export interface Placement {
  fontSize: number;
  x: number;
  y: number;
}

// A placement, plus the glyph's pen width as a share of its font size.
export interface GlyphLayout extends Placement {
  strokeEm: number;
}

const MEASURE_AT = 100;
export const GUIDE_FILL = 0.8;

const COENG = String.fromCodePoint(0x17d2);
// Chrome's canvas doesn't stack a subscript under a dotted circle the way HTML
// text does: ◌្ក comes out side by side. So a subscript is drawn under this
// stand-in letter instead, and the letter is erased, leaving the subscript
// alone. The grid's HTML tiles still show ◌្ក.
const STAND_IN_BASE = 'ក';

// ្រ is the one subscript written before its letter, so in ក្រ the stand-in
// sits after it, not at the start.
const COENG_RO = COENG + 'រ';

// What to draw for a text, and what to erase from it afterwards.
function parts(text: string): { draw: string; erase: string | null; eraseAtEnd: boolean } {
  if (!text.startsWith(DOTTED_CIRCLE + COENG)) return { draw: text, erase: null, eraseAtEnd: false };
  const subscript = text.slice(DOTTED_CIRCLE.length);
  return { draw: STAND_IN_BASE + subscript, erase: STAND_IN_BASE, eraseAtEnd: subscript === COENG_RO };
}

// Kantumruy Pro's pen width as a share of the font size: the median stroke
// thickness, measured at 300 to 400 px. Consonants, numerals and stacks are
// 0.07 (from 0.06 to 0.0725). Subscripts on their own are thinner: 0.06 (from
// 0.047 to 0.07).
export const STROKE_EM = 0.07;
export const SUBSCRIPT_STROKE_EM = 0.06;

// Ink scales with font size, so measuring once at MEASURE_AT is enough.
export function fitGlyph(ink: Ink, size: number, fill = GUIDE_FILL): Placement {
  const scale = (size * fill) / Math.max(ink.left + ink.right, ink.ascent + ink.descent);
  return {
    fontSize: MEASURE_AT * scale,
    x: (size - (ink.left + ink.right) * scale) / 2 + ink.left * scale,
    y: (size - (ink.ascent + ink.descent) * scale) / 2 + ink.ascent * scale,
  };
}

// Call only after the Khmer font has loaded (see useKhmerFontReady).
export function layoutGlyph(ctx: CanvasRenderingContext2D, text: string, size: number): GlyphLayout {
  const strokeEm = parts(text).erase === null ? STROKE_EM : SUBSCRIPT_STROKE_EM;
  return { ...fitGlyph(inkOf(ctx, text), size), strokeEm };
}

// The ink of what is traced, at MEASURE_AT px. Plain text measures itself; a
// subscript, with its stand-in letter erased, is measured from its pixels.
const measured = new Map<string, Ink>();
function inkOf(ctx: CanvasRenderingContext2D, text: string): Ink {
  const known = measured.get(text);
  if (known) return known;
  const { draw, erase } = parts(text);
  let ink: Ink;
  if (erase === null) {
    ctx.font = `${MEASURE_AT}px ${KHMER_FONT_FAMILY}`;
    const metrics = ctx.measureText(draw);
    ink = {
      left: metrics.actualBoundingBoxLeft,
      right: metrics.actualBoundingBoxRight,
      ascent: metrics.actualBoundingBoxAscent,
      descent: metrics.actualBoundingBoxDescent,
    };
  } else {
    ink = inkFromPixels(text);
  }
  measured.set(text, ink);
  return ink;
}

function inkFromPixels(text: string): Ink {
  const side = MEASURE_AT * 4;
  const origin = { x: MEASURE_AT * 1.5, y: MEASURE_AT * 2.5 };
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2D canvas');
  drawTraceable(ctx, text, { fontSize: MEASURE_AT, ...origin });
  const pixels = ctx.getImageData(0, 0, side, side).data;
  let [minX, minY, maxX, maxY] = [side, side, -1, -1];
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      if (pixels[(y * side + x) * 4 + 3] < 128) continue;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  return { left: origin.x - minX, right: maxX + 1 - origin.x, ascent: origin.y - minY, descent: maxY + 1 - origin.y };
}

export function drawGlyph(ctx: CanvasRenderingContext2D, text: string, layout: Placement): void {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${layout.fontSize}px ${KHMER_FONT_FAMILY}`;
  ctx.fillText(text, layout.x, layout.y);
}

// Draws what is to be traced: the text, or for a subscript, the subscript
// alone (drawn under its stand-in letter, which is then erased in place).
export function drawTraceable(ctx: CanvasRenderingContext2D, text: string, layout: Placement): void {
  const { draw, erase, eraseAtEnd } = parts(text);
  drawGlyph(ctx, draw, layout);
  if (erase === null) return;
  // Where the stand-in starts: at the origin, or after a subscript written first.
  const shift = eraseAtEnd ? ctx.measureText(draw).width - ctx.measureText(erase).width : 0;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.globalAlpha = 1;
  drawGlyph(ctx, erase, { ...layout, x: layout.x + shift });
  // Its outline too, so no anti-aliased fringe of the stand-in is left behind.
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.strokeText(erase, layout.x + shift, layout.y);
  ctx.restore();
}

// The guide's stroke width as a share of the square. The learner's ink is
// drawn exactly this wide, so it is never wider than the letter's own strokes.
export function templateStrokeWidth(layout: GlyphLayout, size: number): number {
  return (layout.strokeEm * layout.fontSize) / size;
}
