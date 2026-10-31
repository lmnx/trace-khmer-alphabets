import { getProgress } from './progress';
import type { Stars } from './scoring';

// The only module that plays sound. Every sound is made here with the Web
// Audio API, so the app ships no sound files and needs no licence for them:
// a soft tick as each stroke ends, a chime as each star pops in, and a
// fanfare for a new badge or the whole sky lit.
//
// Browsers, iOS Safari above all, keep audio silent until the learner taps.
// So the audio context is created and resumed only inside a tap, by the
// listeners installAudioUnlock() puts on the page, and nothing plays before
// the first one. iOS can suspend the context again (a call, the app in the
// background), so every tap checks it. Muted, nothing plays at all.

let context: AudioContext | null = null;
let output: GainNode | null = null;

// How loud the app is overall. Each sound sets its own level below this.
const VOLUME = 0.6;

function getContext(): AudioContext | null {
  if (context) return context;
  if (typeof window.AudioContext !== 'function') return null;
  try {
    context = new window.AudioContext();
  } catch {
    return null;
  }
  output = context.createGain();
  output.gain.value = VOLUME;
  output.connect(context.destination);
  return context;
}

function unlock(): void {
  const audio = getContext();
  if (!audio || audio.state === 'running') return;
  // A rejected resume only means it wasn't a tap the browser counts. The next one tries again.
  audio.resume().catch(() => {});
  // Older iOS also wants a sound started inside the tap: one silent sample.
  const silence = audio.createBufferSource();
  silence.buffer = audio.createBuffer(1, 1, audio.sampleRate);
  silence.connect(audio.destination);
  silence.start();
}

// The events browsers count as a tap that may start sound. Called once, from main.tsx.
const UNLOCK_EVENTS = ['pointerup', 'touchend', 'click', 'keydown'] as const;

export function installAudioUnlock(): void {
  for (const type of UNLOCK_EVENTS) document.addEventListener(type, unlock, { capture: true, passive: true });
}

// The context and output to play into, or null when muted, unsupported, or
// before the first tap.
function ready(): { audio: AudioContext; out: GainNode } | null {
  if (getProgress().muted || !context || !output || context.state === 'closed') return null;
  return { audio: context, out: output };
}

// One note: a quick rise to `peak`, then an exponential fade over `length`
// seconds. `glide` slides the pitch to that frequency as it fades.
function tone(
  { audio, out }: { audio: AudioContext; out: GainNode },
  { freq, at, length, peak, type = 'sine', glide }: { freq: number; at: number; length: number; peak: number; type?: OscillatorType; glide?: number },
): void {
  const start = audio.currentTime + at;
  const oscillator = audio.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, start);
  if (glide) oscillator.frequency.exponentialRampToValueAtTime(glide, start + length);
  const envelope = audio.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(peak, start + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(envelope).connect(out);
  oscillator.start(start);
  oscillator.stop(start + length + 0.05);
}

// A bell: the note with two quieter, faster-fading overtones at a bell's
// uneven ratios, which is what makes it ring rather than beep.
function bell(player: { audio: AudioContext; out: GainNode }, freq: number, at: number, length: number, peak: number): void {
  tone(player, { freq, at, length, peak });
  tone(player, { freq: freq * 2.76, at, length: length * 0.35, peak: peak * 0.3 });
  tone(player, { freq: freq * 5.4, at, length: length * 0.12, peak: peak * 0.1 });
}

// Notes of C major, in Hz.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.51;
const G6 = 1567.98;
const C7 = 2093;

// The first, second and third star's chimes climb G, C, E.
export const CHIME_NOTES: Readonly<Record<1 | 2 | 3, number>> = { 1: G5, 2: C6, 3: E6 };

// A short, soft tock as a stroke ends, a little higher or lower each time so
// a run of strokes doesn't sound mechanical.
export function playTick(): void {
  const player = ready();
  if (!player) return;
  const freq = 880 * (0.94 + Math.random() * 0.12);
  tone(player, { freq, at: 0, length: 0.07, peak: 0.12, glide: freq * 0.6 });
}

// The chime for the result's first, second or third star, `at` seconds from now.
export function playChime(star: Exclude<Stars, 0>, at = 0): void {
  const player = ready();
  if (!player) return;
  bell(player, CHIME_NOTES[star], at, 1.2, 0.22);
}

// A rising C major run into a held chord with a bell on top, `at` seconds
// from now. With `grand`, for the whole sky lit, the chord holds longer and
// a second run of bells climbs over it.
export function playFanfare(grand = false, at = 0): void {
  const player = ready();
  if (!player) return;
  [C5, E5, G5].forEach((freq, i) => tone(player, { freq, at: at + i * 0.11, length: 0.28, peak: 0.16, type: 'triangle' }));
  const chord = at + 0.36;
  const hold = grand ? 2.2 : 1.3;
  for (const freq of [C5, E5, G5, C6]) tone(player, { freq, at: chord, length: hold, peak: 0.08, type: 'triangle' });
  bell(player, C7, chord, hold, 0.08);
  if (grand) [G5, C6, E6, G6, C7].forEach((freq, i) => bell(player, freq, chord + 0.3 + i * 0.14, 1.1, 0.12));
}
