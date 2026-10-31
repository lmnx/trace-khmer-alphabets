# Security log

The security checks from CLAUDE.md, run at the end of every phase and before sharing a link. Newest first. Each entry records the date, the results, any fixes, and every loosening of the CSP with its reason.

## 2026-10-31 · Phase 4 (Night sky story and progression)

Committed as 87577d2. Check 3 ran after the commit, before the push. Checks 4 and 5 ran against the local production build and need repeating on the live site after the push.

| # | Check | Result |
| --- | --- | --- |
| 1 | `npm audit --omit=dev` | 0 vulnerabilities. Full `npm audit`, dev included: 0. `npm audit signatures`: 88 packages have verified attestations. `npm install-scripts ls`: no packages with unreviewed install scripts. No dependency changes this phase. |
| 2 | `npm outdated`, Dependabot PRs | `typescript` 7.0.2 is still held. `eslint` 10.14.0 (dev only, published 2026-10-30) still waits for Dependabot's 7-day cooldown. Open Dependabot PRs couldn't be listed here, because `gh` isn't installed: Kim to check on GitHub. |
| 3 | `/security-review` | No findings, over the two unpushed commits dab2e73 (docs) and 87577d2 (Phase 4). It checked how saved progress is read (JSON in try/catch, version 1 only, only the 76 known keys written into a fresh object, so nothing like `__proto__` gets through, scores and stars range-checked), storage events from other tabs (read again through the same check), the router (only narrowed), every new link (built from validated targets, never from stored text), the SVG components (constant or computed shapes, no `href` or `foreignObject`), the motion code, and CSP compatibility (no `style` attributes, inline scripts or new URLs). No dependency, workflow or build changes. Editing localStorage by hand can light someone's own sky, which has no security impact. |
| 4 | CSP meta tag, no violations | The CSP and referrer tags are unchanged. `npm run e2e` passed in one clean run: 57 passed, 1 skipped (the Chromium-only touch test on WebKit), with no CSP violations, console errors or requests to other origins, on Android Chrome and iPhone Safari emulation, with motion on and reduced. Earlier runs that day lost tests to frozen browsers while the machine was swapping hard (12.9 of 13.3 GB swap used); none failed an assertion on a page that responded. The new motion is CSS classes behind `motion-safe:` and `element.animate()` (Web Animations), which `style-src 'self'` allows. No component sets a `style` attribute. |
| 5 | Every request to the site's own origin | e2e fails on any request to another origin and passed. No new files are fetched: the sky, the stars and the Apsara badge are inline SVG in the bundle. |

Review notes:
- Phone check: Kim played the final version on a phone over Wi-Fi (`npm run dev -- --host`) before approving the commit. That also served the app to Kim's Tailscale devices while it ran.
- Saved progress is the first thing the app reads back from the browser, so it is treated as untrusted. `src/lib/progress.ts` is still the only module that touches localStorage (ESLint enforces it). Every call is in try/catch, including reading `window.localStorage` itself, which throws when storage is blocked. What comes back must be version 1 JSON. Each entry is kept only if its key is one of the 108 known characters (so `__proto__`, `constructor` and the like never get through) and its score is an integer from 0 to 100 and its stars 0 to 3. Anything else reads as empty progress. A `storage` event from another tab is read and checked the same way. Unit tests cover each case, and e2e tests run the app with storage blocked, with saving failing, and with corrupt saved data.
- What is saved: whether the opening was seen, and each character's best score and stars. No names, no IDs, no timestamps, and nothing leaves the device.
- Routes: a practice view with its own `#/practice` routes was built, then removed the same day at Kim's request. The Subscript form went too, so `#/subscript` and `#/trace/:order/subscript` are gone. The router sends all of these home, and unit tests cover them. Saved results for subscripts no longer match a known character, so they are dropped on read like any unknown key. No HTML injection sinks anywhere in `src/`.
- ESLint now lets the e2e tests (`tests/*.spec.ts`, `tests/fixtures.ts`) use localStorage, to seed and read progress in the test browser. They aren't part of the app.
- The Apsara badge and the rumduol constellation are drawn for the project (docs/credits.md). The reviewer still has to check both.

## 2026-10-31 · Phase 3.5 live

Deployed from commit 233d68d (Kim pushed it). Checks 1 to 3 are in the entry below, run before the push.

| # | Check | Result |
| --- | --- | --- |
| 4 | CSP meta tag, no violations, HTTPS | The live `index.html`, JS, CSS, favicons, apple-touch-icon and manifest are byte-for-byte identical to the local build, so the CSP and referrer tags still come first in `<head>`. The browser pane's console was empty at 375 px on the home page and the trace page. `http://` gets a 301 redirect to `https://`. |
| 5 | Every request to the site's own origin | The page, one JS file, one CSS file and two fonts, all from `lmnx.github.io/trace-khmer-alphabets/`. The manifest's icons (icon.svg, icon-192, icon-512, the maskable icon) and logo.svg all return 200 from the same path. No other origins. |

- CI run 41098386869: "Check and build" (Playwright: 39 passed, 1 skipped, which is the Chromium-only touch test on WebKit) and "Deploy to GitHub Pages" both succeeded. That run traced, pressed Done and watched the count-up with motion on, against this exact build. The only annotations are the known `ubuntu-latest` → Ubuntu 26 notices.
- Phone check: Kim checked the flat makeover on a phone before approving the commit.

## 2026-10-31 · Phase 3.5 (Brand and makeover)

Run before committing. Check 3 runs after the commit and before the push, and checks 4 and 5 need repeating on the live site after the push. These ran against the local production build.

| # | Check | Result |
| --- | --- | --- |
| 1 | `npm audit --omit=dev` | 0 vulnerabilities. Full `npm audit`, dev included: 0. `npm audit signatures`: 88 packages have verified attestations. `npm install-scripts ls`: no packages with unreviewed install scripts. No dependency changes this phase. |
| 2 | `npm outdated`, Dependabot PRs | `typescript` 7.0.2 is still held. `eslint` 10.14.0 (dev only, published 2026-10-30) waits for Dependabot's 7-day cooldown. Open Dependabot PRs couldn't be listed here, because `gh` isn't installed: Kim to check on GitHub. |
| 3 | `/security-review` | No findings, over the three unpushed commits: 48ab633 (docs), 24167b8 (docs/monetization.md, from another session) and 7943419 (Phase 3.5). It checked for injection sinks (none), the SVG and icon constants, the CSS variables the canvas reads (only from the site's own stylesheet, then through canvas `fillStyle`), the motion code, the manifest and icon links (all same-origin and relative in the build), scripts/icons.ts (constants only, fixed output paths, no outside input), and secrets (none). The CSP is unchanged. |
| 4 | CSP meta tag, no violations | The built `index.html` still starts `<head>` with the CSP and referrer tags, unchanged. e2e passed on Android Chrome and iPhone Safari emulation (39 passed, 1 skipped, which is the Chromium-only touch test on WebKit) with no CSP violations or console errors, with motion on and with reduced motion. That covers the CSS animations, the Web Animations pulse and the count-up. The browser pane's console was empty. |
| 5 | Every request to the site's own origin | e2e passed on both browsers, and a new test fetches every icon and the manifest and checks they sit under the site's sub-path. In the browser pane: the page, one JS file, one CSS file and two fonts, all from the same origin. |

Review notes:
- No new dependencies and no new fonts. The logo, icons and wordmark are drawn for the project (docs/credits.md), so there are no third-party assets.
- `scripts/icons.ts` runs only on a developer's machine. It builds SVG strings from constants in `src/lib/brand.ts` (no outside input), writes them to `public/`, and draws the PNGs with Playwright's Chromium, which is already a dev dependency.
- The CSP is unchanged. Every colour and animation is a class in the built stylesheet. Components set no `style` attribute, and a unit test fails on a hex or rgb() colour in a component or page. The pulse uses `element.animate()` (Web Animations), which `style-src 'self'` allows. e2e confirms it.
- `manifest.webmanifest` is same-origin, and `manifest-src` falls back to `default-src 'self'`. Its `start_url` and `scope` are `./`. It makes "Add to Home Screen" open the app full screen (`display: standalone`), with no service worker and no offline caching, which stay in the PWA item for later.
- `main.tsx` adds an empty, passive `touchstart` listener so iOS shows the buttons' pressed state. It does nothing else.
- For the phone check, `npm run dev -- --host` serves the source to the whole Wi-Fi network. Use it only on a trusted network, and stop it afterwards.
- Rerun after the flat restyle at Kim's request (2026-10-31): typecheck, lint, unit tests (53) and e2e (39 passed, 1 skipped) pass again, with no CSP violations or requests to other origins. The restyle only changed classes and copy.

## 2026-10-30 · Phases 2 and 3 live

Deployed from commit 4472f1f (Kim pushed it). Checks 1 to 3 are in the entry below, run before the push.

| # | Check | Result |
| --- | --- | --- |
| 4 | CSP meta tag, no violations, HTTPS | The live `index.html`, JS and CSS are byte-for-byte identical to a local build of 4472f1f, so the CSP and referrer tags are in place. The browser pane's console was empty at 375 px through tracing ក, Done and the result. `http://` gets a 301 redirect to `https://`. |
| 5 | Every request to the site's own origin | The page, one JS file, one CSS file and two fonts, all from `lmnx.github.io/trace-khmer-alphabets/`. No other origins. |

- CI run 41089134332: "Check and build" (Playwright: 33 passed, 1 skipped, which is the Chromium-only touch test on WebKit) and "Deploy to GitHub Pages" both succeeded. This is the run that failed for 7f42ce7 before the e2e race was fixed. The only other annotations are the known `ubuntu-latest` → Ubuntu 26 notices.
- Live trace of ក in the browser pane: 99, 3 stars, the letter in green.
- Phone and fairness checks: Kim tuned the scoring on a phone over Wi-Fi. Five people's honest attempts are still to come.

## 2026-10-30 · Phases 2 and 3 (tracing canvas, scoring)

Run before committing Phase 3 and before the next push. Kim deferred these checks while building. Phase 2 was pushed in between (7f42ce7), but CI run 41083567809 failed, so it was never deployed: the CI gate held. This review covers everything since the last deploy, 0aabbd4. Checks 4 and 5 ran against the local production build, and need repeating on the live site after the push.

| # | Check | Result |
| --- | --- | --- |
| 1 | `npm audit --omit=dev` | 0 vulnerabilities. Full `npm audit`, dev included: 0. `npm audit signatures`: 88 packages have verified attestations. `npm install-scripts ls`: no packages with unreviewed install scripts. |
| 2 | `npm outdated`, Dependabot PRs | `typescript` 7.0.2 is still held. `eslint` 10.14.0 (dev only, published today) waits for Dependabot's 7-day cooldown. No open PRs. |
| 3 | `/security-review` | No findings, over `git diff 0aabbd4` plus the new files. The skill's own diff only sees unpushed commits, and Phase 2 was already pushed, so the review was pointed at the range since the last deploy. |
| 4 | CSP meta tag, no violations | e2e passed on Android Chrome and iPhone Safari emulation with no CSP violations or console errors, through drawing, Undo, Clear, Done, Try again and the arrows. The CSP and referrer tags are unchanged. |
| 5 | Every request to the site's own origin | e2e passed on both browsers. No new URLs in the bundle. |

Review notes:
- New dependency: perfect-freehand 1.2.3. MIT, by the tldraw author, published 2026-02-01, no dependencies and no install scripts. Its 4.5 KB bundle is pure vector maths: no network, eval, DOM or storage. The lockfile's sha512 matches the registry.
- fsevents 2.3.3 (an optional, macOS-only dev dependency of Vite, already in the lockfile) has an install script. npm's default blocks it, and it stays unapproved.
- The canvas reads pixels only from canvases the app itself creates (getImageData), so no cross-origin image is involved. Strokes are kept in memory only: nothing is stored or sent.
- The CI failure was an e2e timing race, not an app fault. On CI's slower WebKit, a test read the canvas size before the canvas had resized. Every trace test now waits until the guide is drawn, and the trace tests passed 3 runs in a row with 4 parallel workers.

## 2026-10-30 · Phase 1 revision live

Deployed from commit 0aabbd4 (Kim pushed it). Checks 1 to 3 are in the entry below, run before the push.

| # | Check | Result |
| --- | --- | --- |
| 4 | CSP meta tag, no violations, HTTPS | The live `index.html`, JS and CSS are byte-for-byte identical to a local build of 0aabbd4, so the CSP and referrer tags are in place. The browser pane's console was empty at 375 px through the Letter, Subscript and Both views and a stacked tile's trace page. `http://` gets a 301 redirect to `https://`. |
| 5 | Every request to the site's own origin | The page, one JS file, one CSS file and two fonts, all from `lmnx.github.io/trace-khmer-alphabets/`. No other origins. |

- CI run 41079469572: "Check and build" (Playwright: 14 passed) and "Deploy to GitHub Pages" both succeeded. The only other annotations are the known `ubuntu-latest` → Ubuntu 26 notices.
- Live grid at 375 px: 10 numbers and 33 letters, with no sideways scroll. In the Subscript and Both views, 32 letters are links and ឡ is greyed out.
- Not security, noted for later: Tailwind also scans CLAUDE.md and docs/ for class names, so words there ("fixed", "relative", "static", "contents") add four unused CSS rules, and a docs-only commit changes the CSS file. Limiting Tailwind's source to src/ fixes it.
- Phone check on iOS Safari and Android Chrome: waiting on Kim.

## 2026-10-30 · Phase 1 revision (numbers, one letter block, subscript toggle)

Run before committing and pushing. Checks 4 and 5 ran against the local production build, and need repeating on the live site after the push.

| # | Check | Result |
| --- | --- | --- |
| 1 | `npm audit --omit=dev` | 0 vulnerabilities. Full `npm audit`, dev included: 0. No dependency changes. |
| 2 | `npm outdated`, Dependabot PRs | `typescript` 7.0.2 is still held (typescript-eslint needs below 6.1). `eslint` 10.14.0 (dev only) was published today, so it waits for Dependabot's 7-day cooldown, around Nov 6. No open PRs. |
| 3 | `/security-review` | No findings. Nothing was committed yet, so the review covered the working tree. |
| 4 | CSP meta tag, no violations | e2e passed on Android Chrome and iPhone Safari emulation with no CSP violations or console errors, including switching the toggle and opening number, subscript and stacked trace pages. The CSP and referrer tags are unchanged. |
| 5 | Every request to the site's own origin | e2e passed on both browsers. The only URLs in the bundle are still XML namespace strings and React/Tailwind comment links. |

Review notes:
- New routes (#/subscript, #/both, #/trace/:order/subscript or /both, #/trace/number/:digit) are matched whole. Forms come only from a fixed list, and ឡ's subscript routes fall back home because the letter has no subscript. Anything else goes home.
- The toggle calls `location.replace` with one of three fixed hashes, so it never navigates anywhere else and adds no history entries.
- The CSV's new `subscript` column accepts only `yes` or `no` and becomes a boolean in letters.ts.

## 2026-10-30 · Phase 1 live

Deployed from commit 53a63d4 (Kim pushed it) to https://lmnx.github.io/trace-khmer-alphabets/. Checks 1 to 3 are in the entry below, run before the push.

| # | Check | Result |
| --- | --- | --- |
| 4 | CSP meta tag, no violations, HTTPS | The live `index.html`, JS and CSS are byte-for-byte identical to a local build, so the CSP and referrer tags come first in `<head>`. The browser pane's console was empty at 375 px, on the grid and after tapping a tile to `#/trace/28`. `http://` gets a 301 redirect to `https://`. |
| 5 | Every request to the site's own origin | The page, one JS file, one CSS file and two fonts, all from `lmnx.github.io/trace-khmer-alphabets/`. No other origins. |

- CI run 41076050209: "Check and build" (Playwright: 12 passed) and "Deploy to GitHub Pages" both succeeded. The only other annotations are the known `ubuntu-latest` → Ubuntu 26 notices.
- Live grid at 375 px: 33 tiles (15 first series, 18 second series), every letter shown in Kantumruy Pro, no sideways scroll.
- Phone check on iOS Safari and Android Chrome: waiting on Kim.

## 2026-10-30 · Phase 1 (Letter data and grid)

Run before pushing. Checks 4 and 5 ran against the local production build, and need repeating on the live site after the push.

| # | Check | Result |
| --- | --- | --- |
| 1 | `npm audit --omit=dev` | 0 vulnerabilities. Full `npm audit`, dev included: 0. No dependency changes this phase. |
| 2 | `npm outdated`, Dependabot PRs | Only `typescript` (6.0.3, latest 7.0.2). Still held: typescript-eslint 8.72.1 is the latest and still needs TypeScript below 6.1. No open PRs. |
| 3 | `/security-review` | No findings. The skill's diff showed only the unpushed docs commit 96f2619, because Phase 1 wasn't committed yet, so the review covered the working tree as well (`git diff` plus the new files). CLAUDE.md now says to commit before running it. |
| 4 | CSP meta tag, no violations | The built `index.html` starts `<head>` with the CSP and referrer tags, unchanged. e2e passed on Android Chrome and iPhone Safari emulation with no CSP violations or console errors. The browser pane's console was empty at 375 px. |
| 5 | Every request to the site's own origin | e2e passed on both browsers. In the browser pane: the page, one JS file, one CSS file and two fonts, all from the same origin. The only URLs in the bundle are XML namespace strings and React/Tailwind comment links. |

Review notes:
- `npm run letters` writes TypeScript source from the hand-edited `letters.csv`. Every string goes through `JSON.stringify`, and every row is checked first: the header, consecutive order, one character that matches its code point, no duplicates, a Latin-only name and series 1 or 2. A bad edit fails with the line number instead of reaching the app. The script runs only on a developer's machine, and `npm test` (so CI too) fails if `letters.ts` is out of date with the CSV.
- No new dependencies: the generator runs on Node 26's built-in TypeScript support.
- Tiles render the letter and its name as React text. Each `href` comes from `traceHref` and a number. The router still accepts only `#/trace/1` to `#/trace/33`, now bounded by the letter list.

## 2026-10-30 · Phase 0 live

First deploy, from commit 1608b42, to https://lmnx.github.io/trace-khmer-alphabets/.

| # | Check | Result |
| --- | --- | --- |
| 1 | `npm audit --omit=dev` | No dependency changes since the entry below. CI ran `npm audit signatures` and `npm audit --omit=dev --audit-level=high` and passed. |
| 2 | `npm outdated`, Dependabot PRs | Dependabot's first npm and Actions scans ran and opened no PRs. |
| 3 | `/security-review` | Nothing to review: everything is pushed, and the skill only reviews changes not yet on GitHub. The manual review below covers 1608b42. From Phase 1 on, run it before pushing (now in CLAUDE.md). |
| 4 | CSP meta tag, no violations, HTTPS | The live `index.html` is byte-for-byte identical to a local build, so it carries the CSP and referrer tags first in `<head>`. The browser console was empty at 375 px. `http://` gets a 301 redirect to `https://`. GitHub Pages sends no HSTS header and can't be made to. |
| 5 | Every request to the site's own origin | The page, one JS file, one CSS file and two fonts, all from `lmnx.github.io/trace-khmer-alphabets/`. No other origins. |

- CI run 41045011075: "Check and build" and "Deploy to GitHub Pages" both succeeded. The only annotations are GitHub notices that `ubuntu-latest` is moving to Ubuntu 26, which needs nothing from us yet. If `playwright install --with-deps` ever breaks on the new image, pin `runs-on: ubuntu-24.04` until Playwright catches up.
- Repo settings, confirmed by Kim: the repo is public, Pages is deployed from GitHub Actions, and HTTPS is enforced. Dependabot alerts, secret scanning, push protection and "Require actions to be pinned to a full-length commit SHA" are all on.
- Phone check: Kim confirmed ក renders in Kantumruy Pro on their phone.

## 2026-10-30 · Phase 0 (Setup)

Not yet on GitHub, so checks 4 and 5 ran against the local production build. They need repeating on the live site after the first deploy.

| # | Check | Result |
| --- | --- | --- |
| 1 | `npm audit --omit=dev` | 0 vulnerabilities. Full `npm audit`, dev included: 0. `npm audit signatures`: 192 packages have verified registry signatures, 88 have verified attestations. |
| 2 | `npm outdated`, Dependabot PRs | Only `typescript` (6.0.3, latest 7.0.2). It is held back on purpose: typescript-eslint 8.72.1, the latest, supports TypeScript below 6.1. Dependabot ignores TypeScript 6.1 and later until that changes. There are no Dependabot PRs yet, since there's no GitHub repo. |
| 3 | `/security-review` | The skill can't run yet because it diffs against `origin/HEAD` and there's no remote. Reviewed by hand instead (see below). Run the skill once the repo is on GitHub. |
| 4 | CSP meta tag, no violations, HTTPS | The built `index.html` starts `<head>` with the CSP and `referrer: no-referrer` meta tags, before any script or stylesheet. e2e on Android Chrome (Pixel 7) and iPhone Safari (iPhone 15) emulation: no CSP violations. A planted inline script made the suite fail, so the guard works. Enforce HTTPS: waiting for the repo settings. |
| 5 | Every request to the site's own origin | e2e fails on any request to another origin. It passed on both browsers. A manual check in the browser pane found only same-origin requests (the page, one JS file, one CSS file, two font files). |

Manual review of every new file:
- CSP is exactly as in CLAUDE.md, with no loosening. It is added only to production builds, and a unit test pins the policy and rejects `unsafe-*`, wildcards and other origins.
- No HTML injection sinks. ESLint now fails on `dangerouslySetInnerHTML`, `innerHTML`/`outerHTML`, `insertAdjacentHTML`, `document.write`, `eval` and `new Function`, and on `localStorage`/`sessionStorage` outside `src/lib/progress.ts`. Each rule was checked against a deliberately bad file.
- The hash router accepts only `#/` and `#/trace/1` to `#/trace/33` and sends anything else home. React renders the number as text.
- No URLs to other origins in the source or the build. The only ones in the bundle are XML namespace strings and React/Tailwind comment links, which never become requests.
- Workflow: every action is pinned to a full commit SHA with its version in a comment. The default permission is `contents: read`. Only the deploy job gets `pages: write` and `id-token: write`, and it runs only on pushes to main. Checkout uses `persist-credentials: false`. The workflow triggers on `pull_request`, never `pull_request_target`. No secrets or tokens, and no `${{ }}` expressions inside `run` scripts. CI runs `npm ci`, `npm audit signatures` and `npm audit --omit=dev --audit-level=high` before the tests.
- Dependabot: weekly updates for npm and GitHub Actions, grouped by area, with a 7-day cooldown so a hijacked release has time to be pulled before we take it. Security updates skip the cooldown.
- Dependencies: exact versions (`.npmrc` save-exact) and the lockfile is committed. `npm install-scripts ls`: no packages with install scripts, so none were approved. `package.json` is `private`, so it can't be published to npm by accident.
- Fonts came from Google Fonts (`fonts.gstatic.com`). Each was checked to be a valid woff2 of the expected size, and its SHA-256 is recorded in docs/credits.md.

Open items:
- No `frame-ancestors` until the custom domain (a meta CSP can't set it). Tracked in the workplan risks.
- `npm run dev -- --host` serves the source to the whole Wi-Fi network. Use it only on a trusted network.
- After the first deploy, repeat checks 4 and 5 on the live URL and run `/security-review`.
