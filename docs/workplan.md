# Trace the Khmer Alphabet — Claude Code Workplan

Oct 29, 2026 · @Kim · living copy in the repo, last updated Oct 30, 2026

## Overview

We will build a phone-first web app where learners trace each of the 33 Khmer consonants with a finger or mouse. The app scores each attempt, plays the letter's sound, and, as letters are mastered, relights a night sky one star at a time. You hand this plan to Claude Code one phase at a time, and each phase ends in something you can try on your phone.

Assumptions this plan makes (change any of them in Decisions to confirm):

- **Audience:** Cambodians and foreigners, or even kids (could be useful angle for pr..) alike who are interested in a fun interactive experience. The interface is in English and Khmer.
- **Content:** the 33 consonants first. Vowels, subscripts and numerals come later.
- **No accounts:** progress is saved in the learner's own browser.
- **Hosting:** GitHub Pages, deployed by GitHub Actions, with no server or database. A custom domain comes later.

## Scope

The first version, the MVP, is one complete loop: pick a letter, trace it, get a score, hear it, light a star. Everything else waits until that loop feels good on a phone.

| Feature | MVP | Later |
| --- | --- | --- |
| Grid with the numerals ០ to ៩ first, then all 33 consonants in one block | Yes |  |
| A Letter / Subscript / Both toggle on the grid: each consonant's subscript (coeng) form, alone or stacked like ក្ក | Yes |  |
| Trace screen with a faint letter guide, plus undo and clear | Yes |  |
| Score from 0 to 100 and 1 to 3 stars, with missed areas highlighted | Yes |  |
| Sound effects for strokes, stars and badges | Yes |  |
| Audio clip of each letter's name (AI voice, reviewed) | Phase 5 test | If the voice fails review |
| Night sky story: progress saved on the device, characters unlocking in order, best scores, and a constellation per set | Yes |  |
| Works with touch (iOS Safari, Android Chrome) and mouse | Yes |  |
| Stroke-order animation and a "start here" dot |  | Needs hand-made stroke data |
| Dependent and independent vowels |  | Yes |
| Listening quiz: hear a sound, pick the letter |  | Yes |
| Khmer-language interface toggle |  | Yes |
| Works offline as an installable app (PWA) |  | Yes |

## Tech stack

Use a small static React app with no backend. Claude Code works well with this stack, and the whole site deploys free from a GitHub repo.

| Layer | Choice | Why |
| --- | --- | --- |
| Build | Vite + React + TypeScript | Fast setup, typed letter data |
| Styling | Tailwind CSS | Quick, consistent mobile layout |
| Drawing | HTML canvas with Pointer Events | One code path for touch, pen and mouse |
| Ink | perfect-freehand (npm) | Smooth, pressure-like strokes that feel like a brush |
| Fonts | Kantumruy Pro from Google Fonts, self-hosted | The guide letter must render the same on every phone |
| Audio | Sound effects; 33 letter clips (.mp3) generated offline with a Khmer neural voice in Phase 5 | Browser text-to-speech is not reliable for Khmer |
| Storage | localStorage, wrapped in try/catch | Progress without accounts |
| Tests | Vitest for scoring, Playwright for the trace flow | Scoring is the part most likely to regress |
| Hosting | GitHub Pages, deployed by GitHub Actions | Free, no extra account, and no deploy token to manage |

Suggested project layout:

```
trace-khmer-alphabets/
  CLAUDE.md
  .github/
    workflows/deploy.yml  # checks, then deploy to GitHub Pages
    dependabot.yml
  docs/               # this workplan, security-log.md, credits.md
  public/
    audio/
      sfx/            # stroke, star and badge sounds
      letters/        # 1-ka.mp3 ... 33-a.mp3, one per consonant (Phase 5)
    fonts/            # self-hosted Kantumruy Pro
  src/
    data/letters.csv  # source of truth (the CSV below)
    data/letters.ts   # generated from letters.csv
    i18n/en.ts        # all UI text
    components/
      LetterGrid.tsx
      TraceCanvas.tsx
      ScoreOverlay.tsx
      BadgeShelf.tsx
    lib/
      scoring.ts      # pure functions, unit tested
      progress.ts     # localStorage read/write
      audio.ts
    pages/
      Home.tsx
      Trace.tsx
  tests/
    scoring.test.ts
    trace.spec.ts     # Playwright
```

## Content and data

The app needs three things: the letter list, a font for the guide letters, and one audio clip per letter. The letter list is drafted below. The font and the audio need a native Khmer speaker to sign off.

**Letter list.** Khmer has 33 consonants in two series. First-series letters carry an inherent "â" sound and second-series letters an "ô" sound. The obsolete letters U+179D and U+179E are left out. Romanizations differ between systems, so treat the `name` column as a draft for your reviewer to correct. Save the CSV as `src/data/letters.csv` and have Claude Code turn it into `letters.ts`.

```csv
order,char,unicode,name,series
1,ក,U+1780,ka,1
2,ខ,U+1781,kha,1
3,គ,U+1782,ko,2
4,ឃ,U+1783,kho,2
5,ង,U+1784,ngo,2
6,ច,U+1785,cha,1
7,ឆ,U+1786,chha,1
8,ជ,U+1787,cho,2
9,ឈ,U+1788,chho,2
10,ញ,U+1789,nho,2
11,ដ,U+178A,da,1
12,ឋ,U+178B,tha,1
13,ឌ,U+178C,do,2
14,ឍ,U+178D,tho,2
15,ណ,U+178E,na,1
16,ត,U+178F,ta,1
17,ថ,U+1790,tha,1
18,ទ,U+1791,to,2
19,ធ,U+1792,tho,2
20,ន,U+1793,no,2
21,ប,U+1794,ba,1
22,ផ,U+1795,pha,1
23,ព,U+1796,po,2
24,ភ,U+1797,pho,2
25,ម,U+1798,mo,2
26,យ,U+1799,yo,2
27,រ,U+179A,ro,2
28,ល,U+179B,lo,2
29,វ,U+179C,vo,2
30,ស,U+179F,sa,1
31,ហ,U+17A0,ha,1
32,ឡ,U+17A1,la,1
33,អ,U+17A2,a,1
```

The split is 15 first-series and 18 second-series letters. Several names repeat (two "tha", two "tho"), so the app should always show the letter, never the name alone.

**Font.** Shortlist two or three Khmer fonts from Google Fonts, such as Noto Sans Khmer, Kantumruy Pro and Battambang. Ask your reviewer which is closest to the way Cambodian schools teach letters to be written. Self-host the chosen font so the guide letter is identical on every device. **Chosen (Oct 30, 2026): Kantumruy Pro.**

**Audio.** For now, crisp sound effects is good enough. I want to look into generative audio as well. Shall we?

**Decided (Oct 30, 2026):** yes, as a test in Phase 4 (Phase 5 since Oct 31). The MVP ships with sound effects. For letter names, a script generates the clips offline with a Khmer neural voice (Azure's km-KH voices, for example), and the reviewer approves a few samples before we generate all 33. The clips are committed as static files, so the browser never calls an AI service and no API key reaches the site. If the voice fails review, we record a native speaker instead.

## Tracing and scoring

The MVP scores the shape of the trace, not the stroke order. I found no public stroke-order data for Khmer like the kind that exists for Chinese characters. Khmer datasets I found are built for text recognition (OCR) instead. Scoring by shape works with any font and needs no hand-made data.

How a trace is scored:

1. Draw the letter in the chosen font onto a hidden 256 × 256 canvas. Its dark pixels are the **target**. For a subscript, the target is the subscript on its own.
2. Draw the learner's strokes onto a second hidden canvas at the same size, with the same brush width as on screen.
3. **Coverage** is the share of target pixels within 8 px of the learner's ink, so every part of the letter has to be traced.
4. **Precision** is how close the middle of the learner's strokes keeps to the middle of the letter's strokes. Each point along the strokes earns full credit within 2 px, and less and less further away, down to nothing at 18 px.
5. **Score** = coverage × precision × 100. It stays low whenever either one is low, so scribbling over the whole box cannot win.
6. Stars: 1 star from 60, 2 from 75, 3 from 88.
7. Show the result on top of the letter: covered parts in green, missed parts in rose (red before Phase 3.5's restyle).

**Changed Oct 30, 2026.** The first version grew the target by a 12 px tolerance into an allowed zone, and scored the harmonic mean of coverage and the share of ink inside that zone. Measured on all 75 forms, it let a scribble over the whole box earn a star, and Kim found any rough trace scored 90+ on a phone. The rule above was tuned with Kim: careful traces score 99+, rough ones 50 to 80, and scribbles about 20.

Keep scoring as pure functions in `lib/scoring.ts` that take pixel arrays and return numbers. Then Claude Code can unit-test it without a browser.

**Later: real stroke order.** With your reviewer, hand-draw each letter as an SVG path, one path per stroke, in the order schools teach it. That data unlocks a "start here" dot, an animated demo, and a check that strokes come in the right order.

## Build phases

There are eight phases, 0 to 6 plus 3.5 (added Oct 30, 2026), each one session in Claude Code. Paste the prompt, let it work, then check the done-criteria on your own phone before you start the next phase. Commit after every phase so you can roll back.

### Phase 0: Setup

```
Read CLAUDE.md. Scaffold a Vite + React + TypeScript app in this repo with Tailwind CSS, Vitest and Playwright, using the latest stable versions pinned exactly. Add .node-version (Node 26), .npmrc (save-exact) and the folder layout from CLAUDE.md with empty placeholder components. Set the Vite base to './' and use hash routes. Self-host the Kantumruy Pro woff2 files I put in public/fonts, load them with @font-face, and record their source and license in docs/credits.md. Add the build-time CSP meta tag described in CLAUDE.md. Make the home page show the heading "Trace the Khmer Alphabet" and the letter ក in that font, centred and large. Add npm scripts for dev, build, preview, test, e2e, lint and typecheck. Add .github/workflows/deploy.yml, which runs the checks and then deploys to GitHub Pages, with every action pinned to a commit SHA. Add .github/dependabot.yml for npm and GitHub Actions. Run the security checks from CLAUDE.md and start docs/security-log.md. Then tell me which repo settings to turn on: Pages source set to GitHub Actions, Enforce HTTPS, Dependabot alerts, and secret scanning with push protection.
```

Done when the page is live at a public link and ក renders in the chosen font on your phone.

- [x] Scaffolded and checked locally: typecheck, lint, unit tests, build and e2e pass, and the first security check is logged (Oct 30, 2026)
- [x] Live at https://lmnx.github.io/trace-khmer-alphabets/, with ក checked on a phone (Oct 30, 2026)

### Phase 1: Letter data and grid

```
Convert src/data/letters.csv into a typed src/data/letters.ts (order, char, unicode, name, series). Add a unit test that checks there are 33 letters, 15 in series 1, 18 in series 2, and that every char matches its unicode code point. Build LetterGrid: two sections, "First series" and "Second series", each a grid of large tappable tiles showing the letter with its name small underneath. Tiles must be at least 64 px square. Tapping a tile goes to #/trace/:order.
```

Done when all 33 letters look right in the grid on iOS Safari and Android Chrome, and the test passes.

- [x] Built and checked locally: letters.ts generated from the CSV, the grid, and typecheck, lint, unit tests and e2e passing. Security checks logged (Oct 30, 2026)
- [x] Live at https://lmnx.github.io/trace-khmer-alphabets/ from 53a63d4, live-site checks logged (Oct 30, 2026)
- [x] Revised at Kim's request (Oct 30, 2026): the numerals ០ to ៩ come first, labelled 0 to 9, then all 33 letters in one block, because the series split doesn't help with writing. A Letter / Subscript / Both toggle shows each letter, its subscript under a dotted circle (◌្ក), or both stacked (ក្ក). ឡ has no subscript, so it is greyed out in those views. Live from 0aabbd4, live-site checks logged
- [x] Numbers, letters, subscripts and stacks checked in the grid on iOS Safari and Android Chrome (Oct 30, 2026). Afterwards, at Kim's request, ឡ shows alone in the Both view instead of greyed out

### Phase 2: Tracing canvas

```
Build TraceCanvas for the #/trace/:order page. Draw the letter very faint (about 15% opacity) in the Khmer font, centred and filling about 80% of a square canvas that fits the screen width. Capture strokes with Pointer Events and render them with perfect-freehand. Set touch-action: none on the canvas so the page does not scroll while drawing. Handle devicePixelRatio so lines are sharp. Add Undo (last stroke), Clear, and Done buttons below the canvas, plus Previous and Next letter arrows. Keep the strokes as arrays of points in state.
```

Since Oct 30, 2026 the trace page also opens a number (#/trace/number/:digit) and a letter's subscript or stacked form (#/trace/:order/subscript or /both), so TraceCanvas draws whichever text `glyph()` in src/lib/forms.ts gives, and Previous and Next stay within the same set.

Done when drawing on a phone is smooth, the page never scrolls mid-stroke, and undo works.

- [x] Built (Oct 30, 2026): TraceCanvas with perfect-freehand 1.2.3, Undo, Clear, Done (greyed out until Phase 3 scores), and Previous / Next within the same set. At Kim's request the ink is exactly as wide as the template letter's strokes: 0.07 of the font size, measured for Kantumruy Pro, with no thinning. Drawing checked on Kim's phone over Wi-Fi
- [x] Security checks, then live on the site (Oct 30, 2026, with Phase 3, from 4472f1f)

### Phase 3: Scoring

```
Implement src/lib/scoring.ts exactly as described in the Tracing and scoring section of CLAUDE.md: target mask from the glyph, allowed zone grown by a 12 px tolerance at 256 x 256, coverage, accuracy, harmonic-mean score 0-100, stars at 60/75/88. Keep all thresholds in one exported config object. Write Vitest tests with synthetic strokes: tracing along the glyph scores at least 90, a scribble over the whole box scores under 40, an empty canvas scores 0. When the learner taps Done, show ScoreOverlay with the score, the stars, covered areas in green and missed areas in red, and a Try again button.
```

Done when the tests pass and five people's honest attempts get scores that feel fair to them.

- [x] Built (Oct 30, 2026): scoring.ts, masks.ts and ScoreOverlay. Done shows the score, stars and a word of praise, with the letter in green and red. The scoring rule changed after measuring and phone tests with Kim (see Tracing and scoring above). The masks match the screen: the target uses `layoutGlyph()` and the learner's ink `strokePath()` at `templateStrokeWidth()`
- [x] Subscripts are traced on their own at full size. Chrome's canvas can't stack them under ◌, so they are drawn under a stand-in ក, which is then erased
- [x] Tuned with Kim on a phone: careful traces reach 99, rough ones score 50 to 80
- [ ] Five people's honest attempts feel fair to them
- [x] Security checks, then live on the site (Oct 30, 2026, from 4472f1f)

### Phase 3.5: Brand and makeover

Added Oct 30, 2026, so the app has its own look before Phase 4 builds on it.

```
Create a modern, minimalist, game-like logo and brand for the app, then restyle the whole UI in it. First ask me whether to keep "Trace the Khmer Alphabet" as the name or adopt a short game name, such as Aksar (អក្សរ, "letters", which matches aksar.app), with the full name as a tagline. Show me 2 or 3 distinct directions, each with an SVG icon and wordmark, a colour palette, type and one sample screen, and wait for my pick. Keep them original: no other game's brand, and no national emblems, royal symbols or Angkor Wat silhouettes. Deliver the chosen brand as an SVG logo and app icon in public/, colour and type tokens in the Tailwind theme, and favicon, apple-touch-icon and manifest icons. Self-host any new display font and record its licence in docs/credits.md. Khmer still renders only in Kantumruy Pro. Then restyle the home grid, the trace screen and ScoreOverlay so they feel like a game: playful but minimal, with tactile buttons, satisfying feedback on a stroke, on Done and on the stars, and smooth transitions between screens. Keep it visual only: badges, confetti and audio belong to Phase 4, and the scoring logic doesn't change.
```

Done when typecheck, lint, unit tests, build and e2e pass with no CSP violations and no requests to other origins; colour contrast meets WCAG AA; tap targets are at least 48 px and grid tiles at least 64 px; motion respects prefers-reduced-motion; the layout works at 375 px wide; the security checks are logged; and you have seen it on your phone.

- [x] Name decided (Oct 30, 2026): **Aksor** (អក្សរ, "letters"), Kim's spelling, closer to how the word is said. "Trace the Khmer Alphabet" stays as the tagline. aksor.app, aksor.com and aksor.org are taken, so the domain will be playaksor.app (see Decisions)
- [x] Brand picked from three directions (Ink trail, Tile pop, Star path), Oct 30, 2026: Star path's dark palette with a matching green added, and Ink trail's logo (ក half traced, with a dotted guide and a dot for the finger). Themes stay switchable: every colour is a semantic CSS variable, so a light theme later is one block of CSS
- [x] Logo, app icon, favicon, apple-touch-icon and manifest icons in public/, written by `npm run icons` from src/lib/brand.ts, and the theme's colours as Tailwind tokens. No new font
- [x] Grid, trace screen and ScoreOverlay restyled: a pulse round the canvas on each stroke and after Done, the score counting up with stars popping in as it passes each level, and pages fading in. All of it is off with reduced motion
- [x] Changed to flat design at Kim's request (Oct 31, 2026): solid colours with no lips, shadows or borders, and buttons that shrink a little while pressed. The home headline is now "See how good your Khmer writing is!"
- [x] Contrast (a unit test checks every text pair against AA), tap targets and 375 px checked, e2e passing, security checks 1, 2, 4 and 5 logged (Oct 31, 2026)
- [ ] Seen on Kim's phone
- [ ] Committed, /security-review run, then live checks after Kim's push

### Phase 4: Night sky story and progression

Replanned Oct 31, 2026, at Kim's request, to make progress challenging, exciting and rewarding. Kim picked the night sky story, unlocking in order, and beating your best. The sound effects and letter voices that Phase 4 used to hold moved to Phase 5. The open questions are under Decisions to confirm.

```
Read CLAUDE.md. Turn the app into a night sky story with progression. Don't change the scoring.

Progress: save each character's best score and stars, for each form, through src/lib/progress.ts. Wrap every localStorage read and write in try/catch, check the stored shape on read, and fall back to empty progress, so the app still works with storage blocked or in a private window.

Story: the night sky has gone dark. Every character the learner earns a star on lights a star in the sky, and each set (Numbers, Letters, Subscripts, Both) is a constellation that is complete when all its stars are lit. Write a short opening for a first visit (two or three lines and one button), and a line from the sky after each result. All text goes in src/i18n/en.ts.

Challenge: characters unlock in order within each set. At least one star on a character opens the next one. Locked tiles show a lock and say what opens them. [Free practice: as decided under Decisions to confirm.]

Reward: show each character's best stars on its tile and on the trace page. Celebrate a new best score ("New best!") and a finished constellation with a short animation. Show the sky on the home page: the constellations, what is lit so far, and the next star to light. Respect prefers-reduced-motion and keep the flat design.

Add unit tests for reading stored progress, unlocking and best scores, and e2e tests that progress survives a reload, characters unlock in order, and blocked storage doesn't crash the app.
```

Done when progress survives a reload and works in a private window without crashing, characters unlock in order, a new best and a finished constellation are celebrated, the checks pass, and you have played it on your phone.

### Phase 5: Sound

Moved here from Phase 4 on Oct 31, 2026.

```
Add sound effects through src/lib/audio.ts: a soft tick per stroke, a chime per star, and a fanfare when a constellation is complete, with a mute toggle. Then test AI letter voices: write a script that generates public/audio/letters/<order>-<name>.mp3 offline with a Khmer neural voice, reading the API key from a git-ignored .env, and generate three sample letters for the reviewer. Only after the reviewer approves the voice, generate all 33 and add a speaker button on the trace page that plays the letter's clip and auto-plays it once after a 3-star result. Play sound only after a tap, and honour the mute toggle.
```

Done when sound plays from the first tap on an iPhone and an Android phone, mute works and survives a reload, and the reviewer has approved the voice.

### Phase 6: Polish and ship

```
Audit the app for accessibility and performance. Give every button an aria-label, make sure the grid works with a keyboard, and check colour contrast. Run Lighthouse on mobile and fix anything under 90. Add an About page that credits the font, the sounds, the voice clips and the native-speaker reviewer, using docs/credits.md. Add the site title and a share image. Then list anything you think is still rough.
```

Done when your native-speaker reviewer has gone through all 33 letters and signed off.

### After shipping: monetization

Planned separately in docs/monetization.md (Oct 30, 2026): house ads, printable PDFs, tracing books and personalised gift books. That file calls it Phase 6 because it was written before the phases were renumbered on Oct 31. It now comes after Phase 6, Polish and ship.

## CLAUDE.md

Claude Code reads `CLAUDE.md` at the start of every session, so it carries the rules that should never be re-explained. It lives at the repo root and is the only copy. It grew from the starter in the first version of this plan, adding the security rules, the security checks and the decisions above.

## Testing and QA

Automated tests protect the scoring, but whether the app feels right only shows up when real people trace on real phones. Tick these off before you share the link.

- [ ] `npm test` and `npm run e2e` pass
- [ ] All 33 letters render correctly on an iPhone (Safari) and an Android phone (Chrome)
- [ ] No page scroll or zoom while drawing; pinch and double-tap do nothing on the canvas
- [ ] A careful trace gets 3 stars and a sloppy one gets 1 or 0, for at least 5 testers
- [ ] Audio plays on the first tap on iOS (Safari blocks sound until the user taps)
- [ ] Progress survives a reload and works in a private window without crashing
- [ ] Lighthouse mobile scores are 90 or higher
- [ ] A native Khmer speaker has checked every letter's shape, name and audio
- [ ] The About page credits the font, the voice and the reviewer
- [ ] The security checks in CLAUDE.md pass and are logged in docs/security-log.md

## Risks and decisions to confirm

The biggest risk is not the code. It is letting the app teach a letter shape or sound wrongly, so line up a native-speaker reviewer before Phase 1.

| Risk | What could go wrong | Fallback |
| --- | --- | --- |
| Letter accuracy | The font's shapes differ from how children are taught to write | Reviewer picks the font in Phase 0 |
| Romanization | Names in the CSV follow no single system | Reviewer corrects the CSV; the app always shows the letter too |
| Scoring feels unfair | Thin strokes or small letter parts are hard to hit | Tune `reach`, `wobble`, `precision` and the star levels in `SCORING` |
| Colour-blind learners | The result shows traced parts in green and missed parts in rose, which some learners can't tell apart. On the dark theme the two are also close in brightness (1.5:1), so it matters more than it did on white | Phase 6: add a second cue, such as a pattern or outline on missed parts |
| Dark theme outdoors | A dark page is harder to read in bright sunlight, and the faint guide letter on it too | Text contrast is far above AA (white on midnight is 17:1). If testers struggle, the light theme is one more block of the theme's variables |
| Audio on iPhone | Sound does not play until a tap | Play only from a button tap |
| Scope creep | Vowels get added before the core loop works (numerals and subscripts joined the MVP on purpose on Oct 30) | Ship the MVP first |
| Subscripts | Subscripts are small, some look alike (្ដ and ្ត) and some sit beside the letter (្រ, ្ស), so they are hard to trace and to score fairly | The reviewer checks every subscript; tune scoring for small shapes in Phase 3 |
| Hosting limits | GitHub Pages can't send security headers, so nothing stops other sites from framing the app | CSP meta tag now; Cloudflare's proxy adds the headers once there's a custom domain |
| AI voice quality | The neural voice says a letter name wrongly or unnaturally | The reviewer approves samples first; otherwise record a native speaker |

Decisions to confirm:

- [x] Who the main learner is: visitors and expats, or Cambodian or diaspora children
- [x] Interface language: English only, or English with a Khmer toggle from the start
- [x] Who records the 33 audio clips and who reviews the letters
- [x] Which Khmer font to use: Kantumruy Pro (Oct 30, 2026)
- [x] Which free host to deploy to: GitHub Pages, deployed by GitHub Actions (Oct 30, 2026)
- [x] Audio: sound effects for the MVP, AI letter voices tested in Phase 4 (Oct 30, 2026). Both moved to Phase 5 on Oct 31, 2026
- [x] Grid: numbers first, then all 33 letters in one block, with a Letter / Subscript / Both toggle; number tiles show the digit 0 to 9 (Oct 30, 2026)
- [x] Badges for Phase 4: the plan awarded First series and Second series badges, but the grid no longer shows the series. Answered Oct 31, 2026: the night sky story replaces badges with a constellation per set
- [x] Story and challenge (Oct 31, 2026): a night sky the learner relights, characters that unlock in order, and beating your best score. Kim turned down three rounds per letter (trace, fading guide, from memory) and daily streaks for now
- [ ] Phase 4, free practice: with unlocking in order, can a learner still open any character, say from a separate practice view, or does it stay locked until earned? Locked-only blocks a learner who came for one letter
- [ ] Phase 4, forms: does a letter's Subscript and Both unlock with the letter, or does each form have its own path?
- [ ] Phase 4, the final reward: the plan had an Apsara badge for everything. With the night sky it could be the full sky instead. An Apsara figure is close to the "no national emblems" line, so check it with the reviewer if it stays
- [ ] Custom domain. **Picked Oct 30, 2026: playaksor.app**, to match the name Aksor. It and playaksor.com were unregistered that day (checked in the registries' RDAP). aksor.app was registered by someone else on Oct 23, 2026, and aksor.com and aksor.org are taken too, so some visitors may type aksor.app and land on another site. Not bought yet: until Kim buys it, anyone can. Earlier shortlist, all unregistered on Oct 30, 2026: aksar.app (អក្សរ, "letters"), tracekhmer.com or .app, kakhako.app ("kâ khâ kô", the Khmer ABC). Backups: rienaksar.com, sorsei.app, aksarkids.app. Buy from an at-cost registrar such as Cloudflare Registrar or Porkbun, and compare renewal prices. Once bought: add public/CNAME, verify the domain in GitHub settings so nobody else can claim it, turn on Enforce HTTPS, and consider Cloudflare's proxy to add the headers GitHub Pages can't send.

## Sources

- [Developing OpenType Fonts for Khmer Script (Microsoft)](https://learn.microsoft.com/en-us/typography/script-development/khmer): Khmer Unicode order, subscript (coeng) rules
- [KhmerST scene-text dataset (arXiv)](https://arxiv.org/html/2410.18277v1) and [Towards Universal Khmer Text Recognition (arXiv)](https://arxiv.org/html/2603.00702): Khmer datasets are aimed at text recognition, not stroke order
