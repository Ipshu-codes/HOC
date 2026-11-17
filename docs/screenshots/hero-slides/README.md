# Home page hero: one screenshot per slide

Captured on 17 Nov 2026 in Microsoft Edge from the strict `npm run build`, branch `feature/hero-slideshow`, at 375 px (phone) and 1440 px (desktop). Files: `NN-<site>-<photo>-<375|1440>.jpg`, in slideshow order. Each shows the real hero (gradient, title, buttons) with that slide's photo and focal point. The sticky bar and floating buttons are hidden.

## Timing

- **Interval:** each photo stays **3 s** (`content/home.json` → `heroIntervalMs`: 3000), counted from when it appears. The fade is **0.6 s**, so each photo is fully visible for about 2.4 s.
- **Loop:** after slide 10 it continues with slide 1, forever. Each new photo fades in on top of the previous one, which stays fully visible underneath, so there is no blank frame or jump, including at the wrap-around.
- **Unchanged:**
  - the pause/play button;
  - the slideshow starts paused for reduced-motion visitors;
  - with Data Saver, 2G or slow 2G it shows the first photo only, with no rotation and no preloading.

## Choosing the crop

Each slide in `content/home.json` → `heroSlides` has an optional `position`: its focal point, as a CSS object-position. The second number is how far down the photo the visible strip sits: `0%` = top, `50%` = middle, `100%` = bottom. On desktop a tall photo shows only about a third of its height, and the lower part of that is under the red gradient.

| # | Photo | Focus now | What stays in view on desktop |
|---|---|---|---|
| 1 | Nanak Math courtyard | `center 40%` | tiled roof, carved windows |
| 2 | Mhepi Ajima temple and courtyard shrine | `center 15%` | the temple's two roofs |
| 3 | Nanak Math main courtyard | `center 30%` | the buildings round the courtyard |
| 4 | Mhepi Ajima main gate | `center 40%` | the gate and its "म्हेपी अजिमा" sign |
| 5 | Nanak Math samadhi temple | `center 20%` | the white spire |
| 6 | Mhepi Ajima temple front | `center 30%` | the roofs |
| 7 | Mhepi Ajima inner shrine | `center 70%` | the deity in the golden arch, above the title |
| 8 | Nandi & Shivalinga | `center 50%` | the deity, trishul and paddy field |
| 9 | Nanak Math traditional building | `center 35%` | carved windows and eaves |
| 10 | Mhepi Ajima large tree | `center 40%` | the tree |

Slide 7, the inner shrine, is back with the chief priest's consent: approved, priest, 2026-11-17, recorded in `content/photo-consent.json`.

## Checks (25/25)

At 375 and 1440 px, in EN and NE, sampled every 100 ms for 45 s:
- the slides run in order and loop back (1 → 10 → 1 → …), about 3.0 s each;
- a fully visible photo is on screen at every sample, about 1,650 in all, including the wrap-around;
- the fade is 0.6 s;
- at most one photo is downloaded ahead of the one on screen, and slide 1 isn't downloaded again after the loop.

Also checked: pause, reduced motion (starts paused, nothing preloaded), and Data Saver / 2G / slow 2G (first photo only, no button).

## Data use (measured)

60 seconds on a phone-sized screen (375 px, 2× display), page left at the top: **2.5 MB transferred in total**. The slideshow photos are **1.47 MB** of that:
- the first photo at 38 KB;
- then one photo every 3 s, 93–317 KB each;
- all 10 are in by about 25 s;
- the second loop downloads nothing more, because the photos stay loaded.

The rest is the page itself: scripts, fonts and other images.
