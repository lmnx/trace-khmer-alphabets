# Trace the Khmer Alphabet

A phone-first web app where learners trace the 33 Khmer consonants, get a score, hear feedback, and earn badges. It is for Cambodians, diaspora kids and foreign learners alike. The full plan, the prompt for each phase and the open decisions are in docs/workplan.md.

## Status
- Phase 0 (Setup) done 2026-10-30: live at https://lmnx.github.io/trace-khmer-alphabets/ (repo lmnx/trace-khmer-alphabets), and ក checked on a phone. Next: Phase 1 (Letter data and grid).
- TypeScript is held at 6.0.x because typescript-eslint 8.72 supports TypeScript below 6.1. Dependabot ignores TypeScript 6.1 and later until that changes.
- Decided 2026-10-30: hosting on GitHub Pages (custom domain later), Kantumruy Pro font, sound effects for the MVP, AI letter voices tested in Phase 4.

## How we work
- Claude is project manager and security advisor as well as developer. Raise risks, scope creep and outdated dependencies without waiting to be asked.
- One phase per session, in the order in docs/workplan.md. A phase is done when its done-criteria pass on a real phone.
- At the end of every phase: run the security checks below, update Status here, tick the phase in docs/workplan.md, and propose a commit.
- Never commit, push or deploy without asking.

## Stack
Vite + React + TypeScript, Tailwind CSS, perfect-freehand for ink, Vitest + Playwright. A static site with no backend, database, accounts or secrets. Node 26 LTS, pinned in .node-version.
Hosted on GitHub Pages. .github/workflows/deploy.yml runs the checks and deploys on every push to main.
- Routes are hash routes (#/trace/:order) because GitHub Pages can't send every path to index.html.
- Vite base is './', so one build works at <user>.github.io/<repo>/ and on a custom domain. Reference public files through import.meta.env.BASE_URL, never with a leading "/". CSS is the exception: write url("/fonts/…") and Vite rewrites it to a relative path at build time.

## Layout
- src/data/letters.csv: source of truth for the 33 consonants. Reviewer corrections go here.
- src/data/letters.ts: generated from letters.csv. Never edit by hand.
- src/lib/scoring.ts: pure scoring functions, no DOM access.
- src/lib/progress.ts: the only module that touches localStorage.
- src/lib/audio.ts: the only module that plays sound.
- src/i18n/en.ts: all UI text. km.ts comes later with the Khmer toggle.
- src/components/: LetterGrid, TraceCanvas, ScoreOverlay, BadgeShelf.
- public/fonts/: self-hosted Kantumruy Pro (woff2).
- public/audio/sfx/: sound effects. public/audio/letters/<order>-<name>.mp3: letter names (Phase 4).
- .github/: deploy workflow and dependabot.yml.
- docs/: workplan.md, security-log.md, credits.md.

## Khmer text rules
- Render Khmer only with the self-hosted Kantumruy Pro, never a system fallback. Await document.fonts.load() before drawing a guide letter or a scoring mask.
- Show the letter itself everywhere. Names repeat (two "tha", two "tho").
- Never hard-code romanizations outside letters.csv.
- Never put user-facing text inline in components. It goes in src/i18n/en.ts, so adding the Khmer toggle needs no refactor.

## Tracing and scoring
- Score shape, not stroke order.
- Work at 256 x 256. Target = glyph pixels. Allowed zone = target grown by 12 px.
- Coverage = share of target within brush reach of the learner's ink.
- Accuracy = share of the learner's ink inside the allowed zone.
- Score = harmonic mean of coverage and accuracy x 100. Stars at 60 / 75 / 88.
- All thresholds live in one exported config object.

## Audio
- MVP: short sound effects only (stroke, success, stars, badge).
- Letter-name clips (Phase 4): a script generates them offline with a Khmer neural voice, a native speaker approves them, and they are committed as static mp3 files. The browser never calls a TTS or AI API. API keys stay in a git-ignored .env on the developer's machine.
- Play sound only in response to a tap (iOS blocks autoplay), and honour the mute toggle.

## Security
The app has no server and no secrets, and the repo is public. The risks are the supply chain, requests to third parties, and injected content. Keep it that way.
- No runtime requests to other origins: no CDN fonts or scripts, no analytics, no trackers, no ads. Children use this app.
- GitHub Pages can't set response headers, so the CSP is a <meta> tag that a small Vite plugin adds to index.html in production builds only, because the dev server needs inline scripts. The policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; object-src 'none'; base-uri 'none'; form-action 'none'. Also add <meta name="referrer" content="no-referrer">. A meta CSP can't set frame-ancestors, so framing protection waits for the custom domain. Any loosening needs a reason recorded in docs/security-log.md.
- The e2e tests run against the production build and fail on any CSP violation.
- No dangerouslySetInnerHTML or innerHTML.
- Treat localStorage as untrusted input. Validate its shape on read and fall back to empty progress.
- Dependencies: exact versions (.npmrc save-exact), package-lock.json committed, CI installs with npm ci. Add a dependency only when it earns its place. Dependabot opens weekly updates for npm and GitHub Actions.
- npm blocks dependency install scripts by default. Approve one only with `npm install-scripts approve <pkg>`, after reading what it runs.
- GitHub Actions: pin every action to a full commit SHA, with the version in a comment. The workflow's default permission is contents: read. Only the deploy job gets pages: write and id-token: write. No personal tokens or repo secrets.
- Never commit secrets. The repo is public, and secret scanning with push protection stays on.
- Record the source and license of every font, sound and voice clip in docs/credits.md. That file also feeds the About page.

## Security checks
Run these at the end of every phase and before sharing a link. Log the date, the results and any fixes in docs/security-log.md.
1. `npm audit --omit=dev` shows no high or critical issues. Review any dev-only findings.
2. `npm outdated` and open Dependabot PRs: upgrade one area at a time, then rerun the tests.
3. /security-review on the phase's changes, before they are pushed. It only reviews what isn't on GitHub yet, and a push to main deploys.
4. Live site: the built index.html carries the CSP meta tag, the console shows no CSP violations, and HTTPS is enforced.
5. In the network tab, every request goes to the site's own origin.

## Commands
- `npm run dev`: dev server. `npm run dev -- --host` to test on a phone over Wi-Fi.
- `npm run build`: production build into dist/, with the CSP and referrer meta tags.
- `npm run preview`: serve dist/ locally.
- `npm test`: Vitest unit tests (`*.test.ts` in tests/ and src/).
- `npm run e2e`: builds, then runs Playwright (`tests/*.spec.ts`) on Android Chrome and iPhone Safari emulation, against the build served under a sub-path like GitHub Pages. Fails on any CSP violation, console error or request to another origin. Once per machine: `npx playwright install chromium webkit`.
- `npm run lint`: ESLint. It also bans innerHTML, dangerouslySetInnerHTML, document.write and eval, and localStorage outside src/lib/progress.ts.
- `npm run typecheck`: `tsc -b` over the app, the configs and the tests.

## Conventions
- Mobile first: test at 375 px wide. Tap targets are at least 48 px, and grid tiles at least 64 px.
- The canvas uses Pointer Events and touch-action: none.
- Wrap every localStorage call in try/catch.
- Respect prefers-reduced-motion.
- Run `npm run typecheck && npm run lint && npm test` before saying a task is done.
- Small commits, one per finished step.
