import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import { drawTraceable, layoutGlyph, templateStrokeWidth } from '../lib/guide';
import { INK_SPACE, strokePath, type Point, type Stroke } from '../lib/ink';
import { resultImage, traceMasks } from '../lib/masks';
import { prefersReducedMotion, pulse } from '../lib/motion';
import { scoreTrace, type TraceScore } from '../lib/scoring';
import type { ResultStory } from '../lib/sky';
import { canvasColors } from '../lib/theme';
import { CheckIcon, ClearIcon, UndoIcon } from './icons';
import { ScoreOverlay } from './ScoreOverlay';
import { BUTTON, GO_BUTTON } from './styles';

const GUIDE_ALPHA = 0.15;
// After Done, the letter shows in green and rose, with the ink faintly over it.
const RESULT_ALPHA = 0.85;
const INK_OVER_RESULT_ALPHA = 0.3;

// A square canvas with the character drawn faintly, for tracing with a finger,
// pen or mouse. Strokes are kept as arrays of points; Undo drops the last one.
// Done scores the strokes, hands the score to `onScore`, which saves it and
// says what it means for the story, and shows the result until Try again.
// `next` links the result to the next character, if there is one to go to. A
// ring pulses round the canvas as each stroke ends, and again, in the
// result's colour, after Done.
export function TraceCanvas({
  text,
  onScore,
  next,
}: {
  text: string;
  onScore: (result: TraceScore) => ResultStory;
  next: string | null;
}) {
  const fontReady = useKhmerFontReady();
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(0);
  const [strokes, setStrokes] = useState<readonly Stroke[]>([]);
  const [result, setResult] = useState<TraceScore | null>(null);
  const [story, setStory] = useState<ResultStory | null>(null);
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
    const colors = canvasColors();
    const layout = layoutGlyph(ctx, text, pixels);
    ctx.fillStyle = colors.guide;
    if (result) {
      ctx.globalAlpha = RESULT_ALPHA;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(resultImage(result.covered, result.missed, colors.covered, colors.missed), 0, 0, pixels, pixels);
    } else {
      ctx.globalAlpha = GUIDE_ALPHA;
      drawTraceable(ctx, text, layout);
    }

    // The ink is as wide as the guide's own strokes. Over the result it is
    // drawn on its own layer and faded as a whole, so overlaps don't darken.
    const width = templateStrokeWidth(layout, pixels);
    const ink = result ? inkLayer(pixels) : ctx;
    ink.fillStyle = colors.ink;
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

  // Once the result is up: a bigger pulse in its colour, and the score card
  // scrolled into view on short screens.
  useEffect(() => {
    if (!result) return;
    pulse(ringRef.current, 1.06, 700);
    resultRef.current?.scrollIntoView({ block: 'nearest', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [result]);

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
    pulse(ringRef.current);
  }

  function score() {
    const { target, ink, paths, strokeWidth } = traceMasks(text, strokes);
    const scored = scoreTrace(target, ink, paths, strokeWidth);
    setStory(onScore(scored));
    setResult(scored);
  }

  function tryAgain() {
    setStrokes([]);
    setResult(null);
    setStory(null);
  }

  const empty = strokes.length === 0;
  const ringColor = result ? (result.stars > 0 ? 'ring-covered' : 'ring-missed') : 'ring-ink';
  return (
    <div className="flex w-full flex-col items-center gap-4 motion-safe:animate-fade-in">
      <div className="relative w-[min(100%,max(16rem,calc(100dvh_-_14rem)))]">
        {/* No border on the frame: with one, WebKit makes the canvas 2 px
            shorter than it is wide. */}
        <div ref={frameRef} className="aspect-square overflow-hidden rounded-3xl bg-surface">
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
        {/* The pulse: a ring over the frame, invisible until it animates. */}
        <span
          ref={ringRef}
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-3xl opacity-0 ring-4 ${ringColor}`}
        />
      </div>
      {result && story ? (
        <ScoreOverlay ref={resultRef} result={result} story={story} next={next} onTryAgain={tryAgain} />
      ) : (
        <div className="grid w-[min(100%,24rem)] grid-cols-3 gap-2">
          <button type="button" className={BUTTON} disabled={empty} onClick={() => setStrokes(strokes.slice(0, -1))}>
            <UndoIcon />
            {en.trace.undo}
          </button>
          <button type="button" className={BUTTON} disabled={empty} onClick={() => setStrokes([])}>
            <ClearIcon />
            {en.trace.clear}
          </button>
          <button type="button" className={GO_BUTTON} disabled={empty} onClick={score}>
            <CheckIcon />
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
