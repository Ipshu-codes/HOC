# Justified text: version A vs version B

Captured on 17 Nov 2026 in Microsoft Edge (headless) from the strict `npm run build`, branch `feat/justify-text`. The floating buttons and the sticky bar are hidden so they don't cover the text.

- **Version A:** justified at all widths.
- **Version B:** justified from 768 px, left-aligned on phones. This is the default.

The switch is one line in `src/app/globals.css`, just under the comment "ONE SETTING":
`@media (width >= 48rem) {` for B, `@media all {` for A.

| File | What it shows |
|---|---|
| `<page>-<lang>-375-A.jpg`, `<page>-<lang>-375-B.jpg` | Phones: version A (justified) next to version B (left-aligned) |
| `<page>-<lang>-768.jpg`, `<page>-<lang>-1440.jpg` | Tablet and desktop: justified in both versions, so one picture each |

Pages: `home`, `nanak-math`, `mhepi-ajima`. Languages: `en`, `ne`.

## What is justified

- Running paragraphs on the heritage pages and the photo descriptions in the heritage list.
- The Overview and About text on the home page.
- The place panel text on the 3D map.

The last line of each paragraph stays left-aligned. Headings, lists, captions, buttons, nav, footer, the chatbot and the cards are not justified. English uses `hyphens: auto`; Nepali has no hyphenation, because browsers don't support it.

## Browser checks

108 of 108 checks pass for both versions, EN and NE, at 375, 768 and 1440 px on the three pages. They check that:
- the right paragraphs are justified, or left-aligned on phones in B;
- the last line stays left;
- English hyphenates and Nepali doesn't;
- headings, lists, nav, footer, buttons and captions are never justified.

## Large word gaps (3× a normal space or more)

**Note:** the test browser (headless Edge on Windows) has no hyphenation dictionary, so these English results are with no hyphenation. Phones (Chrome on Android, Safari on iPhone) hyphenate English, so English gaps there will be smaller. Nepali never hyphenates, so its gaps are as measured.

**Phones, version A (375 px):** most paragraphs have gaps of 3–6×. The worst:
- EN Mhepi Ajima, "The temple is looked after by the Mhepi Conservation and Management Committee (…)": 10.3×. The long Nepali name in brackets can't break.
- EN home, About ("Ward No. 16 is one of the 32 administrative wards…"): 8.9×.
- EN Nanak Math, "The math is run and managed by its mahant…": 8.7×.
- EN Mhepi Ajima, "Buddhists and Hindus both worship here…": 7.7×.
- NE Nanak Math, "महायोगी श्री ब्रह्महरिदासजी महाराजको परिसरभित्र पूर्वी भागमा…": 6.3×.
- NE Mhepi Ajima, "पुरोहितका अनुसार अष्टमातृकामध्ये म्हेपी उत्तर दिशामा पर्छ…": 5.8×.

**Version B on phones:** none, because the text is left-aligned.

**768 px (both versions):**
- EN home About: 4.9×.
- EN Nanak Math, "The living bhu-samadhi temple…" (a heritage list description beside its photo): 4.6×.
- NE home About: 3.9×.
- EN home Overview: 3.0×.
- EN Nanak Math, "The Vishnu Panchayatan temple…": 3.1×.

**1440 px:** no paragraph reaches 3×.

**Recommendation:** use version B. Phone columns are too narrow for even spacing, especially in Nepali.
