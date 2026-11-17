# Justified text (from 1024 px)

Captured on 17 Nov 2026 in Microsoft Edge (headless) from the strict `npm run build`, branch `feat/justify-text`. The floating buttons and the sticky bar are hidden so they don't cover the text.

**Chosen: version B, starting at 1024 px** (Tailwind's `lg` breakpoint). Running paragraphs are justified from 1024 px. Phones and tablets (375 and 768 px) stay left-aligned. The heritage list descriptions next to their photos sit in a narrower column, so they wait until **1280 px** (`xl`).

The switch is one line in `src/app/globals.css`, just under the comment "ONE SETTING":
- `@media (width >= 64rem) {` is live: running text is justified from 1024 px.
- `@media all {` would justify at every width (version A, not chosen).

The list descriptions have their own block below it: `@media (width >= 80rem)`.

| File | Width |
|---|---|
| `<page>-<lang>-375.jpg` | Phone: left-aligned |
| `<page>-<lang>-768.jpg` | Tablet: left-aligned |
| `<page>-<lang>-1024.jpg` | Small laptop: running text justified, list descriptions left-aligned |
| `<page>-<lang>-1280.jpg` | Laptop: all justified |
| `<page>-<lang>-1440.jpg` | Desktop: all justified |

Pages: `home`, `nanak-math`, `mhepi-ajima`. Languages: `en`, `ne`.

## What is justified

From 1024 px:
- running paragraphs on the heritage pages and the photo descriptions in the heritage list;
- the Overview and About text on the home page;
- the place panel text on the 3D map.

The last line of each paragraph stays left-aligned. Headings, lists, captions, buttons, nav, footer, the chatbot and the cards are never justified. English uses `hyphens: auto`; Nepali has no hyphenation, because browsers don't support it.

## Browser checks

90 of 90 checks pass, EN and NE, at 375, 768, 1024, 1280 and 1440 px, on the three pages. They check that:
- running text is justified from 1024 px and the list descriptions from 1280 px, left-aligned below that;
- the last line stays left;
- English hyphenates and Nepali doesn't;
- headings, lists, nav, footer, buttons and captions are never justified.

## Word gaps of 2.5× a normal space or more

**Note:** the test browser (headless Edge on Windows) has no hyphenation dictionary, so these English results are with no hyphenation. Desktop Chrome, Edge and Safari download a dictionary and hyphenate English, so English gaps there will be smaller. Nepali never hyphenates, so its gaps are as measured.

### 1024 px

Running text only; the list descriptions are left-aligned at this width, so their earlier 3.6–7.3× gaps are gone.
- EN Nanak Math, "In VS 1450 Mahayogi Shri Brahmaharidas Ji Maharaj came to the…": **4.0×**
- NE Nanak Math, "यस मठमा प्राचीनकालदेखि नै नेपाली गुरु शिष्य परम्पराका…": 3.3×
- NE Nanak Math, "विष्णु पञ्चायतन देवता र ग्रन्थहरूको पूजा, पाठ…": 3.1×
- EN Nanak Math, "According to the math, it has existed since ancient times…": 3.0×
- NE Nanak Math, "साधुसन्तको तपस्थलीका रूपमा प्राचीनकालदेखि रहिआएको…": 2.9×
- EN home, About ("Ward No. 16 is one of the 32 administrative wards…"): 2.8×
- EN Nanak Math, "The guru–disciple tradition has come down from Lord Shri Ram…": 2.8×
- NE Mhepi Ajima, "मन्दिर सानो वनयुक्त थुम्को माथि छ…": 2.8×
- EN Mhepi Ajima, "No historical documents about the temple…": 2.7×
- EN Nanak Math, "The math is run and managed by its mahant…": 2.6×
- EN Nanak Math, "Puja and readings for the Vishnu Panchayatan deities…": 2.5×
- EN Mhepi Ajima, "The temple bhajan…": 2.5×
- NE Mhepi Ajima, "यहाँ बौद्ध र हिन्दु दुवै धर्मावलम्बी…": 2.5×

### 1280 px

- EN Nanak Math, "The living bhu-samadhi temple…" (list item): 2.8×
- EN Nanak Math, "Paddy, wheat, maize, greens and vegetables…": 2.5×

### 1440 px

Same as 1280 px: "The living bhu-samadhi temple…" (list item) at 2.8× and "Paddy, wheat, maize…" at 2.5×. No Nepali paragraph reaches 2.5× at 1280 or 1440 px.

### 375 and 768 px

None: the text is left-aligned at these widths.

For comparison, earlier runs measured up to 4.9× when justifying from 768 px, and up to 10× when justifying at every width.
