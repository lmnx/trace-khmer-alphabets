import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';

// Phase 1 replaces the single letter with the LetterGrid.
const SAMPLE_LETTER = 'ក';

export function Home() {
  const fontReady = useKhmerFontReady();
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-stone-900">{en.appTitle}</h1>
      <p lang="km" className={`text-[10rem] leading-tight text-stone-900 ${fontReady ? '' : 'invisible'}`}>
        {SAMPLE_LETTER}
      </p>
    </main>
  );
}
