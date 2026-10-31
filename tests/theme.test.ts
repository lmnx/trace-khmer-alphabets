import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The theme's colours live in src/index.css as CSS variables. These tests keep
// its text readable (WCAG AA) and keep hex colours out of the components, so a
// second theme only has to set the variables.

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const root = /:root\s*{([^}]*)}/.exec(css)?.[1] ?? '';
const tokens = Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6});/g)].map(([, name, hex]) => [name, hex]));

function luminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [16, 8, 0].map((shift) => {
    const c = ((value >> shift) & 255) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe('theme', () => {
  it('defines every colour the canvas reads', () => {
    for (const name of ['guide', 'ink', 'covered', 'missed']) expect(tokens[name], name).toMatch(/^#[0-9a-f]{6}$/);
  });

  // [text, background] pairs that appear in the app.
  const textPairs = [
    ['fg', 'page'],
    ['fg', 'surface'],
    ['fg', 'surface-hover'],
    ['fg', 'sunk'],
    ['fg-muted', 'page'],
    ['fg-muted', 'surface'],
    ['fg-muted', 'surface-hover'],
    ['fg-muted', 'sunk'],
    // ឡ's "none" tile, which sits on the page with no surface.
    ['fg-faint', 'page'],
    // The night sky's "The whole sky is lit!".
    ['star', 'sunk'],
    // The side of the form switch that is on.
    ['mint', 'sunk'],
    // Links on the About page.
    ['mint', 'page'],
    ['mint', 'surface'],
    ['star', 'surface'],
    ['star', 'surface-hover'],
    // The home page's headline.
    ['star', 'page'],
    ['on-star', 'star'],
    ['on-go', 'go'],
    ['on-mint', 'mint'],
  ] as const;

  it.each(textPairs)('%s on %s meets WCAG AA for text (4.5:1)', (text, background) => {
    expect(tokens[text]).toBeDefined();
    expect(tokens[background]).toBeDefined();
    expect(contrast(tokens[text], tokens[background])).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the ink, the result colours, the focus ring and empty stars visible (3:1)', () => {
    // The canvas sits on the surface colour, the focus ring on the page.
    for (const colour of ['ink', 'covered', 'missed', 'mint']) {
      expect(contrast(tokens[colour], tokens.surface), colour).toBeGreaterThanOrEqual(3);
      expect(contrast(tokens[colour], tokens.page), colour).toBeGreaterThanOrEqual(3);
    }
    // The outline of a star not yet earned, on the score card.
    expect(contrast(tokens['fg-faint'], tokens.surface)).toBeGreaterThanOrEqual(3);
  });

  it('leaves colour values out of the components and pages', () => {
    for (const dir of ['components', 'pages']) {
      const url = new URL(`../src/${dir}/`, import.meta.url);
      for (const file of readdirSync(url)) {
        const source = readFileSync(new URL(file, url), 'utf8');
        expect(source, `src/${dir}/${file}`).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/);
      }
    }
  });
});
