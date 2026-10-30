import { useEffect, useState } from 'react';

// Motion in JavaScript. CSS motion uses Tailwind's motion-safe: variant
// instead. Both are skipped when the learner asks for reduced motion.

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// A ring that grows and fades over an element: feedback for a stroke or a
// result. Only opacity and transform change, so nothing moves underneath.
export function pulse(element: Element | null, grow = 1.03, duration = 400): void {
  if (!element || prefersReducedMotion()) return;
  element.animate(
    [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: `scale(${grow})` },
    ],
    { duration, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  );
}

// Counts up from 0 to `target`, slowing towards the end, for the score. A
// higher score takes a little longer, so it feels earned. With reduced motion
// it shows the target at once.
export function useCountUp(target: number): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const duration = 250 + target * 6;
    const start = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const t = Math.min(1, (now - start) / duration);
      setValue(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target]);
  return value;
}
