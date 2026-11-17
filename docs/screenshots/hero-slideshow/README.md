# Home page hero slideshow

Captured on 17 Nov 2026 in Microsoft Edge from the strict `npm run build`, branch `feature/hero-slideshow`. The sticky bar and floating buttons are hidden in the pictures.

| File | What it shows |
|---|---|
| `hero-en-1440-slide1.jpg`, `hero-en-375-slide1.jpg` | The first photo, Nanak Math's courtyard, which loads with the page |
| `hero-en-1440-slide2.jpg`, `hero-en-375-slide2.jpg` | 6 seconds later: Mhepi Ajima's temple and courtyard shrine has faded in. The pause button is at the top right |

**The 10 photos** (`content/home.json` → `heroSlides`) alternate between the two sites:
1. Nanak Math courtyard
2. Mhepi Ajima temple and courtyard shrine
3. Nanak Math main courtyard
4. Mhepi Ajima main gate
5. Nanak Math samadhi temple
6. Mhepi Ajima temple front
7. Nandi & Shivalinga
8. Mhepi Ajima inner shrine
9. Nanak Math traditional building
10. Mhepi Ajima large tree

`carved-windows` is left out, because it was ruled out for the hero in the Phase 4 review (identifiable people).

**Behaviour:**
- Only the first photo loads with the page.
- Each next photo downloads in the background and fades in once it has loaded, every 6 seconds. Nothing changes in a background tab.
- The pause/play button is 44 px and its name changes between "Pause" and "Play".
- For visitors who prefer reduced motion, the slideshow starts paused and switches without a fade.
- Only the photo on screen is exposed to screen readers.

**Checks:** 29/29 slideshow checks pass, EN + NE at 375 and 1440 px plus reduced motion. The earlier suites pass: 72/72 nav, footer and Overview checks and 58/58 header checks. The alignment audit finds 0 issues.
