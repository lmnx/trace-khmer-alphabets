import { en } from '../i18n/en';
import { playTick } from '../lib/audio';
import { setMuted, useProgress } from '../lib/progress';
import { SoundOffIcon, SoundOnIcon } from './icons';
import { FOCUS } from './styles';

// The round speaker button that mutes and unmutes every sound. Pressed means
// muted, and the choice is saved with the learner's progress, so it lasts
// across visits. Turning sound back on plays a tick to show it works.
export function SoundToggle({ className = '' }: { className?: string }) {
  const { muted } = useProgress();
  function toggle() {
    setMuted(!muted);
    if (muted) playTick();
  }
  return (
    <button
      type="button"
      aria-label={en.sound.mute}
      aria-pressed={muted}
      onClick={toggle}
      className={`press flex size-12 shrink-0 items-center justify-center rounded-full bg-surface hover:bg-surface-hover ${muted ? 'text-fg-muted' : 'text-fg'} ${FOCUS} ${className}`}
    >
      {muted ? <SoundOffIcon /> : <SoundOnIcon />}
    </button>
  );
}
