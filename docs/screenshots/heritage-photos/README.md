# Heritage list photos, ward illustration and alignment

Captured on 17 Nov 2026 in Microsoft Edge from the strict `npm run build`, branch `feat/en-sync-heritage-photos`.

| File | What it shows |
|---|---|
| `home-en-375-full.jpg`, `home-en-768-full.jpg`, `home-en-1440-full.jpg` (and `home-ne-…`) | The whole home page. The ward illustration (raw-data `wardlogo1.png`) sits beside the About Ward No. 16 text from 768 px and under it on phones. Each image is stitched from screen-height captures, with the sticky header and floating buttons hidden so they don't repeat. |
| `heritage-here-en-375.jpg`, `heritage-here-ne-375.jpg` | Nanak Math, "The Heritage Here" on phones: the item's text first, the photo underneath |
| `heritage-here-en-768.jpg`, `heritage-here-ne-768.jpg`, `heritage-here-en-1440.jpg`, `heritage-here-ne-1440.jpg` | From 768 px: text on the left, photo on the right |
| `heritage-here-en-1440-list.jpg`, `heritage-here-ne-1440-list.jpg` | The whole list |

**The heritage list** (`content/section-photos.json`):
- Nine items have a photo. Items 2–9 show the photo's gallery description under the title, word for word in the page language.
- Item 11 shows its title only, because its photo's description doesn't clearly match the item (see MISSING_INFO.md).
- The Tulsi Math keeps its four sub-shrines under its description.
- Photos are equal in width and level with the titles. Every item's number lines up with the numbers of items without a photo.

**Browser checks:** 67/67 pass, with no page errors, at 375, 768 and 1440 px in EN and NE. They cover:
- the section heading and the nine photos;
- the layout: text and photo positions, lazy loading, alt text, rounded corners and the gallery link;
- the descriptions, and title only for item 11;
- the Tulsi Math's sub-shrines;
- photo widths and tops;
- the size and name of the 3D Map button;
- the ward illustration;
- no Sources section, and the new English name.

**Alignment audit:** 0 issues on every page (home, both heritage pages, gallery, contact, map), at all three widths, in both languages. It checks:
- one content width with the same left and right edges;
- headings and text blocks on that edge;
- equal card heights in each row;
- equal photo widths and aligned tops;
- no sideways scrolling.
