# Justified text (from 1024 px)

Captured on 17 Nov 2026 in Microsoft Edge (headless) from the strict `npm run build`, branch `feat/justify-text`. The floating buttons and the sticky bar are hidden so they don't cover the text.

**Chosen: version B, starting at 1024 px** (Tailwind's `lg` breakpoint). Running paragraphs are justified from 1024 px. Phones and tablets (375 and 768 px) stay left-aligned.

The switch is one line in `src/app/globals.css`, just under the comment "ONE SETTING":
- `@media (width >= 64rem) {` is live: justified from 1024 px.
- `@media all {` would justify at every width (version A, not chosen).

| File | Width |
|---|---|
| `<page>-<lang>-375.jpg` | Phone: left-aligned |
| `<page>-<lang>-768.jpg` | Tablet: left-aligned |
| `<page>-<lang>-1024.jpg` | Small laptop: justified |
| `<page>-<lang>-1440.jpg` | Desktop: justified |

Pages: `home`, `nanak-math`, `mhepi-ajima`. Languages: `en`, `ne`.

## What is justified

From 1024 px:
- running paragraphs on the heritage pages and the photo descriptions in the heritage list;
- the Overview and About text on the home page;
- the place panel text on the 3D map.

The last line of each paragraph stays left-aligned. Headings, lists, captions, buttons, nav, footer, the chatbot and the cards are never justified. English uses `hyphens: auto`; Nepali has no hyphenation, because browsers don't support it.

## Browser checks

72 of 72 checks pass, EN and NE, at 375, 768, 1024 and 1440 px, on the three pages. They check that:
- paragraphs are left-aligned below 1024 px and justified from 1024 px;
- the last line stays left;
- English hyphenates and Nepali doesn't;
- headings, lists, nav, footer, buttons and captions are never justified.

## Word gaps of 2.5× a normal space or more

**Note:** the test browser (headless Edge on Windows) has no hyphenation dictionary, so these English results are with no hyphenation. Desktop Chrome, Edge and Safari download a dictionary and hyphenate English, so English gaps there will be smaller. Nepali never hyphenates, so its gaps are as measured.

### 1024 px

The largest gaps are in the heritage list descriptions. Next to their photos, those columns are only about 60% of the text width:
- EN Nanak Math, "Image of Sankatmochan Siddha Hanuman at the foot of the peepal…" (list item): **7.3×**
- EN Nanak Math, "The Nandeshwar Mahadev temple, Shivalaya and Nandi statue…" (list item): **5.4×**
- NE Nanak Math, "झिँगटीको छाना भएका परम्परागत दुई तले भवनहरूले घेरिएको मठको चोक…" (list item): **4.1×**
- EN Nanak Math, "Courtyard of the math enclosed by traditional two-storey buildings…" (list item): 3.6×

Running paragraphs:
- EN Nanak Math, "In VS 1450 Mahayogi Shri Brahmaharidas Ji Maharaj came to the…": **4.0×**
- NE Nanak Math, "यस मठमा प्राचीनकालदेखि नै नेपाली गुरु शिष्य परम्पराका…": 3.3×
- NE Nanak Math, "विष्णु पञ्चायतन देवता र ग्रन्थहरूको पूजा, पाठ…": 3.1×
- EN Nanak Math, "According to the math, it has existed since ancient times…": 3.0×
- NE Nanak Math, "साधुसन्तको तपस्थलीका रूपमा प्राचीनकालदेखि रहिआएको…": 2.9×
- EN Nanak Math: "The guru–disciple tradition…", "A maharaj who lives here performing havan…" (list item), "The living bhu-samadhi temple…" (list item), "The math is run and managed…" (2.6–2.8×)
- EN home, About ("Ward No. 16 is one of the 32 administrative wards…"): 2.8×
- NE Mhepi Ajima, "मन्दिर सानो वनयुक्त थुम्को माथि छ…": 2.8×
- EN Mhepi Ajima, "No historical documents about the temple…": 2.7×
- EN Mhepi Ajima, "The temple bhajan…": 2.5×
- NE Mhepi Ajima, "यहाँ बौद्ध र हिन्दु दुवै धर्मावलम्बी…": 2.5×
- EN Nanak Math, "Puja and readings for the Vishnu Panchayatan deities…": 2.5×

### 1440 px

- EN Nanak Math, "The living bhu-samadhi temple…" (list item): 2.8×
- EN Nanak Math, "Paddy, wheat, maize, greens and vegetables…": 2.5×

No Nepali paragraph reaches 2.5× at 1440 px.

### 375 and 768 px

None: the text is left-aligned at these widths.

For comparison, the earlier run with justifying from 768 px measured up to 4.9× at 768 px. Justifying at every width measured up to 10× on phones.

**If the list gaps at 1024 px bother you:** one more line in the CSS could keep the heritage list descriptions (`.heritage-prose .item-desc`) left-aligned until 1280 px. It isn't done here.
