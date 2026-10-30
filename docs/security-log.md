# Security log

The security checks from CLAUDE.md, run at the end of every phase and before sharing a link. Newest first. Each entry records the date, the results, any fixes, and every loosening of the CSP with its reason.

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
