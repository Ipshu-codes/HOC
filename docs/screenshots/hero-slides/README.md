# Home page hero: one screenshot per slide

Captured on 17 Nov 2026 in Microsoft Edge from the strict `npm run build`, branch `feature/hero-slideshow`, at 375 px (phone) and 1440 px (desktop). Files: `NN-<site>-<photo>-<375|1440>.jpg`, in slideshow order. Each shows the real hero (gradient, title, buttons) with that slide's photo and focal point. The sticky bar and floating buttons are hidden.

## Choosing the crop

Each slide in `content/home.json` → `heroSlides` has an optional `position`: its focal point, as a CSS object-position. The second number is how far down the photo the visible strip sits: `0%` = top, `50%` = middle, `100%` = bottom. On desktop a tall photo shows only about a third of its height, and the lower part of that is under the red gradient, so a smaller number keeps roofs and spires in view.

| # | Photo | Focus now | What stays in view on desktop |
|---|---|---|---|
| 1 | Nanak Math courtyard | `center 40%` | tiled roof, carved windows |
| 2 | Mhepi Ajima temple and courtyard shrine | `center 15%` | the temple's two roofs |
| 3 | Nanak Math main courtyard | `center 30%` | the buildings round the courtyard |
| 4 | Mhepi Ajima main gate | `center 40%` | the gate and its "म्हेपी अजिमा" sign |
| 5 | Nanak Math samadhi temple | `center 20%` | the white spire |
| 6 | Mhepi Ajima temple front | `center 30%` | the roofs |
| 7 | Nandi & Shivalinga | `center 50%` | the deity, trishul and paddy field |
| 8 | Nanak Math traditional building | `center 35%` | carved windows and eaves |
| 9 | Mhepi Ajima large tree | `center 40%` | the tree |

"Mhepi Ajima, inner shrine" was taken out on 17 Nov 2026 until the priest agrees; see MISSING_INFO.md.

## Data use (measured)

- **Only the next photo downloads ahead:** one at a time, about 1.5 s after a photo appears, never all at once. Nothing downloads ahead while paused.
- **Data Saver, 2G or slow 2G** (`navigator.connection`, in Chrome, Edge and Android browsers):
  - the first photo only;
  - no slideshow, no preloading, no pause button.
- **60 seconds on a phone-sized screen** (375 px, 2× display), page left at the top: **2.3 MB transferred in total**. The slideshow photos are **1.3 MB** of that: the first photo at 38 KB, then one photo about every 7.5 s, 93–317 KB each. The rest is the page itself (scripts, fonts, other images).
