import { LetterGrid } from '../components/LetterGrid';
import { en } from '../i18n/en';

export function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 py-8 pr-[max(1rem,env(safe-area-inset-right))] pl-[max(1rem,env(safe-area-inset-left))]">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-stone-900">{en.appTitle}</h1>
        <p className="mt-1 text-stone-600">{en.home.intro}</p>
      </header>
      <LetterGrid />
    </main>
  );
}
