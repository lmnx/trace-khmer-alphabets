import { useSyncExternalStore } from 'react';
import type { TraceTarget } from './router';
import type { Stars } from './scoring';
import { SETS, targetKey } from './targets';

// The learner's progress, kept in this browser: whether they have seen the
// opening, and each character's best score and stars in each form. The only
// module that touches localStorage.
//
// Storage can be blocked (some private windows), full, or edited by hand. So
// every call is wrapped in try/catch, what comes back is checked field by
// field, and anything that doesn't fit reads as empty progress. With storage
// blocked the app still works: it keeps progress until the page closes.

export interface Best {
  readonly score: number;
  readonly stars: Stars;
}

export interface Progress {
  // The learner has seen the opening.
  readonly welcomed: boolean;
  // Each character's best, by targetKey(). Missing until its first result.
  readonly best: Readonly<Partial<Record<string, Best>>>;
}

export const EMPTY_PROGRESS: Progress = { welcomed: false, best: {} };

export const STORAGE_KEY = 'aksor:progress';
const VERSION = 1;
const KNOWN_KEYS = new Set(SETS.flatMap((set) => set.targets.map(targetKey)));

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStars(value: unknown): value is Stars {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function toBest(value: unknown): Best | null {
  if (!isRecord(value)) return null;
  const { score, stars } = value;
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 100 || !isStars(stars)) return null;
  return { score, stars };
}

// Reads what localStorage held. Unknown characters and malformed entries are
// dropped one by one; anything that isn't version 1 of this shape is empty.
export function parseProgress(raw: string | null): Progress {
  if (raw === null) return EMPTY_PROGRESS;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return EMPTY_PROGRESS;
  }
  if (!isRecord(data) || data.v !== VERSION) return EMPTY_PROGRESS;
  const best: Record<string, Best> = {};
  if (isRecord(data.best)) {
    for (const [key, value] of Object.entries(data.best)) {
      const entry = toBest(value);
      // Only known keys, so nothing like __proto__ gets through.
      if (entry && KNOWN_KEYS.has(key)) best[key] = entry;
    }
  }
  return { welcomed: data.welcomed === true, best };
}

export function serializeProgress(progress: Progress): string {
  return JSON.stringify({ v: VERSION, welcomed: progress.welcomed, best: progress.best });
}

// The progress after a result: the character's best score and best stars,
// each kept at the higher of old and new.
export function withResult(progress: Progress, target: TraceTarget, score: number, stars: Stars): Progress {
  const key = targetKey(target);
  const old = progress.best[key];
  const best: Best = {
    score: Math.max(score, old?.score ?? 0),
    stars: Math.max(stars, old?.stars ?? 0) as Stars,
  };
  return { ...progress, best: { ...progress.best, [key]: best } };
}

// The store: a copy in memory, saved after every change and shared with React.

let current: Progress | null = null;
const listeners = new Set<() => void>();

function load(): Progress {
  try {
    return parseProgress(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY_PROGRESS;
  }
}

function save(progress: Progress): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeProgress(progress));
  } catch {
    // Blocked or full: the copy in memory lasts until the page closes.
  }
}

function update(progress: Progress): void {
  current = progress;
  save(progress);
  for (const listener of listeners) listener();
}

export function getProgress(): Progress {
  current ??= load();
  return current;
}

export function recordResult(target: TraceTarget, score: number, stars: Stars): void {
  update(withResult(getProgress(), target, score, stars));
}

export function markWelcomed(): void {
  const progress = getProgress();
  if (!progress.welcomed) update({ ...progress, welcomed: true });
}

// Another tab saved progress: read it again, checked like any other read.
function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== STORAGE_KEY) return;
  current = load();
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

export function useProgress(): Progress {
  return useSyncExternalStore(subscribe, getProgress);
}
