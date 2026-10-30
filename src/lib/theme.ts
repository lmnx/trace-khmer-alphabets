// The canvas can't use CSS classes, so it reads the theme's colours from the
// CSS variables in src/index.css, and follows the theme like the rest of the
// page. masks.ts needs them as #rrggbb, so each goes through a canvas's
// fillStyle, which reads back in that form.

export interface CanvasColors {
  guide: string;
  ink: string;
  covered: string;
  missed: string;
}

let probe: CanvasRenderingContext2D | null = null;

function toHex(value: string): string {
  probe ??= document.createElement('canvas').getContext('2d');
  if (!probe) return '#000000';
  // An unreadable value leaves the black set first.
  probe.fillStyle = '#000000';
  probe.fillStyle = value;
  return String(probe.fillStyle);
}

export function canvasColors(): CanvasColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: keyof CanvasColors) => toHex(style.getPropertyValue(`--${name}`).trim());
  return { guide: read('guide'), ink: read('ink'), covered: read('covered'), missed: read('missed') };
}
