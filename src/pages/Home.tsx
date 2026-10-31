import { AboutLink } from '../components/AboutLink';
import { BadgeShelf } from '../components/BadgeShelf';
import { LetterGrid } from '../components/LetterGrid';
import { AppIcon, Wordmark } from '../components/Logo';
import { NightSky } from '../components/NightSky';
import { Opening } from '../components/Opening';
import { SoundToggle } from '../components/SoundToggle';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import type { Form } from '../lib/forms';
import { usePage } from '../lib/page';
import { useProgress } from '../lib/progress';
import { nextStar } from '../lib/sky';

// The home page: the opening on a first visit, then the night sky, the
// badges and the grid of every character.
export function Home({ form }: { form: Form }) {
  usePage(en.pageTitle.home);
  const fontReady = useKhmerFontReady();
  const progress = useProgress();
  const first = nextStar(progress);
  const opening = !progress.welcomed && first !== null;
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 pt-8 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] motion-safe:animate-enter">
      <header className="relative flex flex-col items-center gap-3 text-center">
        <AboutLink className="absolute -top-4 left-0" />
        <SoundToggle className="absolute -top-4 right-0" />
        <h1 tabIndex={-1} className="flex items-center gap-3 outline-none">
          <AppIcon className="size-14 shrink-0" />
          <Wordmark className="h-10 w-auto text-fg" />
          <span className="sr-only">{en.appTitle}</span>
        </h1>
        <p className="text-fg-muted">
          {/* Hidden until Kantumruy Pro loads, like every Khmer word. */}
          <span lang="km" className={fontReady ? '' : 'invisible'}>
            {en.appTitleKhmer}
          </span>
          {' · '}
          {en.tagline}
        </p>
        <p className="text-2xl leading-tight font-bold text-balance text-star">{en.home.intro}</p>
      </header>
      {opening ? (
        <Opening first={first} />
      ) : (
        <>
          <NightSky progress={progress} />
          <BadgeShelf progress={progress} />
          <LetterGrid form={form} progress={progress} />
        </>
      )}
    </main>
  );
}
