import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CHIME_NOTES } from '../src/lib/audio';

// The sounds, with window, document and the Web Audio API stubbed. Each test
// loads fresh copies of audio.ts and progress.ts, since both keep state.
describe('audio', () => {
  type Audio = typeof import('../src/lib/audio');
  type Store = typeof import('../src/lib/progress');

  const param = () => ({ value: 0, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const node = () => ({ connect: vi.fn((next: unknown) => next) });

  class FakeContext {
    static made = 0;
    state: AudioContextState = 'suspended';
    currentTime = 0;
    sampleRate = 44100;
    destination = node();
    oscillators: { frequency: ReturnType<typeof param>; start: ReturnType<typeof vi.fn> }[] = [];
    constructor() {
      FakeContext.made++;
      contexts.push(this);
    }
    resume = vi.fn(() => {
      this.state = 'running';
      return Promise.resolve();
    });
    createGain = () => ({ ...node(), gain: param() });
    createBuffer = vi.fn();
    createBufferSource = () => ({ ...node(), buffer: null, start: vi.fn() });
    createOscillator = () => {
      const oscillator = { ...node(), type: 'sine', frequency: param(), start: vi.fn(), stop: vi.fn() };
      this.oscillators.push(oscillator);
      return oscillator;
    };
  }
  let contexts: FakeContext[] = [];
  let listeners: Map<string, () => void>;

  async function load(): Promise<{ audio: Audio; store: Store }> {
    vi.stubGlobal('window', {
      AudioContext: FakeContext,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      localStorage: { getItem: () => null, setItem: vi.fn() },
    });
    vi.stubGlobal('document', { addEventListener: vi.fn((type: string, listener: () => void) => listeners.set(type, listener)) });
    const audio = await import('../src/lib/audio');
    const store = await import('../src/lib/progress');
    audio.installAudioUnlock();
    return { audio, store };
  }

  const tap = () => listeners.get('pointerup')?.();

  beforeEach(() => {
    vi.resetModules();
    contexts = [];
    FakeContext.made = 0;
    listeners = new Map();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('makes no sound and no audio context before the first tap', async () => {
    const { audio } = await load();
    audio.playTick();
    audio.playChime(3);
    audio.playFanfare(true);
    expect(FakeContext.made).toBe(0);
  });

  it('listens for every kind of tap that may start sound', async () => {
    await load();
    expect([...listeners.keys()].sort()).toEqual(['click', 'keydown', 'pointerup', 'touchend']);
  });

  it('wakes the audio on a tap, once, and again if it was suspended', async () => {
    await load();
    tap();
    expect(FakeContext.made).toBe(1);
    expect(contexts[0].resume).toHaveBeenCalledTimes(1);
    tap();
    expect(contexts[0].resume).toHaveBeenCalledTimes(1);
    contexts[0].state = 'suspended';
    tap();
    expect(FakeContext.made).toBe(1);
    expect(contexts[0].resume).toHaveBeenCalledTimes(2);
  });

  it('plays each sound after a tap', async () => {
    const { audio } = await load();
    tap();
    const played = () => contexts[0].oscillators.length;
    audio.playTick();
    expect(played()).toBe(1);
    audio.playChime(2);
    expect(played()).toBe(4);
    expect(contexts[0].oscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(CHIME_NOTES[2], 0);
    audio.playFanfare();
    const fanfare = played();
    audio.playFanfare(true);
    expect(played() - fanfare).toBeGreaterThan(fanfare - 4);
  });

  it('stays silent while muted, and plays again once unmuted', async () => {
    const { audio, store } = await load();
    tap();
    store.setMuted(true);
    audio.playTick();
    audio.playChime(1);
    audio.playFanfare(true);
    expect(contexts[0].oscillators).toHaveLength(0);
    store.setMuted(false);
    audio.playTick();
    expect(contexts[0].oscillators).toHaveLength(1);
  });

  it('does nothing where the browser has no Web Audio', async () => {
    const { audio } = await load();
    vi.stubGlobal('window', { ...window, AudioContext: undefined });
    expect(tap).not.toThrow();
    expect(() => audio.playTick()).not.toThrow();
  });
});
