import { BadgeShelf } from '../components/BadgeShelf';
import { LetterGrid } from '../components/LetterGrid';
import { AppIcon, Wordmark } from '../components/Logo';
import { NightSky } from '../components/NightSky';
import { Opening } from '../components/Opening';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import type { Form } from '../lib/forms';
import { useProgress } from '../lib/progress';
import { isSkyLit, nextStar } from '../lib/sky';

// The home page: the opening on a first visit, then the night sky, the
// Apsara badge and the grid of every character.
export function Home({ form }: { form: Form }) {
  const fontReady = useKhmerFontReady();
  const progress = useProgress();
  const first = nextStar(progress);
  const opening = !progress.welcomed && first !== null;
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 pt-8 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] motion-safe:animate-enter">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="flex items-center gap-3">
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
          <BadgeShelf earned={isSkyLit(progress)} />
          <LetterGrid form={form} progress={progress} />
        </>
      )}
    </main>
  );
}
