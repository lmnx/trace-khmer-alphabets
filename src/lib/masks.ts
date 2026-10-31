import { drawTraceable, layoutGlyph, templateStrokeWidth } from './guide';
import { INK_SPACE, strokePath, type Stroke } from './ink';
import { SCORING, type Mask, type Path } from './scoring';

// Draws what scoring.ts compares, at SCORING.size, the same way the screen
// draws it: the glyph with layoutGlyph and drawTraceable (a subscript on its
// own), and the ink with strokePath at the template's stroke width.
// Call only after the Khmer font has loaded.

const SIZE = SCORING.size;
// A pixel counts as set when it is at least half opaque.
const SET_FROM_ALPHA = 128;

function context(): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('No 2D canvas');
  return ctx;
}

function toMask(ctx: CanvasRenderingContext2D): Mask {
  const pixels = ctx.getImageData(0, 0, SIZE, SIZE).data;
  const mask = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < mask.length; i++) mask[i] = pixels[i * 4 + 3] >= SET_FROM_ALPHA ? 1 : 0;
  return mask;
}

// Everything scoreTrace needs: both masks, the strokes' paths in mask pixels,
// and the letter's stroke width in mask pixels.
export function traceMasks(
  text: string,
  strokes: readonly Stroke[],
): { target: Mask; ink: Mask; paths: Path[]; strokeWidth: number } {
  const glyph = context();
  const layout = layoutGlyph(glyph, text, SIZE);
  drawTraceable(glyph, text, layout);

  const ink = context();
  const width = templateStrokeWidth(layout, SIZE);
  ink.setTransform(SIZE / INK_SPACE, 0, 0, SIZE / INK_SPACE, 0, 0);
  for (const stroke of strokes) ink.fill(strokePath(stroke, width, true));

  const paths = strokes.map((stroke) => stroke.map(([x, y]): [number, number] => [x * SIZE, y * SIZE]));
  return { target: toMask(glyph), ink: toMask(ink), paths, strokeWidth: width * SIZE };
}

// Missed parts are striped as well as rose, so learners who can't tell rose
// from green still see them: diagonal stripes `period` pixels apart at
// SCORING.size, with a `gap` left clear in each.
export const MISSED_STRIPES = { period: 8, gap: 3 } as const;

export function inStripeGap(i: number): boolean {
  const x = i % SIZE;
  const y = Math.floor(i / SIZE);
  return (x + y) % MISSED_STRIPES.period < MISSED_STRIPES.gap;
}

// The result as a picture at SCORING.size: covered pixels in one colour and
// missed ones striped in another, for drawing over the canvas, scaled up.
export function resultImage(covered: Mask, missed: Mask, coveredRgb: string, missedRgb: string): HTMLCanvasElement {
  const ctx = context();
  const image = ctx.createImageData(SIZE, SIZE);
  const [cr, cg, cb] = rgb(coveredRgb);
  const [mr, mg, mb] = rgb(missedRgb);
  for (let i = 0; i < covered.length; i++) {
    if (!covered[i] && !(missed[i] && !inStripeGap(i))) continue;
    const [r, g, b] = covered[i] ? [cr, cg, cb] : [mr, mg, mb];
    image.data.set([r, g, b, 255], i * 4);
  }
  ctx.putImageData(image, 0, 0);
  return ctx.canvas;
}

function rgb(hex: string): [number, number, number] {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
