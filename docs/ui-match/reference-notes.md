# UI match: reference notes

Study of the two reference sites before rebuilding (brief: "our data, their layout").
Branch `feat/ui-match`. Captured 18 Nov 2026 with a headless browser at **1440 × 900** and **375 × 812**,
scrolling a third of a screen per frame, plus timed frame sequences (0 / 80 / 160 / 260 / 420 / 800 ms)
for hovers, clicks and transitions. Measurements are the browser's computed styles.

- Screenshots for this note: `docs/ui-match/reference/` (**git-ignored**: they show the artists' work, so
  they stay on this computer and are never committed or published).
- Full captures (every frame, measurement JSON, contact sheets): the session scratchpad, `study/`, `sheets/`.
- We copy **no** code, text, images, logos or artwork. Only layout, proportions and behaviour are rebuilt,
  with our photos and our words.

---

## 1. Biegajaca (biegajaca-sztuka.pl/en) → home, heritage pages, map wrapper, contact

### 1.1 System (measured)

| Thing | Measured | Notes |
|---|---|---|
| Ground | flat light grey, slight paper grain | one ground everywhere except one dark band |
| Text colour | near-black | |
| Accent | hot pink fill on the main button; deep pink for hover/active text | |
| Grid | 12 columns, column ≈ 93 px, gap 24 px at 1440; side gutter ≈ 32 px (2.2 vw) | full-width layout, no centred max-width box |
| Section padding | ≈ 79 px top/bottom (5.5 vw) at 1440 | |
| Headings | heavy (900) condensed grotesque, **italic, all capitals**, tracking ≈ −0.5 %, line-height 0.92–1.05 | h1 138 px, h2 52–144 px, h3 43–60 px at 1440; about 40 % of that at 375 |
| Labels | 12 px monospace, capitals, +0.24 px tracking | breadcrumbs, counters, meta lines, buttons, footer column titles |
| Body | 16–18 px grotesque, line-height 1.6, measure 370–480 px | short paragraphs |
| Buttons | square corners, 1 px border, mono 12 px capitals, padding 15 × 22 px (large) / 10 × 14 px (small) | primary: pink fill, dark text; secondary: outline. Hover swaps fill and text colour, 0.25 s; press 0.16 s cubic-bezier(0.16, 1, 0.3, 1) |
| Header | **fixed**, transparent, 68 px; 3-column grid: MENU (left) · name in two lines (centre) · languages + "Get in touch" outline button (right) | no visible nav links on desktop or phone |
| Menu | full-screen near-black panel drops from the top (~260 ms), then links in huge italic capitals (≈ 81 px) rise into place one by one (~420–800 ms); Instagram line at the bottom | [opening](reference/b-1440-10-menu-opening.jpg), [open](reference/b-1440-10b-menu-open.jpg) |
| Footer | brand (italic) + tagline + mono address; 4 link columns with mono titles; legal links in mono; a **giant wordmark** across the full width at the bottom; mono copyright line | [footer](reference/b-1440-09-footer.jpg) |
| Link hover | underline slides in from the left (0.35 s, cubic-bezier(0.16, 1, 0.3, 1)) | |
| Floating | small "Cookies" tab fixed at the left edge | (ours: Map button bottom-left, Nani bottom-right stay) |

### 1.2 Home, section by section

| # | Their section | What it is (1440) | Phone (375) | Screens |
|---|---|---|---|---|
| 1 | **Hero ("wall")** | 100svh. Torn grey paper over 4 vertical photo strips (360 × 900 each, 0.4 ratio); some strips black-and-white. A cursor "paints" colour into the wall (**the game we skip**). Giant h1 in two lines, each on its own cream paper strip, tilted ~1°. Short subtitle on a small cream box, bottom left. Two buttons bottom right (pink + cream). A small tilted sticker top right. | Strips become 2 columns, h1 smaller, buttons stacked full width | [1440](reference/b-1440-01-hero.jpg) · [375](reference/b-375-01-hero.jpg) |
| 2 | **Works carousel** ("01 / 09") | Section ≈ 5.8 screens tall with a **pinned** inner stage: scrolling down moves through the works. Left column (4/12): h2, one sentence, hairline row "01 / 09 —— status", work title (35 px italic), mono meta line, buttons ← → (square, 47 × 39) and a pink "see the works". Right (8/12): the painting large (≈ 875 × 610), the next one peeking at the right edge. Change: the old painting slides left and **fades to grey**, the new one comes in from the right (~400 ms). | Same, stacked: heading top, picture middle, meta + arrows bottom; still pinned | [1440](reference/b-1440-02-works-carousel.jpg) · [mid-change](reference/b-1440-02b-carousel-transition.jpg) · [375](reference/b-375-02-works-carousel.jpg) |
| 3 | **Materials (hover to reveal)** | Left: h2 (66 px), short p, then 4 big italic rows (80 px tall, hairline between). Right: two photos side by side (481 + 300 px) and a caption. **Hover a row**: the row turns deep pink and the photos change with a quick wipe (~160–260 ms), caption changes. | Rows first, photos below | [1440](reference/b-1440-03-materials.jpg) · [wipe](reference/b-1440-03b-materials-hover-wipe.jpg) · [done](reference/b-1440-03c-materials-hover-done.jpg) · [375](reference/b-375-03-materials.jpg) |
| 4 | **Dark band** | Near-black band. Pink mono label, giant centred italic h2 (115 px, 3 lines), short centred p, outline button. **Cursor trail**: moving the mouse drops small framed photos (4:5, 187 × 234) that fade out. | Photos shown scattered and tilted, no trail | [1440](reference/b-1440-04-dark-band.jpg) · [trail](reference/b-1440-04b-dark-band-cursor-trail.jpg) · [375](reference/b-375-04-dark-band.jpg) |
| 5 | **Commissions (fanned prints)** | Centred h2 (86 px). A fan of 4 square prints (252–270 px, white border, shadow, tilted −8°…+8°) that spreads as it scrolls in. Below: two columns (6/12 each) with a hairline on top, h3 (43 px) + p + outline button each. Small mono note centred. | Fan full width; columns stack | [1440](reference/b-1440-05-commissions-fan.jpg) · [375](reference/b-375-05-commissions.jpg) |
| 6 | **Exhibitions list** | Mono intro label, then full-width rows: title in huge italic capitals on the left, mono meta on the right, hairline between rows (rows 133 px). **Hover**: title turns deep pink (0.2 s) and a tilted framed photo follows the cursor. Paragraph + outline "all" button under the list. | Title then meta stacked, no preview | [1440](reference/b-1440-06-exhibitions.jpg) · [hover](reference/b-1440-06b-exhibitions-hover-preview.jpg) · [375](reference/b-375-06-exhibitions.jpg) |
| 7 | **How it works (steps)** | h2 (86 px) left. 3 rows with a hairline above each: step title in big italic (60 px, 8/12 columns) left, short p (4/12) right. | Title, small mono line, p stacked | [1440](reference/b-1440-07-how-it-works.jpg) · [375](reference/b-375-07-how-it-works.jpg) |
| 8 | **Closing call to action** | Giant h2 (144 px), last word **outlined** (stroke only). Mono sticker. p left; pink + outline buttons right; mono note. | Same, stacked | [1440](reference/b-1440-08-closing-cta.jpg) · [375](reference/b-375-08-closing-cta.jpg) |
| 9 | **Footer** | see 1.1 | 2 link columns, wordmark still full width | [1440](reference/b-1440-09-footer.jpg) · [375](reference/b-375-09-footer.jpg) |

Other pages used as models:

- **Work page** ([top](reference/b-1440-20-work-page.jpg), [enquiry](reference/b-1440-21-work-page-enquiry.jpg), [more works](reference/b-1440-22-work-page-more-works.jpg), [375](reference/b-375-20-work-page.jpg)): mono breadcrumb; left 7/12 a **sticky** photo with two thumbnails under it; right 5/12: mono status, h1 (≈ 52 px italic), a spec list (mono label left, value right, hairlines), the story in short paragraphs, an enquiry form, mono "before you decide" links. Then "more works": a fanned stack of photos left, title + meta + ← → + button right.
- **Exhibitions page** ([top](reference/b-1440-30-exhibitions-page.jpg), [highlights](reference/b-1440-31-exhibitions-highlights.jpg), [by year](reference/b-1440-32-exhibitions-by-year.jpg)): giant h1, short p; "upcoming" cards with huge date numbers; "highlights" rows with photos beside; a full list grouped by year (year left, date mono, title italic, meta mono).
- **Contact page** ([top](reference/b-1440-40-contact.jpg), [form](reference/b-1440-41-contact-form.jpg), [375](reference/b-375-40-contact.jpg)): mono breadcrumb, sticker, giant h1, short p, hairline; left 8/12 form, right 4/12 mono labels with details (handle, where, reply time in big italic).
- **Commission page, process** ([cards](reference/b-1440-50-process-cards.jpg)): a pinned section where a huge sliding line of text passes behind numbered **step cards** (photo on top, step title, short text) that land one by one.
- **Works grid** ([grid](reference/b-1440-60-works-grid.jpg)): 4 columns of portrait photos, mono title + status + meta under each.

### 1.3 Motion summary (Biegajaca)

| Interaction | Timing (measured) |
|---|---|
| Button hover (fill/text swap) | 0.25 s; press transform 0.16 s cubic-bezier(0.16, 1, 0.3, 1) |
| Exhibition row hover (colour) | 0.2 s cubic-bezier(0.4, 0, 0.2, 1) |
| Materials row hover (colour) / photo wipe | 0.15 s / ~0.2–0.26 s |
| Footer link underline | 0.35 s cubic-bezier(0.16, 1, 0.3, 1) |
| Menu panel / links | ~0.26 s drop, links staggered to ~0.8 s |
| Carousel change | ~0.4 s slide + fade to grey |
| Header | fixed from the start, transparent, no change on scroll |

---

## 2. Shutabug (shutabug.com) → our gallery page

Their "gallery page" = a collection page (`/shop/prints/<collection>`), which has the Gallery / List switch.

| Part | What it is | Measured | Screens |
|---|---|---|---|
| Ground and nav | off-white; nav 67 px with a hairline under it | | |
| Page header | small mono "← all collections" link, title centred (42 px display face), description centred in small mono (11 px, line-height 1.75, grey) with "Read more +" | title box 608 px wide | [gallery](reference/s-1440-01-gallery-view.jpg) |
| Gallery / List switch | pill at the top right under the nav: 1 px grey border, radius 999 px, padding 3 px; two buttons mono 11 px capitals, +1.54 px tracking, padding 6.7 × 13.6 px; active one ink fill with light text; colour change 0.16 s | 148 × 32 px | |
| **Gallery view** | Prints **hang from a sagging string** across the screen, each on a short peg, slightly tilted. **Scrolling down moves the line sideways** (a conveyor; the page itself does not move). The print in the middle is the current one; its title and price sit bottom left ("TITLE — $50"), a counter bottom right ("02 —— 67", mono, with a hairline), a mono hint under it. Hover: the print sways. 4 prints visible at 1440, about 1½ at 375. | prints ≈ 270 × 380 at 1440 (≈ 3:4), ≈ 200 × 280 at 375 | [start](reference/s-1440-01-gallery-view.jpg) · [scrolled](reference/s-1440-02-gallery-scrolled.jpg) · [375](reference/s-375-01-gallery-view.jpg) |
| **How a photo opens** | Click the middle print: everything else fades out (~80 ms), the print **glides and grows** to the left half of the page (~260 ms, settles by ~800 ms), then its page fills in on the right (back link, title, description, details). Below: related prints in a 4-column grid ("you may also like"). It is a new URL. | big photo 517 × 714 | [80 ms](reference/s-1440-03a-open-80ms.jpg) · [260 ms](reference/s-1440-03b-open-260ms.jpg) · [done](reference/s-1440-03c-open-done.jpg) · [below](reference/s-1440-04-opened-more.jpg) · [375](reference/s-375-03-opened.jpg) |
| **List view** | Header turns left-aligned with the full description and a hairline under it. Rows: photo (368 px wide, 3:4) · title · price · arrow, as a grid with 40 px gaps, padding 24 px top/bottom; no borders; hover tints the whole row grey (0.16 s). Rows arrive with photos sharpening from a blur (~0.8–1.4 s). | phone: photo 184 px, gap 17.6 px, padding 20 px | [arriving](reference/s-1440-05-list-arriving.jpg) · [list](reference/s-1440-06-list-view.jpg) · [hover](reference/s-1440-07-list-row-hover.jpg) · [375](reference/s-375-06-list-view.jpg) |
| Filter | No filter on a collection page; collections are separate pages, listed on an index page ([index](reference/s-1440-08-collections-index.jpg)). | | |
| Choice remembered | the Gallery / List choice carries across pages | | |

Their type faces (a display face and a serif) are paid fonts, so we cannot use them; see decision D3.

---

## 3. Mapping: their sections → our pages, our content

Rule: every word stays as it is in `content/` and `src/i18n/` (checked by `scripts/text-lock.ts` after
every build). Whole blocks may move. Where their layout has a text spot we have no text for, the spot is
dropped (listed in section 4).

### 3.1 Home (`/en/`, `/ne/`), in their order

| Their section | → Our section | Our content used |
|---|---|---|
| Header (MENU · name · languages + "Get in touch") | site header | logo + ward name + city (BrandLink), language toggle, `nav.menu` button, `nav.contact` as the outline button; the menu panel lists our `getNavItems` links (Overview, About, Heritages, Gallery, Contact) |
| 1 Hero wall | Hero | 4 strips from `home.json → heroSlides` (2 on phones), `home.heroTitle` as the giant h1 on paper strips, `home.heroSubtitle` in the small box, buttons `home.explore` + `home.viewMap`. Grey-to-colour: the strips start grey and colour in one after another on load (no cursor game). |
| 2 Works carousel "01 / 09" | **Gallery** section, moved up | `home.galleryTitle` (h2), `home.galleryIntro` (sentence), the 9 photos (`galleryPreview`, covers excluded): each photo's caption (alt) as the work title, its site name as the meta line; ← → (existing `home.carousel` labels), `home.seeAll` as the pink button. Pinned and scroll-driven on desktop and phones; under reduced motion a plain arrow carousel. |
| 3 Materials (hover rows swap photos) | **Heritage sites** | `home.heritagesTitle` (h2); rows = the site names (2 rows); hover/focus/tap a row → its cover + one more photo appear on the right, with the site's `summary` + `location` as the caption; `home.readMore` link per site. |
| 4 Dark band (+ cursor trail) | **About Ward No. 16** | `home.aboutTitle` giant centred, `home.aboutIntro`, the facts list (`aboutMunicipality` …) as mono rows, the ward illustration; cursor trail of our gallery photos on desktop with a mouse (static scattered photos on phones; none under reduced motion). Background: ink (our darkest colour). |
| 5 Commissions (fan + 2 columns) | **Overview** | `home.overviewTitle` centred; the fan = Nani's namaste, the ward logo and the ward profile map as 3 tilted prints (the map stays a link to its largest file); the two columns = `overviewIntro` and `overviewNext` paragraphs. |
| 6 Exhibitions list | (not on home: we have no list here) → used on heritage pages for **Festivals & Jatras** | |
| 7 How it works | (not on home) → used on heritage pages for **How to Visit** | |
| 8 Closing call to action | **Contact** | `home.contactTitle` giant (last word outlined: in EN "Contact" is one word, so the whole word; in NE likewise), `home.contactIntro`, the existing address / phone / email items and the `home.contactButton` pink button. |
| 9 Footer + giant wordmark | footer | ward name moved into the giant wordmark (moved, not repeated), city, office address/phone/email in mono, link columns under the existing titles `footer.office`, `footer.quickLinks`, `footer.heritages`; copyright line. |

### 3.2 Heritage pages (`/heritage/mhepi-ajima/`, `/heritage/nanak-math/`) → their work page

| Their part | → Ours | Content |
|---|---|---|
| Breadcrumb (mono) | the existing `heritage.backToAll` link, in mono | |
| Sticky photo + thumbnails (left 7/12) | the cover photo, sticky while the facts scroll, with up to 2 thumbnails from the site's gallery (click = show that photo there) | gallery photos + alt |
| h1 + spec list (right 5/12) | `name` (h1, italic capitals in EN), `nameNe`/`name` as the second line, **QuickFacts** as the spec list (mono labels, hairlines), `heritage.viewOnMap` button | |
| Story text | History, Legends & Beliefs, Architecture / The Heritage Here, Present Day: big italic h2s (works-page size), paragraphs at their measure; section photos (`section-photos.json`) keep text left / photo right | markdown unchanged |
| Exhibitions list (home §6) | **Festivals & Jatras** list: each item's bold name as the huge italic row title, the rest of the item as the mono/plain meta on the right; hairlines; hover turns the title deep red | list items unchanged |
| How it works (home §7) / process cards | **How to Visit**: each list item a step row: its bold label ("Where:", "Daily puja:" …) as the big italic step title with a number (01, 02 …), the rest as the text on the right | list items unchanged |
| Works grid | **Photos**: 4-column portrait grid with mono captions, `heritage.seeAllPhotos` button, photo credit | |
| More works (fanned stack + ← → + button) | **Other heritage**: the other site's photos as a fan, its name + summary, `home.readMore` | |
| Table of contents | mono list on the left of the story, sticky | `heritage.onThisPage` |

### 3.3 Map page wrapper (`/map/`)

Their page-top pattern (mono breadcrumb, giant italic h1, short p), then the 3D map full width; sidebar
labels in mono, place names in italic capitals, buttons in their button style. The map itself and its
controls are unchanged (CLAUDE.md map rules stay).

### 3.4 Contact page (`/contact/`)

Their contact page: giant h1 (`contactPage` title), intro p, hairline; left 8/12 the "write to us" block
with the email `mailto:` as the pink button; right 4/12 the office details as mono labels with values
(address, phone, email, office hours if present). No form (project rule).

### 3.5 Gallery page (`/gallery/`) → Shutabug collection page

| Theirs | → Ours |
|---|---|
| Centred title + small mono description | `gallery.title` centred, `gallery.intro` in small mono centred, photo credit (`PhotoCredit`) under it |
| Collections (separate pages) | our **site filter** (All / Mhepi Ajima / Nanak Math) as small mono tabs centred under the description, like their "← all collections" line |
| Gallery / List pill top right | ours, restyled to their measurements; remembered for the visit (already) |
| Hanging line, scroll moves it sideways, middle print current | our photos (`thumb` files) on a drawn string; the page scroll drives the line (sticky stage); caption (alt) + site name bottom left; counter "01 —— 53" bottom right; keyboard ← → and swipe move one print |
| Click middle print → glides into a detail view | a photo view with the same glide: photo left (large file), right: back button (`gallery.lightbox.Close`), site name, caption, photo credit; ← → keys, swipe, Esc; focus stays inside and returns to the print |
| "You may also like" grid | other photos of the same site under the photo view (their captions) |
| List rows (photo 3:4 · title · price · arrow) | photo · caption · site · year (`credits.json → photos.year`, the one date we have) · arrow; hover tint; photos sharpen from blur as they arrive |
| Count | `gallery.count` |

---

## 4. Spots where their layout has text we don't have (dropped, never invented)

| Where | Their text spot | What we do |
|---|---|---|
| Hero | tilted sticker top right; "Skip intro" | dropped |
| Works carousel | status ("available"/"sold") | dropped |
| Heritage sites (materials) | short paragraph under the h2 | left empty (no intro exists) |
| About (dark band) | small label above the heading; outline button | dropped |
| Overview (commissions) | h3 above each of the two columns; buttons; mono note | dropped |
| How to Visit (steps) | small mono line under each step title | dropped |
| Festivals (exhibitions) | mono intro label; paragraph + "all" button under the list | dropped |
| Contact (closing CTA) | sticker; small mono note under the buttons | dropped |
| Footer | tagline; legal links (privacy, terms …) | dropped |
| Heritage page | status label; "the story of …" label; enquiry form; "before you decide" links | dropped (no forms on our site) |
| Contact page | sticker; topic chips; form fields | dropped |
| Gallery | "← all collections" link; "Read more +"; the hint under the counter; price; "add to bag", "view in room", "get the collection", "you may also like" headings | dropped (site + year shown instead of price; the related grid has no heading) |

---

## 5. Decisions before building (please choose)

- **D1 Hero slideshow → static strips.** Their hero is a still wall of 4 photo strips; ours is a timed
  slideshow with a pause button (CLAUDE.md rule). Matching means 4 still strips (2 on phones) that turn from
  grey to colour once on load, and no slideshow. *Proposed: yes.*
- **D2 Pinned, scroll-driven carousel.** Theirs takes ~6 screens of scrolling. Matching it: yes, with
  arrows and keyboard as well, and a plain carousel under reduced motion. *Proposed: yes.*
- **D3 Fonts (English).** Biegajaca's look rests on a heavy condensed italic grotesque + a mono. Closest
  free Google fonts: **Archivo** (900 italic headings, 400 body) + **JetBrains Mono** (labels) — Archivo is
  also the face they use, which is a free public font, not their branding. Alternative: **Bricolage
  Grotesque** (your earlier pick; no italic) + JetBrains Mono. Nepali stays **Mukta** in both (upright: a
  slanted Devanagari reads badly). Shutabug's faces are paid, so the gallery uses the same fonts as the
  rest of the site. Cost: ~65 KB of Latin fonts on English pages (now 22 KB).
- **D4 Menu instead of the nav row.** Their header has no visible links, only MENU → full-screen menu.
  Matching it replaces the sketch's red nav row (CLAUDE.md) on every width. *Proposed: yes.*
- **D5 How a gallery photo opens.** Matching Shutabug means our own photo view (glide-in, photo left,
  details right, related photos below) in place of the current lightbox library; keyboard, swipe, Esc and
  focus handling are rebuilt and tested. *Proposed: yes.*
- **D6 Colours (red theme first).** Their grey ground → our **sand**; text → **ink**; their pink button →
  **crimson** (white text, 5.88:1); their deep-pink hover text → **brick**; their dark band → **ink**;
  Shutabug's off-white → **cream**. Then one extra home screenshot in Biegajaca's own palette: near-black
  ground with our crimson as the accent.
- **D7 Screenshots stay local.** `docs/ui-match/reference/` and `docs/ui-match/compare/` are git-ignored
  (they contain the reference artists' work).

## 6. Text lock (proof that no word changes)

- Baseline taken **before** building: `docs/ui-match/text-baseline.json` (14 text source files hashed,
  12 pages EN + NE, 12,133 words) and readable copies in `docs/ui-match/text-before/`.
- `npm run build` and `npm run build:preview` now end with `tsx scripts/text-lock.ts check`. It fails if any
  file in `content/` or `src/i18n/` changes, or if any page gains or changes a word. A removed word fails
  unless it is listed in `docs/ui-match/text-allow-removed.json` with a reason (an element the layout
  dropped). Moved blocks pass and are reported.
- Tested: changing one word in a built page fails the check; the untouched build passes.
