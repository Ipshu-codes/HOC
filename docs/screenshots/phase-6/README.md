# Phase 6 — gallery screenshots

Captured on 12 Nov 2026 in Microsoft Edge. Unless noted otherwise, they are from `npm run build:preview` (Mhepi Ajima draft excluded).

| File | What it shows |
|---|---|
| `gallery-en-375.jpg`, `gallery-en-768.jpg`, `gallery-en-1440.jpg` | Gallery page in English: 31 Nanak Math photos with captions |
| `gallery-ne-375.jpg`, `gallery-ne-768.jpg`, `gallery-ne-1440.jpg` | The same in Nepali |
| `lightbox-en-375.jpg`, `lightbox-ne-375.jpg` | The lightbox open on a phone, with the caption and the photo credit |
| `dev-gallery-two-sites-en-1440.jpg` | `npm run dev` with both sites at `/en/gallery/?site=mhepi-ajima`. The filter tabs appear only when two or more sites are on the build. |

These pages use the larger base font size (17 px on phones, 18 px from 768 px). The Phase 4 and Phase 5 screenshots were taken before that change.

**Behaviour checked in the browser:**

- Before a photo is opened, only the 640 px thumbnails are requested.
- The lightbox loads the 1280/1920 px files on 3× phones and on desktop.
- The arrow keys and swiping change the photo, and Escape closes the lightbox.
- Focus returns to the thumbnail of the last photo viewed.

In the full-page captures the sticky nav is drawn in its normal place, and lazy images are loaded before capture.
