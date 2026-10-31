import { en } from '../i18n/en';
import { ABOUT_HREF } from '../lib/router';
import { InfoIcon } from './icons';
import { FOCUS } from './styles';

// The round (i) button to the About page, beside the speaker button.
export function AboutLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={ABOUT_HREF}
      aria-label={en.nav.about}
      className={`press flex size-12 shrink-0 items-center justify-center rounded-full bg-surface text-fg hover:bg-surface-hover ${FOCUS} ${className}`}
    >
      <InfoIcon />
    </a>
  );
}
