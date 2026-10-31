# Credits

The source and licence of every font, sound and voice clip in the app. The About page is built from this file (Phase 5).

## Fonts

**Kantumruy Pro** by Tep Sovichet and Wei Huang. Copyright 2022 The Kantumruy Pro Project Authors.

- Licence: SIL Open Font License 1.1, shipped alongside the fonts as `public/fonts/OFL.txt`.
- Project: https://github.com/sovichet/kantumruy-pro
- Google Fonts page: https://fonts.google.com/specimen/Kantumruy+Pro
- Downloaded on 2026-10-30 from Google Fonts (`fonts.gstatic.com/s/kantumruypro/v12/`), as listed by the Google Fonts CSS API for `Kantumruy Pro:wght@100..700`. These are variable fonts covering weights 100 to 700, normal style only, split by character set. The licence came from https://github.com/google/fonts/tree/main/ofl/kantumruypro.

| File | Characters | Bytes | SHA-256 |
| --- | --- | --- | --- |
| `public/fonts/kantumruy-pro-khmer.woff2` | Khmer | 57,076 | `f8ee79dd98953b4a4e67fe11de8721edce9eb5de907038ba1e71b5966ee1b326` |
| `public/fonts/kantumruy-pro-latin.woff2` | Basic Latin | 33,336 | `f0b30ec9afb65d8cfbdd35306214ca205ccce216c0fcfe374f03a2d530704b09` |
| `public/fonts/kantumruy-pro-latin-ext.woff2` | Extended Latin | 2,128 | `4017f8cd388437eb306f12b7d972ef7f955d86f269744f2176f7cb9f7f44dec1` |
| `public/fonts/OFL.txt` | Licence text | 4,396 | `7b300b8a1e2e9d7cddb68859551f1ad54a05019eff28da02e3be811c1257f0a7` |

No other fonts. Latin text uses Kantumruy Pro too.

## Logo and icons

The Aksor logo, app icon and favicons were drawn for this project on 2026-10-30. They contain no third-party artwork or font outlines. The mark follows Kantumruy Pro's ក (a bar over an arch) but is built from lines and an arc, and the wordmark "aksor" is drawn in single strokes. The shapes are in `src/lib/brand.ts`, and `npm run icons` writes `public/icon.svg`, `public/favicon.svg`, `public/logo.svg` and the PNG icons from them. The small line icons on the buttons (`src/components/icons.tsx`) were also drawn for the project.

## Night sky and badges

Drawn for this project on 2026-10-31, with no third-party artwork. The night sky's one constellation (`src/components/NightSky.tsx`) is a rumduol, Cambodia's national flower, seen from above and computed in code: a ring of stars at the heart, three small rounded inner petals closing into a dome, and three broad, pointed, slightly curled outer petals, hidden where the inner ones cover them. Its 43 stars are spaced along the visible edges, joined by lines that follow the petals' curves. It was drawn from the flower's general form, not traced from a photo or an emblem. **Still to do:** the reviewer checks that it reads as a rumduol. The stars on the score card and tiles (`src/components/Stars.tsx`) were drawn for the project too.

The badges (`src/components/BadgeShelf.tsx`) are solid icons drawn for the project on 2026-10-31, one per tier of a growing flower: a seed in the soil with its first sprout, a closed bud on a leafy stem, the rumduol in bloom seen from above, and an apsara, a celestial dancer, as a bust in a tiered crown hung with flowers, with a flower garland and one hand raised and bent back. They replaced medals the same day, and the bust replaced an earlier full-figure apsara that Kim found too thin. It is drawn in flat shapes, not traced from a photo of a carving, a performance, or any organisation's emblem. **Still to do:** the native-speaker reviewer checks that the apsara, her crown, flowers and hand are respectful and read as an apsara, and that the rumduol icon reads as a rumduol, like every other piece of Khmer content.

## Sound effects

Made for this project on 2026-10-31, with no recordings, samples or third-party sounds. Every sound is synthesized in the browser by `src/lib/audio.ts` with the Web Audio API, from plain oscillators and volume envelopes written in code: a short falling tick as each stroke ends, a bell chime per star (a note with two overtones at a bell's ratios, on G, C and E), and a fanfare (a rising C major run into a held chord with a bell on top). The app ships no sound files, so there is nothing to license.

## Letter voice clips

None yet. Kim pushed the AI letter voices back from Phase 5 on 2026-10-31 (see "Later: letter voices" in docs/workplan.md). When they come, record the voice, the service, its terms and the reviewer's approval here.

## Review

The native-speaker reviewer who checks every letter's shape, name and audio will be credited here, with their permission.
