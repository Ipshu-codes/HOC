# Phase 9 — contact form, 404, Lighthouse

Captured on 13 Nov 2026 in Microsoft Edge from `npm run build:preview`.

| File | What it shows |
|---|---|
| `contact-success-en-375.jpg` | The contact form after a successful send. The Web3Forms request was intercepted in the test browser, so nothing was actually sent. |
| `contact-no-key-en-375.jpg`, `contact-no-key-ne-1440.jpg` | The contact page as it looks when `NEXT_PUBLIC_WEB3FORMS_KEY` is not set: the ward email and phone instead of the form |
| `404-375.jpg` | The bilingual 404 page (any unknown URL) |

## Chatbot, Nani and map (Phase 9 review)

| File | What it shows |
|---|---|
| `chat-start-en-1440.jpg`, `chat-start-ne-1440.jpg` | The opening view: four quick questions, then "Visiting Nanak Math", "About Nanak Math", "Contact the ward office", "About this website" and "My question isn't here" last |
| `chat-directions-en-1440.jpg`, `chat-directions-ne-1440.jpg` | "How do I get there?": the location in words, the approximate note, "View on 3D Map", the OpenStreetMap directions link and "Read more" |
| `chat-about-topic-en-1440.jpg`, `chat-about-topic-ne-1440.jpg` | "About Nanak Math", with questions ordered by `priority` |
| `nani-round-home-hero-1440.jpg`, `nani-round-home-hero-375.jpg` | Round Nani while the home hero is on screen |
| `nani-big-home-scrolled-1440.jpg`, `nani-big-home-scrolled-375.jpg` | The big figure once the hero has scrolled away |
| `nani-round-detail-1440.jpg`, `nani-round-gallery-1440.jpg`, `nani-round-contact-1440.jpg`, `nani-round-map-1440.jpg` | Round Nani on the other pages (the big figure covered the TOC, the first photos, the form and the map) |
| `chat-open-768-map-button-hidden.jpg` | At 768 px the 3D Map button steps aside while the chat is open |
| `map-phone-preview-412.jpg` | A direct visit to the map on a phone: still picture and "Show 3D map" |

## Lighthouse

Mobile, simulated slow 4G, measured locally on 13 Nov 2026 (Windows, Edge, `npm run build:preview` served with compression). Median of three runs, range in brackets; the same page varies by up to ±4 points between runs here.

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/en/` | 88 (86–90) | 100 | 96 | 100 |
| `/ne/` | 91 (85–92) | 100 | 96 | 100 |
| `/en/heritage/nanak-math/` | 87 (87–88) | 100 | 96 | 100 |
| `/en/gallery/` | 85 (83–85) | 100 | 96 | 100 |
| `/en/map/` | 88 (86–89) | 100 | 96 | 100 |
| `/en/contact/` | 100 (99–100) | 100 | 96 | 100 |

Before the Phase 9 image and map work: home 89, detail 80, gallery 82, map 69.

**Why some pages stay slightly under 90 :**

- **Map:** on phones a direct visit now shows the still preview picture, and the map loads only on request or when arriving from another page of the site. What remains is the page's own JavaScript and fonts on simulated slow 4G.
- **Home, detail and gallery:** the largest image is now the 960 px (or 480/640 px thumbnail) file, discovered early with high priority, with no layout shift. LCP stays around 3.7–4.4 s because, on the simulated 1.6 Mbps connection, the photo shares the line with the fonts (Mukta and Playfair) and the React/Next.js JavaScript. Going further would mean removing the photo from the first screen or dropping a font; both change the agreed design.
- **Best practices 96:** console 404s for prefetch files, from the Windows-only export bug described in DEPLOY.md. They should disappear on Cloudflare's Linux build.
- Check the live site with PageSpeed Insights (https://pagespeed.web.dev) after the preview deploy: Cloudflare's CDN, HTTP/2/3 and Brotli usually score better than this local test.
