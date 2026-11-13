# DEPLOY.md

The full step-by-step deployment guide is written in Phase 11. This file collects deployment notes as they come up.

## Preview deploy now (Cloudflare Pages, free)

Mhepi Ajima was published on 13 Nov 2026, so nothing is a draft any more and Cloudflare uses the strict **`npm run build`**. It checks the content first (`check-content`) and the output after (`verify-output`). (`npm run build:preview` is only needed again if a site is ever put back in draft.) No credit card is needed at any step.

1. **Push the code to GitHub.** Cloudflare builds from the repository, not from this computer.
   ```
   git push origin main
   ```
   The repository is `https://github.com/Ipshu-codes/HOC`. Images in `public/images/` are committed; the raw data (`ward16-heritageraw-data/`) is not and is not needed for the build.
2. **Sign in** at https://dash.cloudflare.com (create a free account with an email address if needed).
3. In the left menu, open **Workers & Pages** → **Create** → choose the **Pages** tab → **Import an existing Git repository** (labels may differ slightly; pick *Pages*, not *Workers*).
4. **Connect GitHub**: authorise the "Cloudflare Workers and Pages" GitHub app, ideally for the `HOC` repository only, then select `Ipshu-codes/HOC` → **Begin setup**.
5. **Set up builds and deployments:**
   - **Project name:** e.g. `ward16-heritage`. The site will be at `https://ward16-heritage.pages.dev`.
   - **Production branch:** `main`
   - **Framework preset:** `Next.js (Static HTML Export)`, or `None`; the two fields below are what matter.
   - **Build command:** `npm run build`
   - **Build output directory:** `out`
   - **Root directory:** leave empty.
6. **Environment variables** (same screen, *Environment variables (advanced)*):
   - `SITE_URL` = `https://ward16-heritage.pages.dev` (use your project name; no trailing slash). It makes link previews (Open Graph images) point at the real site.
   - `NEXT_PUBLIC_WEB3FORMS_KEY` = the key from https://web3forms.com (optional now; without it the contact page shows the email address instead of the form).
   - Node.js: the repository's `.node-version` file asks for Node 22, so nothing to set. If the build log shows another version, add `NODE_VERSION` = `22`.
7. **Save and Deploy.** The first build takes a few minutes. The log should end with `✔ verify-output: no placeholders; 0 draft site(s) fully excluded; … images free of metadata.` If you change an environment variable later, redeploy: **Deployments** → latest → **⋯** → **Retry deployment**.
8. **Check the preview** at `https://<project>.pages.dev`:
   - `/` redirects to `/en/`; the EN | ने switch works.
   - Both Nanak Math and Mhepi Ajima appear, in English and Nepali, and the walking route on the map has both stops.
   - The section below (*Prefetch files on Windows builds*).
   - On a phone, open `/en/map/` directly: you should see the still picture with **Show 3D map**. Tap the floating **3D Map** button from another page: the map loads at once.
   - Run Lighthouse (Chrome DevTools → Lighthouse → Mobile) on the live URL; local scores on Windows are noisy (see below).

Every later `git push` to `main` redeploys automatically. If the project was already set up with `npm run build:preview`, change it to `npm run build` under **Settings → Build → Build configuration**.

## Lighthouse (Phase 9)

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

**Why some pages stay slightly under 90 (accepted in the Phase 9 review):**

- **Map:** on phones a direct visit now shows the still preview picture, and the map loads only on request or when arriving from another page of the site. What remains is the page's own JavaScript and fonts on simulated slow 4G.
- **Home, detail and gallery:** the largest image is now the 960 px (or 480/640 px thumbnail) file, discovered early with high priority, with no layout shift. LCP stays around 3.7–4.4 s because, on the simulated 1.6 Mbps connection, the photo shares the line with the fonts (Mukta and Playfair) and the React/Next.js JavaScript. Going further would mean removing the photo from the first screen or dropping a font; both change the agreed design.
- **Best practices 96:** console 404s for prefetch files, from the Windows-only export bug below. They should disappear on Cloudflare's Linux build.
- Check the live site with PageSpeed Insights (https://pagespeed.web.dev) after the preview deploy: Cloudflare's CDN, HTTP/2/3 and Brotli usually score better than this local test.

## Map preview picture

Phones that open the 3D map page directly first see a still picture (`public/images/map/preview*.webp`) and a **Show 3D map** button, because the map downloads about 4 MB (≈1 MB of map code, ≈3.5 MB of map and terrain tiles). Visitors who arrive from a link on the site get the map at once. The picture is a screenshot of this map taken from a production build (draft sites never appear in it); retaken on 13 Nov 2026 with Mhepi Ajima, Nanak Math and the ward office, stored in raw-data as `map-preview/map-preview.png` and built by `npm run optimize-images` (`map/preview` in `scripts/image-manifest.json`). Retake it whenever the places on the map change, at 1100×1200 px with device scale 2, with the zoom/fullscreen buttons and Nani hidden and the attribution line kept.

## Build settings (Cloudflare Pages)

- **Build command:** `npm run build`. This is the strict build: it refuses to run while any content is a draft or contains `[PLACEHOLDER`/`[TODO`. `npm run build:preview` builds without the draft sites and is only for previews.
- **Output directory:** `out`
- **Environment variable `NEXT_PUBLIC_WEB3FORMS_KEY`:** the access key for the contact form, from https://web3forms.com (free, no card). The address that receives the messages is set in the Web3Forms dashboard for that key, ideally ward16@kathmandu.gov.np. Web3Forms keys are public by design, since they only allow sending to the configured address. Without the key, the contact page shows the email address instead of the form.
- **Files Cloudflare reads from `out/`:** `_redirects` (`/` → `/en/`) and `_headers` (long caching for `_next/static`, a week for `/images`, basic security headers).
- **Environment variable `SITE_URL`:** the site's public address, e.g. `https://<project>.pages.dev`. Open Graph (link preview) images use it as their base URL. Without it they point at `http://localhost:3000`.

## To confirm on the first Cloudflare preview deploy

### Prefetch files on Windows builds (Next.js 16.4.6)

When the site is built **on Windows**, Next.js writes the small per-page prefetch files with the wrong name:

- Written: `out/en/__next.$d$lang/__PAGE__.txt` (a folder)
- Requested by the browser: `out/en/__next.$d$lang.__PAGE__.txt`

The exporter turns the segment path into a file name by replacing `/` with `.`, but on Windows the path uses `\`, which is left as a folder separator (`node_modules/next/dist/export/index.js`, `convertSegmentPathToStaticExportFilename`). As a result, links don't prefetch: clicking them does a normal page load instead of an instant client-side navigation. Nothing breaks.

Cloudflare Pages builds on Linux, so the deployed site should have the correct file names. **We have not patched this.** On the first preview deploy, check that:

1. Opening the browser DevTools Network tab on `/en/` shows `__next.….txt` requests returning **200**, not 404.
2. Clicking a nav link to another page (e.g. a heritage page) does not reload the whole page.

If both are true, delete this section.
