import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const meta = (property: string) => new RegExp(`<meta property="${property}" content="([^"]*)"`).exec(html)?.[1];

describe('the link preview', () => {
  it('points at the share image in public/, at its real size', () => {
    const image = meta('og:image');
    expect(image).toMatch(/^https:\/\/[^/]+\/share\.png$/);
    // A PNG's width and height sit at bytes 16 to 24.
    const png = readFileSync(new URL('../public/share.png', import.meta.url));
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([
      Number(meta('og:image:width')),
      Number(meta('og:image:height')),
    ]);
  });

  it('names the same site everywhere', () => {
    const site = meta('og:url');
    expect(site).toMatch(/^https:\/\/[^/]+\/$/);
    expect(meta('og:image')?.startsWith(site ?? '-')).toBe(true);
    expect(html).toContain(`<link rel="canonical" href="${site}" />`);
  });
});
