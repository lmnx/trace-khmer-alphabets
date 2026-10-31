import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  EMPTY_PROGRESS,
  parseProgress,
  serializeProgress,
  STORAGE_KEY,
  withResult,
  type Progress,
} from '../src/lib/progress';
import type { TraceTarget } from '../src/lib/router';

const ka: TraceTarget = { kind: 'letter', order: 1, form: 'letter' };
const zero: TraceTarget = { kind: 'number', digit: 0 };
const stored = (data: unknown) => JSON.stringify(data);

describe('parseProgress', () => {
  it('reads nothing, or anything that is not version 1 JSON, as empty progress', () => {
    for (const raw of [null, '', 'not json', '{', 'null', '42', '"text"', '[]', '{}', stored({ v: 2, best: {} })]) {
      expect(parseProgress(raw), String(raw)).toEqual(EMPTY_PROGRESS);
    }
  });

  it('reads saved progress', () => {
    const raw = stored({
      v: 1,
      welcomed: true,
      best: { 'letter/1': { score: 91, stars: 3 }, 'number/0': { score: 0, stars: 0 }, 'both/33': { score: 60, stars: 1 } },
    });
    expect(parseProgress(raw)).toEqual({
      welcomed: true,
      best: { 'letter/1': { score: 91, stars: 3 }, 'number/0': { score: 0, stars: 0 }, 'both/33': { score: 60, stars: 1 } },
    });
  });

  it('drops characters that do not exist, one by one', () => {
    const best = { score: 80, stars: 2 };
    const raw = stored({
      v: 1,
      best: {
        'letter/1': best,
        'letter/0': best,
        'letter/34': best,
        // The Subscript form was dropped, so its old results go.
        'subscript/1': best,
        'number/10': best,
        'letter/01': best,
        constructor: best,
        toString: best,
      },
    });
    expect(parseProgress(raw).best).toEqual({ 'letter/1': best });
  });

  it('drops scores and stars that are out of range or the wrong type', () => {
    const entries = [
      { score: 101, stars: 3 },
      { score: -1, stars: 0 },
      { score: 50.5, stars: 0 },
      { score: '50', stars: 0 },
      { score: 90, stars: 4 },
      { score: 90, stars: 1.5 },
      { score: 90, stars: '3' },
      { score: 90 },
      { stars: 3 },
      null,
      [90, 3],
      'best',
    ];
    for (const entry of entries) {
      expect(parseProgress(stored({ v: 1, best: { 'letter/1': entry } })).best, JSON.stringify(entry)).toEqual({});
    }
  });

  it('keeps welcomed only when it is exactly true, and survives a bad best', () => {
    expect(parseProgress(stored({ v: 1, welcomed: 'true', best: {} })).welcomed).toBe(false);
    expect(parseProgress(stored({ v: 1, welcomed: 1 })).welcomed).toBe(false);
    expect(parseProgress(stored({ v: 1, welcomed: true, best: [] }))).toEqual({ welcomed: true, best: {} });
    expect(parseProgress(stored({ v: 1, welcomed: true, best: 'all' }))).toEqual({ welcomed: true, best: {} });
  });

  it('lets nothing reach the object prototype', () => {
    const raw = '{"v":1,"best":{"__proto__":{"score":90,"stars":3},"letter/1":{"score":90,"stars":3,"__proto__":{"polluted":1}}}}';
    const progress = parseProgress(raw);
    expect(Object.keys(progress.best)).toEqual(['letter/1']);
    expect(progress.best['letter/1']).toEqual({ score: 90, stars: 3 });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).score).toBeUndefined();
  });

  it('reads back what serializeProgress writes', () => {
    const progress: Progress = { welcomed: true, best: { 'both/12': { score: 77, stars: 2 } } };
    expect(parseProgress(serializeProgress(progress))).toEqual(progress);
  });
});

describe('withResult', () => {
  it('saves a first result, even with no stars', () => {
    expect(withResult(EMPTY_PROGRESS, ka, 42, 0).best).toEqual({ 'letter/1': { score: 42, stars: 0 } });
  });

  it('keeps the best score and the best stars', () => {
    let progress = withResult(EMPTY_PROGRESS, ka, 70, 1);
    progress = withResult(progress, ka, 90, 3);
    expect(progress.best['letter/1']).toEqual({ score: 90, stars: 3 });
    progress = withResult(progress, ka, 40, 0);
    expect(progress.best['letter/1']).toEqual({ score: 90, stars: 3 });
  });

  it('leaves the old progress and other characters alone', () => {
    const before = withResult(EMPTY_PROGRESS, zero, 80, 2);
    const after = withResult(before, ka, 95, 3);
    expect(before.best).toEqual({ 'number/0': { score: 80, stars: 2 } });
    expect(after.best).toEqual({ 'number/0': { score: 80, stars: 2 }, 'letter/1': { score: 95, stars: 3 } });
  });
});

// The store, with window and localStorage stubbed. Each test loads a fresh
// copy of the module, since the store keeps progress in memory.
describe('the progress store', () => {
  type Store = typeof import('../src/lib/progress');

  function memoryStorage(initial: Record<string, string> = {}) {
    const data = new Map(Object.entries(initial));
    return {
      data,
      getItem: vi.fn((key: string) => data.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => void data.set(key, value)),
    };
  }

  // `localStorage` describes window.localStorage: a value, or a getter.
  async function loadStore(localStorage: PropertyDescriptor): Promise<Store> {
    const window = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
    Object.defineProperty(window, 'localStorage', localStorage);
    vi.stubGlobal('window', window);
    return import('../src/lib/progress');
  }

  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it('reads saved progress, and saves each result', async () => {
    const storage = memoryStorage({ [STORAGE_KEY]: stored({ v: 1, welcomed: true, best: { 'number/0': { score: 61, stars: 1 } } }) });
    const store = await loadStore({ value: storage });
    expect(store.getProgress()).toEqual({ welcomed: true, best: { 'number/0': { score: 61, stars: 1 } } });

    store.recordResult(ka, 88, 3);
    expect(parseProgress(storage.data.get(STORAGE_KEY) ?? null)).toEqual({
      welcomed: true,
      best: { 'number/0': { score: 61, stars: 1 }, 'letter/1': { score: 88, stars: 3 } },
    });
  });

  it('starts empty when the saved progress is corrupt', async () => {
    const store = await loadStore({ value: memoryStorage({ [STORAGE_KEY]: '{"v":1,"best":' }) });
    expect(store.getProgress()).toEqual(EMPTY_PROGRESS);
  });

  it('keeps working in memory when localStorage is blocked', async () => {
    const store = await loadStore({
      get() {
        throw new DOMException('The operation is insecure.', 'SecurityError');
      },
    });
    expect(store.getProgress()).toEqual(EMPTY_PROGRESS);
    expect(() => store.recordResult(ka, 90, 3)).not.toThrow();
    expect(() => store.markWelcomed()).not.toThrow();
    expect(store.getProgress()).toEqual({ welcomed: true, best: { 'letter/1': { score: 90, stars: 3 } } });
  });

  it('keeps working in memory when reads and writes throw', async () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new DOMException('denied', 'SecurityError');
      }),
      setItem: vi.fn(() => {
        throw new DOMException('full', 'QuotaExceededError');
      }),
    };
    const store = await loadStore({ value: storage });
    expect(store.getProgress()).toEqual(EMPTY_PROGRESS);
    store.recordResult(zero, 70, 1);
    expect(storage.setItem).toHaveBeenCalled();
    expect(store.getProgress().best).toEqual({ 'number/0': { score: 70, stars: 1 } });
  });

  it('marks the opening as seen once', async () => {
    const storage = memoryStorage();
    const store = await loadStore({ value: storage });
    store.markWelcomed();
    store.markWelcomed();
    expect(storage.setItem).toHaveBeenCalledTimes(1);
    expect(parseProgress(storage.data.get(STORAGE_KEY) ?? null).welcomed).toBe(true);
  });
});
