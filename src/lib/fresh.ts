// What the learner has just earned, so the home page can show it off: the
// sky star that just lit, and the tile whose stars just went up. Kept in
// memory only, for a short while, and read without clearing, so it survives
// React's double renders.

const FRESH_FOR_MS = 15_000;

let star: { index: number; at: number } | null = null;
let tile: { key: string; at: number } | null = null;

const recent = (at: number) => performance.now() - at < FRESH_FOR_MS;

export function markFreshStar(index: number): void {
  star = { index, at: performance.now() };
}

export function markFreshTile(key: string): void {
  tile = { key, at: performance.now() };
}

export function freshStar(): number | null {
  return star && recent(star.at) ? star.index : null;
}

export function freshTile(): string | null {
  return tile && recent(tile.at) ? tile.key : null;
}
