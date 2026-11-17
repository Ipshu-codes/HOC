# Heritage list photos, ward illustration and alignment

Captured on 17 Nov 2026 in Microsoft Edge from the strict `npm run build`, branch `feat/en-sync-heritage-photos`.

| File | What it shows |
|---|---|
| `home-en-375-full.jpg`, `home-en-768-full.jpg`, `home-en-1440-full.jpg` (and `home-ne-…`) | The whole home page. From 768 px, the KMC emblem (`wardlogo.png`) sits beside the Overview text and the ward illustration (`wardlogo1.png`) beside the About Ward No. 16 text, in the same column; on phones the emblem is above its text and the illustration below. The small 3D Map button (bottom-left) and Nani (bottom-right) show in the first screen. Each image is stitched from screen-height captures, with the sticky header and the floating buttons shown once only. |
| `heritage-here-en-375.jpg`, `heritage-here-ne-375.jpg` | Nanak Math, "The Heritage Here" on phones: the item's text first, the photo underneath |
| `heritage-here-en-768.jpg`, `heritage-here-ne-768.jpg`, `heritage-here-en-1440.jpg`, `heritage-here-ne-1440.jpg` | From 768 px: text on the left, photo on the right |
| `heritage-here-en-1440-list.jpg`, `heritage-here-ne-1440-list.jpg` | The whole list |

**The heritage list** (`content/section-photos.json`):
- Nine items have a photo, and all nine show the photo's gallery description under the title, word for word in the page language. Item 11's was turned on after confirmation.
- The Tulsi Math keeps its four sub-shrines under its description.
- Photos are equal in width and level with the titles. Every item's number lines up with the numbers of items without a photo.

**Browser checks:** 61/61 heritage-list and home checks plus 58 header, emblem and button checks pass, with no page errors, at 375, 768 and 1440 px (button spacing also at 320 and 1024) in EN and NE. They cover:
- the section heading and the nine photos;
- the layout: text and photo positions, lazy loading, alt text, rounded corners and the gallery link;
- the descriptions on all nine items;
- the Tulsi Math's sub-shrines;
- photo widths and tops;
- the size and name of the 3D Map button: a 44 px tap area with a 40 px circle on phones, a slim pill from 768 px, as far from the edges as Nani, no overlap;
- the header brand: one link home on every page, named, with a focus outline; smooth scroll to the top on the home page, instant with reduced motion;
- the Overview emblem beside or above the text;
- the ward illustration;
- no Sources section, and the new English name.

**Alignment audit:** 0 issues on every page (home, both heritage pages, gallery, contact, map), at all three widths, in both languages. It checks:
- one content width with the same left and right edges;
- headings and text blocks on that edge;
- equal card heights in each row;
- equal photo widths and aligned tops;
- no sideways scrolling.
