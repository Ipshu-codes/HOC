# Phase 9 — contact form, 404, Lighthouse

Captured on 13 Nov 2026 in Microsoft Edge from `npm run build:preview`.

| File | What it shows |
|---|---|
| `contact-success-en-375.jpg` | The contact form after a successful send. The Web3Forms request was intercepted in the test browser, so nothing was actually sent. |
| `contact-no-key-en-375.jpg`, `contact-no-key-ne-1440.jpg` | The contact page as it looks when `NEXT_PUBLIC_WEB3FORMS_KEY` is not set: the ward email and phone instead of the form |
| `404-375.jpg` | The bilingual 404 page (any unknown URL) |

## Lighthouse (mobile, simulated slow 4G, local server with compression)

| Page | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| `/en/` | 89 | 100 | 96 | 100 |
| `/ne/heritage/nanak-math/` | 80 | 100 | 96 | 100 |
| `/en/gallery/` | 82 | 100 | 96 | 100 |
| `/en/map/` | 69 | 100 | 96 | 100 |
| `/en/contact/` | 100 | 100 | 96 | 100 |

**Best practices 96 everywhere:** the only failing check is console 404s for Next.js prefetch files. That is the Windows-only export bug in DEPLOY.md and should disappear on Cloudflare's Linux build.

**Performance below 90:**

- **Home, detail and gallery:** the largest image (hero, cover or first thumbnail) arrives at about 4–5 s on simulated slow 4G.
- **Map:** the test browser has no GPU, so MapLibre's WebGL work runs on the CPU (about 28 s of blocking time).
- See the Phase 9 report for the options.
