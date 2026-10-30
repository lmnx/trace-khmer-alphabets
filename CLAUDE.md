# Trace the Khmer Alphabet

A phone-first web app where learners trace the Khmer numerals and the 33 consonants, alone or with their subscripts, get a score, hear feedback, and earn badges. It is for Cambodians, diaspora kids and foreign learners alike. The full plan, the prompt for each phase and the open decisions are in docs/workplan.md.

## Status
- Phase 0 (Setup) done 2026-10-30: live at https://lmnx.github.io/trace-khmer-alphabets/ (repo lmnx/trace-khmer-alphabets), and ក checked on a phone.
- Phase 1 (Letter data and grid) live 2026-10-30 from 53a63d4, with the live-site checks logged. Revised the same day at Kim's request: the numbers ០ to ៩ first, then all 33 letters in one block, with a Letter / Subscript / Both toggle. The revision is live from 0aabbd4, and Kim checked it on phones. Phase 1 done 2026-10-30. ឡ showing alone in the Both view goes live with Phase 2.
- Phase 2 (Tracing canvas) built 2026-10-30, and drawing checked on Kim's phone over Wi-Fi. Kim pushed it (7f42ce7), but CI run 41083567809 failed on a timing race in an e2e test (it read the canvas size before the canvas had resized), so it was never deployed. The fix is in Phase 3's commits.
- Phase 3 (Scoring) built and tuned with Kim on a phone 2026-10-30. The scoring rule changed (see Tracing and scoring). Still to do: five people's honest attempts feel fair to them. Next: Phase 4 (Audio, progress and badges).
- TypeScript is held at 6.0.x because typescript-eslint 8.72 supports TypeScript below 6.1. Dependabot ignores TypeScript 6.1 and later until that changes.
- Decided 2026-10-30: hosting on GitHub Pages (custom domain later), Kantumruy Pro font, sound effects for the MVP, AI letter voices tested in Phase 4.

## How we work
- Claude is project manager and security advisor as well as developer. Raise risks, scope creep and outdated dependencies without waiting to be asked.
- One phase per session, in the order in docs/workplan.md. A phase is done when its done-criteria pass on a real phone.
- At the end of every phase: run the security checks below, update Status here, tick the phase in docs/workplan.md, and propose a commit.
- Never commit without asking. Kim pushes to GitHub (a push to main deploys), so Claude never runs git push. After a push, Claude checks the deploy run and the live site.

## Stack
Vite + React + TypeScript, Tailwind CSS, perfect-freehand for ink, Vitest + Playwright. A static site with no backend, database, accounts or secrets. Node 26 LTS, pinned in .node-version.
Hosted on GitHub Pages. .github/workflows/deploy.yml runs the checks and deploys on every push to main.
- Routes are hash routes because GitHub Pages can't send every path to index.html: #/, #/subscript and #/both for the grid; #/trace/:order, #/trace/:order/subscript and #/trace/:order/both for a letter; #/trace/number/:digit for a number. src/lib/router.ts accepts nothing else.
- Vite base is './', so one build works at <user>.github.io/<repo>/ and on a custom domain. Reference public files through import.meta.env.BASE_URL, never with a leading "/". CSS is the exception: write url("/fonts/…") and Vite rewrites it to a relative path at build time.
- Tailwind scans only src/ (`source(".")` in src/index.css), so words in the docs don't become CSS.

## Layout
- src/data/letters.csv: source of truth for the 33 consonants. Reviewer corrections go here.
- src/data/letters.ts: generated from letters.csv by `npm run letters`. Never edit by hand.
- scripts/: the letters.ts generator. letters-csv.ts checks every CSV row and renders the module.
- src/data/numerals.ts: ០ to ៩, computed from their code points. They are labelled with the digits 0 to 9, so they need no CSV.
- src/lib/forms.ts: the Letter / Subscript / Both forms and `glyph()`, the text each form shows.
- src/lib/targets.ts: the text to trace for a route, and Previous / Next within its set.
- src/lib/guide.ts: lays out and draws the guide glyph in a square, and gives the template's stroke width.
- src/lib/ink.ts: the brush and `strokePath()`, which turns a stroke's points into a perfect-freehand outline.
- src/lib/scoring.ts: pure scoring functions, no DOM access.
- src/lib/masks.ts: draws the 256 x 256 masks and stroke paths that scoring.ts compares.
- src/lib/progress.ts: the only module that touches localStorage.
- src/lib/audio.ts: the only module that plays sound.
- src/i18n/en.ts: all UI text. km.ts comes later with the Khmer toggle.
- src/components/: LetterGrid, FormToggle, TraceCanvas, ScoreOverlay, BadgeShelf.
- public/fonts/: self-hosted Kantumruy Pro (woff2).
- public/audio/sfx/: sound effects. public/audio/letters/<order>-<name>.mp3: letter names (Phase 4).
- .github/: deploy workflow and dependabot.yml.
- docs/: workplan.md, security-log.md, credits.md.

## Khmer text rules
- Render Khmer only with the self-hosted Kantumruy Pro, never a system fallback. Await document.fonts.load() before drawing a guide letter or a scoring mask.
- Show the letter itself everywhere. Names repeat (two "tha", two "tho").
- A subscript on its own sits under a dotted circle (◌្ក), as dictionaries show it. Build it, and stacks like ក្ក, with `glyph()` in src/lib/forms.ts. ឡ has no subscript form: the CSV's subscript column says no.
- Never hard-code romanizations outside letters.csv.
- Never put user-facing text inline in components. It goes in src/i18n/en.ts, so adding the Khmer toggle needs no refactor.

## Tracing and scoring
- Score shape, not stroke order.
- Work at 256 x 256. Target = the glyph's pixels (for a subscript, the subscript on its own).
- Coverage = share of the target within 8 px (`reach`) of the learner's ink, so every part has to be traced.
- Precision = how close the middle of the learner's strokes keeps to the middle of the letter's strokes. Points 1 px apart along the strokes each earn full credit within 2 px (`wobble`), then 1 - stray², with stray running from 0 there to 1 at 18 px (`precision`). The points are averaged.
- Score = coverage x precision x 100. Stars at 60 / 75 / 88.
- Changed 2026-10-30, measured on all forms and tuned with Kim on a phone. The first rule (harmonic mean of coverage and accuracy, with a 12 px allowed zone) let scribbles earn a star and gave any rough trace 90+. Now careful traces score 99+, rough ones 50 to 80, and scribbles about 20. The reasons and numbers are in src/lib/scoring.ts.
- All thresholds live in one exported config object, `SCORING` in src/lib/scoring.ts.
- Canvas text in Chrome doesn't stack a subscript under ◌, so the canvas draws a subscript under a stand-in ក and erases the ក (`drawTraceable()` in guide.ts). HTML text, as in the grid, stacks it fine.
- Stroke points are stored as shares of the canvas (0 to 1). perfect-freehand needs pixel-sized units, so strokes are built in a 1000-unit INK_SPACE and scaled to the canvas.
- The ink is as wide as the template's own strokes: STROKE_EM (0.07, measured for Kantumruy Pro; 0.06 for a subscript on its own) times the guide's font size, with no thinning. Scoring uses the same `layoutGlyph()`, `templateStrokeWidth()` and `strokePath()`, so the mask lines up with what the learner sees.

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
3. /security-review on the phase's changes, after committing and before pushing. Its diff covers only commits that aren't on GitHub yet, and a push to main deploys.
4. Live site: the built index.html carries the CSP meta tag, the console shows no CSP violations, and HTTPS is enforced.
5. In the network tab, every request goes to the site's own origin.

## Commands
- `npm run dev`: dev server. `npm run dev -- --host` to test on a phone over Wi-Fi.
- `npm run build`: production build into dist/, with the CSP and referrer meta tags.
- `npm run preview`: serve dist/ locally.
- `npm test`: Vitest unit tests (`*.test.ts` in tests/ and src/).
- `npm run e2e`: builds, then runs Playwright (`tests/*.spec.ts`, with the shared guard in tests/fixtures.ts) on Android Chrome and iPhone Safari emulation, against the build served under a sub-path like GitHub Pages. Fails on any CSP violation, console error or request to another origin. Once per machine: `npx playwright install chromium webkit`.
- `npm run lint`: ESLint. It also bans innerHTML, dangerouslySetInnerHTML, document.write and eval, and localStorage outside src/lib/progress.ts.
- `npm run typecheck`: `tsc -b` over the app, the configs, the scripts and the tests.
- `npm run letters`: regenerates src/data/letters.ts after an edit to letters.csv. `npm test` fails if you forget.

## Conventions
- Mobile first: test at 375 px wide. Tap targets are at least 48 px, and grid tiles at least 64 px.
- The canvas uses Pointer Events and touch-action: none.
- Wrap every localStorage call in try/catch.
- Respect prefers-reduced-motion.
- Run `npm run typecheck && npm run lint && npm test` before saying a task is done.
- Small commits, one per finished step.
