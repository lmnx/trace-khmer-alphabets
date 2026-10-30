import { KHMER_FONT_FAMILY } from './fonts';

// Lays out a guide glyph so its ink, not its font box, fills a share of a
// square and sits in the middle. TraceCanvas uses it for the faint letter, and
// Phase 3's scoring mask will use it at 256 x 256, so both line up.

// How far the ink reaches from the text's origin, as in TextMetrics'
// actualBoundingBox values.
export interface Ink {
  left: number;
  right: number;
  ascent: number;
  descent: number;
}

export interface GlyphLayout {
  fontSize: number;
  x: number;
  y: number;
}

const MEASURE_AT = 100;
export const GUIDE_FILL = 0.8;

// Kantumruy Pro's pen width as a share of the font size: the median stroke
// thickness of the consonants and numerals, measured at 400 px (they range
// from 0.06 to 0.0725, and subscripts sit near 0.065).
export const STROKE_EM = 0.07;

// Ink scales with font size, so measuring once at MEASURE_AT is enough.
export function fitGlyph(ink: Ink, size: number, fill = GUIDE_FILL): GlyphLayout {
  const scale = (size * fill) / Math.max(ink.left + ink.right, ink.ascent + ink.descent);
  return {
    fontSize: MEASURE_AT * scale,
    x: (size - (ink.left + ink.right) * scale) / 2 + ink.left * scale,
    y: (size - (ink.ascent + ink.descent) * scale) / 2 + ink.ascent * scale,
  };
}

// Call only after the Khmer font has loaded (see useKhmerFontReady).
export function layoutGlyph(ctx: CanvasRenderingContext2D, text: string, size: number): GlyphLayout {
  ctx.font = `${MEASURE_AT}px ${KHMER_FONT_FAMILY}`;
  const metrics = ctx.measureText(text);
  return fitGlyph(
    {
      left: metrics.actualBoundingBoxLeft,
      right: metrics.actualBoundingBoxRight,
      ascent: metrics.actualBoundingBoxAscent,
      descent: metrics.actualBoundingBoxDescent,
    },
    size,
  );
}

export function drawGlyph(ctx: CanvasRenderingContext2D, text: string, layout: GlyphLayout): void {
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `${layout.fontSize}px ${KHMER_FONT_FAMILY}`;
  ctx.fillText(text, layout.x, layout.y);
}

// The guide's stroke width as a share of the square. The learner's ink is
// drawn exactly this wide, so it is never wider than the letter's own strokes.
export function templateStrokeWidth(layout: GlyphLayout, size: number): number {
  return (STROKE_EM * layout.fontSize) / size;
}
