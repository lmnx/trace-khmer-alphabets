# Phase 6: Monetization

Planned 2026-10-30 · runs after Phase 5 ships. Nothing here gets built before then.

## Audience

Aksor is for anyone of any age who wants to learn Khmer script. It is not directed at children. US law (COPPA) judges that from the content and the marketing, not from intent alone, so:

- Market it as "learn Khmer script" for all ages, not as a kids' app.
- If analytics or feedback show many young children using it, serve only non-personalised ads.

## 1. Bottom banner

- One slot, a fixed height at the bottom of the screen, with its height reserved so the page never jumps when it loads.
- Show it on the home grid and the results screen. Leave it off the trace screen: there it would sit next to Undo, Clear and Done and invite accidental taps, which ad networks also ban.
- Fill it first with house ads for our own printables and books: a self-hosted image and a link. That needs no third-party code, and the CSP stays unchanged.
- Add an ad network only once traffic justifies it. Before switching one on:
  - Custom domain (playaksor.app) and an `ads.txt` file at its root.
  - A privacy policy, and a certified consent banner for visitors from the EEA and UK.
  - The CSP opened only for that network's domains, with the reason logged in docs/security-log.md.
  - Lighthouse rerun on mobile, still at 90 or higher.
- No pop-ups, video, sound or rewarded ads.

## 2. Printable PDFs

- A free sample sheet in the app, and paid packs: consonants, numerals, subscripts, and vowels once they exist.
- Generated from letters.csv and Kantumruy Pro, so the printed letters always match the app. The font's OFL license allows embedding it in PDFs and printed books that are sold.
- Render with headless Chromium (Playwright's PDF output). Many PDF libraries shape Khmer wrongly: subscripts and vowel positions break. A native speaker checks each pack before it goes on sale.
- Sell through a hosted store with digital delivery, such as Gumroad, Payhip or Etsy. Payments and card details never touch our site.

## 3. Tracing practice books

- The same PDF pipeline, printed on demand (Amazon KDP or Lulu) for buyers abroad. For Cambodia, print locally, since shipping from abroad costs too much.
- Embed every font in the print PDF. KDP rejects files that don't.

## 4. Personalised gift books

A tracing book built around one person: their name in Khmer on the cover and as the first tracing pages, a dedication from the giver, and the letters of their name taught first. It suits new babies and weddings in diaspora families, and "learn with grandma" gifts.

- **Spelling risk:** writing a foreign name in Khmer is not mechanical, and a misspelled name on a gift is worse than no gift. Either a native speaker checks every name, or the buyer types the name in Khmer.
- **Start manual:** sell through Etsy's personalisation field, make each PDF from a template, and send it to print. Automate only once it sells.
- **Automation later** needs a backend, which breaks the static-site rule, so it runs as a separate service:
  - An order service on the VPS (Docker Compose behind Nginx Proxy Manager).
  - Hosted checkout (such as Stripe Checkout) and a print-on-demand API (such as Lulu's).
  - Orders hold names, addresses and messages. That needs a privacy policy, order data deleted after delivery, and validated, rate-limited order forms.

## Before selling anything

- [ ] Buy playaksor.app.
- [ ] Check that "Aksor" is not a registered trademark in the main markets.
- [ ] A native speaker reviews every product before it goes on sale.
