# Nanak Math: photos beside "यहाँ भएका सम्पदाहरू" / "The Heritage Here"

Captured on 17 Nov 2026 in Microsoft Edge from the strict `npm run build`, branch `feat/en-sync-heritage-photos`.

| File | What it shows |
|---|---|
| `heritage-here-en-375.jpg`, `heritage-here-ne-375.jpg` | Phones: the item's text first, the photo underneath |
| `heritage-here-en-768.jpg`, `heritage-here-ne-768.jpg` | From 768 px: text on the left, photo on the right |
| `heritage-here-en-1440.jpg`, `heritage-here-ne-1440.jpg` | Desktop, start of the section |
| `heritage-here-en-1440-list.jpg`, `heritage-here-ne-1440-list.jpg` | The whole list: text left and photo right for every item with a photo; items without a photo stay plain |

Nine items have a photo, set in `content/section-photos.json`. Each photo:
- is lazy-loaded with the usual responsive sizes;
- has rounded corners;
- uses the alt text from that language's gallery;
- links to the Nanak Math photos in the gallery.

Each item's number stays at the start of its text, in the same column as the numbers of items without a photo.

Browser checks (33/33, no page errors), at 375, 768 and 1440 px in EN and NE:
- the section heading;
- nine photos, text left and photo right from 768 px, text then photo on phones;
- lazy loading, alt text, rounded corners and the gallery link;
- no Sources section;
- the new English name.
