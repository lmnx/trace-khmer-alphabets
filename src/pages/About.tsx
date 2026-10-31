import { useId, type ReactNode } from 'react';
import { GridIcon } from '../components/icons';
import { KhmerText } from '../components/KhmerText';
import { AppIcon } from '../components/Logo';
import { SoundToggle } from '../components/SoundToggle';
import { FOCUS } from '../components/styles';
import { en } from '../i18n/en';
import { useKhmerFontReady } from '../lib/fonts';
import { usePage } from '../lib/page';
import { homeHref } from '../lib/router';

const SOURCE_URL = 'https://github.com/lmnx/trace-khmer-alphabets';
// The licence ships beside the fonts, so reading it needs no other site.
const LICENCE_URL = `${import.meta.env.BASE_URL}fonts/OFL.txt`;

const LINK = `rounded-sm font-semibold text-mint underline underline-offset-4 ${FOCUS}`;

// What Aksor is, who made what in it, and what it keeps about the learner.
// The credits follow docs/credits.md.
export function About() {
  const text = en.about;
  const fontReady = useKhmerFontReady();
  usePage(en.pageTitle.page(text.title));
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 pt-4 pr-[max(1rem,env(safe-area-inset-right))] pb-[max(2rem,env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] motion-safe:animate-enter">
      <nav className="flex w-full items-center justify-between">
        <a
          href={homeHref()}
          className={`press inline-flex min-h-12 items-center gap-2 rounded-full bg-surface pr-5 pl-4 text-base font-semibold text-fg hover:bg-surface-hover ${FOCUS}`}
        >
          <GridIcon />
          {en.nav.allLetters}
        </a>
        <div className="flex items-center gap-2">
          <SoundToggle />
          <AppIcon className="size-10" />
        </div>
      </nav>
      <header className="flex flex-col gap-3">
        <h1 tabIndex={-1} className="text-3xl font-bold text-star outline-none">
          {text.title}
        </h1>
        <p className="text-lg text-fg-muted">
          {text.introBefore}
          <KhmerText text={en.appTitleKhmer} fontReady={fontReady} />
          {text.introAfter}
        </p>
        <p className="text-lg text-fg-muted">{text.intro}</p>
      </header>
      <Card heading={text.credits.heading}>
        <dl className="flex flex-col gap-4">
          <Credit name={text.credits.font.name}>
            {text.credits.font.text}{' '}
            <a href={LICENCE_URL} className={LINK}>
              {text.credits.font.link}
            </a>
          </Credit>
          <Credit name={text.credits.sounds.name}>{text.credits.sounds.text}</Credit>
          <Credit name={text.credits.art.name}>{text.credits.art.text}</Credit>
          <Credit name={text.credits.review.name}>{text.credits.review.text}</Credit>
        </dl>
      </Card>
      <Card heading={text.privacy.heading}>
        {text.privacy.lines.map((line) => (
          <p key={line} className="text-fg-muted">
            {line}
          </p>
        ))}
      </Card>
      <Card heading={text.source.heading}>
        <p className="text-fg-muted">
          {text.source.text}{' '}
          <a href={SOURCE_URL} target="_blank" rel="noreferrer" className={LINK}>
            {text.source.link}
          </a>
        </p>
      </Card>
    </main>
  );
}

function Card({ heading, children }: { heading: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3 rounded-3xl bg-surface p-5">
      <h2 id={headingId} className="text-lg font-bold text-fg">
        {heading}
      </h2>
      {children}
    </section>
  );
}

function Credit({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm font-semibold text-star">{name}</dt>
      <dd className="text-fg-muted">{children}</dd>
    </div>
  );
}
