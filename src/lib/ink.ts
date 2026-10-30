import { getStroke } from 'perfect-freehand';

// A point as a share of the canvas's width and height (0 to 1), so a stroke
// draws the same at any size: on screen, and at 256 x 256 for scoring.
export type Point = readonly [x: number, y: number];
export type Stroke = readonly Point[];

// The brush. No thinning, so the ink keeps one width, the template's stroke
// width (templateStrokeWidth in guide.ts), however fast or slow the stroke.
// Phase 3 scores with the same brush.
export const BRUSH = {
  thinning: 0,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: false,
} as const;

// perfect-freehand expects pixel-sized units (it nudges a lone point by 1, for
// one), so strokes are built in a square this many units wide. Scale by
// canvasPixels / INK_SPACE to draw them.
export const INK_SPACE = 1000;

// The stroke's outline as a closed path in INK_SPACE units, smoothed with
// quadratic curves through the midpoints of perfect-freehand's outline.
// `width` is a share of the canvas; `last` is false while still drawing.
export function strokePath(stroke: Stroke, width: number, last: boolean): Path2D {
  const outline = getStroke(
    stroke.map(([x, y]) => [x * INK_SPACE, y * INK_SPACE]),
    { ...BRUSH, size: width * INK_SPACE, last },
  );
  const path = new Path2D();
  if (outline.length < 2) return path;
  path.moveTo(outline[0][0], outline[0][1]);
  for (let i = 0; i < outline.length; i++) {
    const [x0, y0] = outline[i];
    const [x1, y1] = outline[(i + 1) % outline.length];
    path.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
  }
  path.closePath();
  return path;
}
