# Nanak Math: photos beside "यहाँ भएका सम्पदाहरू" / "The Heritage Here"

Captured on 17 Nov 2026 in Microsoft Edge from the strict `npm run build`, branch `feat/en-sync-heritage-photos`.

| File | What it shows |
|---|---|
| `heritage-here-en-375.jpg`, `heritage-here-ne-375.jpg` | Phones: the photo sits above the item's text |
| `heritage-here-en-768.jpg`, `heritage-here-ne-768.jpg` | From 768 px: photo and text side by side |
| `heritage-here-en-1440.jpg`, `heritage-here-ne-1440.jpg` | Desktop, start of the section |
| `heritage-here-en-1440-list.jpg`, `heritage-here-ne-1440-list.jpg` | The whole list: photos alternate left and right; items without a photo stay plain |

Nine items have a photo, set in `content/section-photos.json`. Each photo:
- is lazy-loaded with the usual responsive sizes;
- has rounded corners;
- uses the alt text from that language's gallery;
- links to the Nanak Math photos in the gallery.

The item number moves to the start of the item's text, so it doesn't line up with the bottom of the photo.

Browser checks (33/33, no page errors), at 375, 768 and 1440 px in EN and NE:
- the section heading;
- nine photos, alternating from 768 px and stacked on phones;
- lazy loading, alt text, rounded corners and the gallery link;
- no Sources section;
- the new English name.
