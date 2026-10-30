import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import { drawTraceable, layoutGlyph, templateStrokeWidth } from '../lib/guide';
import { INK_SPACE, strokePath, type Point, type Stroke } from '../lib/ink';
import { resultImage, traceMasks } from '../lib/masks';
import { scoreTrace, type TraceScore } from '../lib/scoring';
import { COVERED_COLOR, MISSED_COLOR, ScoreOverlay } from './ScoreOverlay';

const GUIDE_COLOR = '#1c1917'; // stone-900
const GUIDE_ALPHA = 0.15;
const INK_COLOR = '#0369a1'; // sky-700
// After Done, the letter shows in green and red, with the ink faintly over it.
const RESULT_ALPHA = 0.85;
const INK_OVER_RESULT_ALPHA = 0.3;

// A square canvas with the character drawn faintly, for tracing with a finger,
// pen or mouse. Strokes are kept as arrays of points; Undo drops the last one.
// Done scores the strokes and shows the result until Try again.
export function TraceCanvas({ text }: { text: string }) {
  const fontReady = useKhmerFontReady();
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState(0);
  const [strokes, setStrokes] = useState<readonly Stroke[]>([]);
  const [result, setResult] = useState<TraceScore | null>(null);
  // The stroke in progress lives in a ref, so each pointer move repaints the
  // canvas without re-rendering React.
  const drawing = useRef<{ pointerId: number; points: Point[] } | null>(null);
  const frame = useRef(0);

  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setSize(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Everything is drawn in device pixels, so lines stay sharp on any screen.
  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const pixels = canvas.width;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, pixels, pixels);
    // Nothing is drawn, and no stroke can start, until the font has loaded.
    if (!fontReady) return;
    const layout = layoutGlyph(ctx, text, pixels);
    ctx.fillStyle = GUIDE_COLOR;
    if (result) {
      ctx.globalAlpha = RESULT_ALPHA;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(resultImage(result.covered, result.missed, COVERED_COLOR, MISSED_COLOR), 0, 0, pixels, pixels);
    } else {
      ctx.globalAlpha = GUIDE_ALPHA;
      drawTraceable(ctx, text, layout);
    }

    // The ink is as wide as the guide's own strokes. Over the result it is
    // drawn on its own layer and faded as a whole, so overlaps don't darken.
    const width = templateStrokeWidth(layout, pixels);
    const ink = result ? inkLayer(pixels) : ctx;
    ink.fillStyle = INK_COLOR;
    ink.setTransform(pixels / INK_SPACE, 0, 0, pixels / INK_SPACE, 0, 0);
    ctx.globalAlpha = 1;
    for (const stroke of strokes) ink.fill(strokePath(stroke, width, true));
    if (drawing.current) ink.fill(strokePath(drawing.current.points, width, false));
    if (ink !== ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = INK_OVER_RESULT_ALPHA;
      ctx.drawImage(ink.canvas, 0, 0);
    }
  }, [fontReady, result, strokes, text]);

  useEffect(() => {
    // A frame queued by the last pointer move still holds the old strokes, so
    // it would wipe out the stroke that just ended. Drop it and paint now.
    cancelAnimationFrame(frame.current);
    frame.current = 0;
    const canvas = canvasRef.current;
    if (!canvas || size === 0) return;
    const pixels = Math.round(size * (window.devicePixelRatio || 1));
    if (canvas.width !== pixels) {
      canvas.width = pixels;
      canvas.height = pixels;
    }
    paint();
  }, [paint, size]);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function repaintSoon() {
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      paint();
    });
  }

  function onPointerDown(event: ReactPointerEvent<HTMLCanvasElement>) {
    // One finger at a time, only the main mouse button, only once the guide
    // is showing, and not while the result is up.
    if (!fontReady || result || drawing.current || !event.isPrimary || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = { pointerId: event.pointerId, points: [pointOn(event.currentTarget, event)] };
    repaintSoon();
  }

  function onPointerMove(event: ReactPointerEvent<HTMLCanvasElement>) {
    const stroke = drawing.current;
    if (!stroke || event.pointerId !== stroke.pointerId) return;
    // Coalesced events keep fast strokes smooth where the browser offers them.
    const native = event.nativeEvent;
    const coalesced = typeof native.getCoalescedEvents === 'function' ? native.getCoalescedEvents() : [];
    for (const moved of coalesced.length > 0 ? coalesced : [native]) {
      stroke.points.push(pointOn(event.currentTarget, moved));
    }
    repaintSoon();
  }

  function onPointerEnd(event: ReactPointerEvent<HTMLCanvasElement>) {
    const stroke = drawing.current;
    if (!stroke || event.pointerId !== stroke.pointerId) return;
    drawing.current = null;
    setStrokes((previous) => [...previous, stroke.points]);
  }

  function score() {
    const { target, ink, paths, strokeWidth } = traceMasks(text, strokes);
    setResult(scoreTrace(target, ink, paths, strokeWidth));
  }

  function tryAgain() {
    setStrokes([]);
    setResult(null);
  }

  const empty = strokes.length === 0;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div
        ref={frameRef}
        className="aspect-square w-[min(100%,max(16rem,calc(100dvh_-_13rem)))] overflow-hidden rounded-2xl bg-white ring-1 ring-stone-300"
      >
        {/* touch-action: none stops the page scrolling or zooming mid-stroke. */}
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={en.trace.canvas}
          data-strokes={strokes.length}
          className="block size-full cursor-crosshair touch-none select-none [-webkit-touch-callout:none]"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
      {result ? (
        <ScoreOverlay result={result} onTryAgain={tryAgain} />
      ) : (
        <div className="grid w-[min(100%,24rem)] grid-cols-3 gap-2">
          <button type="button" className={BUTTON} disabled={empty} onClick={() => setStrokes(strokes.slice(0, -1))}>
            {en.trace.undo}
          </button>
          <button type="button" className={BUTTON} disabled={empty} onClick={() => setStrokes([])}>
            {en.trace.clear}
          </button>
          <button type="button" className={DONE_BUTTON} disabled={empty} onClick={score}>
            {en.trace.done}
          </button>
        </div>
      )}
    </div>
  );
}

function inkLayer(pixels: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = pixels;
  canvas.height = pixels;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No 2D canvas');
  return ctx;
}

function pointOn(canvas: HTMLCanvasElement, event: { clientX: number; clientY: number }): Point {
  const box = canvas.getBoundingClientRect();
  return [(event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height];
}

const BUTTON =
  'min-h-12 rounded-xl bg-white px-3 text-base font-medium text-stone-800 ring-1 ring-stone-300 enabled:hover:bg-stone-100 enabled:active:bg-stone-200 disabled:text-stone-400 disabled:ring-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 motion-safe:transition-colors';
const DONE_BUTTON =
  'min-h-12 rounded-xl bg-sky-700 px-3 text-base font-semibold text-white enabled:hover:bg-sky-800 enabled:active:bg-sky-900 disabled:bg-stone-200 disabled:text-stone-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 motion-safe:transition-colors';
