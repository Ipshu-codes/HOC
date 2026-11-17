# DEPLOY.md

The full step-by-step deployment guide is written in Phase 11. This file collects deployment notes as they come up.

## Connect Cloudflare Pages (first time, free)

Cloudflare builds the site from GitHub: every push to `main` updates the live site, and every other branch and pull request gets its own **preview link**. Nothing is a draft any more, so Cloudflare runs the strict **`npm run build`**. It checks the content first (`check-content`) and the output after (`verify-output`), and a failing check stops the deploy. No credit card is needed at any step. Cloudflare's screens change from time to time, so a label may read slightly differently from what is written here.

**A. Create the project**

1. Go to https://dash.cloudflare.com and sign in. If you have no account, click **Sign up** and create a free one with an email address, then verify the email.
2. In the left menu, click **Workers & Pages** (under *Compute*).
3. Click **Create** (top right).
4. Choose the **Pages** tab (not *Workers*), then click **Import an existing Git repository** → **Get started**.
5. Click **Connect GitHub**. A GitHub window opens for the *Cloudflare Workers and Pages* app:
   - choose the account that owns the repository (`Ipshu-codes`);
   - choose **Only select repositories** → `HOC`;
   - click **Install & Authorize**.
6. Back in Cloudflare, select **`Ipshu-codes/HOC`** → **Begin setup**.

**B. Build settings** (on the *Set up builds and deployments* screen)

7. **Project name:** `ward16-heritage` (or another name). The live site will be `https://ward16-heritage.pages.dev`.
8. **Production branch:** `main`.
9. **Framework preset:** `Next.js (Static HTML Export)`. If it isn't listed, choose `None`; the next two fields are what matter.
10. **Build command:** `npm run build`
11. **Build output directory:** `out`
12. **Root directory (advanced):** leave empty.

**C. Environment variables** (same screen: open **Environment variables (advanced)** → **Add variable** for each)

13. `SITE_URL` = `https://ward16-heritage.pages.dev`. Use your project name, with no trailing slash. Link previews (Open Graph images), the sitemap and robots.txt use it.
14. `NODE_VERSION` = `22`. The repository's `.node-version` file already asks for Node 22; setting it here too makes it explicit.
15. Optional: `NEXT_PUBLIC_WEB3FORMS_KEY` = the key from https://web3forms.com. Without it, the contact page shows the ward's email address instead of the form.

**D. First deploy**

16. Click **Save and Deploy**. The first build takes a few minutes. The log should end with:
    `✔ verify-output: no placeholders; 0 draft site(s) fully excluded; … images free of metadata.`
17. Click **Continue to project**. The site is live at `https://ward16-heritage.pages.dev`.

**E. Preview deployments for every branch and pull request**

18. In the project, open **Settings** → **Build** → **Branch control** (older screens: *Settings → Builds & deployments → Configure Production deployments / Preview deployments*). Set:
    - **Production branch:** `main`, with **Automatic deployments** enabled;
    - **Preview branch:** **All non-Production branches**.

    Click **Save**.
19. Open **Settings** → **Variables and Secrets**. Variables are set per environment (**Production** and **Preview**). Make sure `SITE_URL` and `NODE_VERSION` (and the Web3Forms key, if used) exist for **Preview** too, with the same values as Production, or preview builds will use the defaults.
20. Each push to a branch other than `main` now builds a preview at a link of its own:
    - `https://<branch>.ward16-heritage.pages.dev`, where `/` in the branch name becomes `-`. For example, `feat/swap-floating-buttons` → `https://feat-swap-floating-buttons.ward16-heritage.pages.dev`.
    - A unique link for every commit, listed under **Deployments**.
21. **Pull requests:** the Cloudflare app reports each preview build on the pull request in GitHub (a check, usually with a comment), with a **Preview URL** link. Open it to review the change before merging. Branches pushed before Cloudflare was connected get a preview only after their next push, which can be an empty commit (`git commit --allow-empty -m "Trigger preview" && git push`).

**F. Later**

- If you change an environment variable, redeploy for it to take effect: **Deployments** → the latest deployment → **⋯** → **Retry deployment**.
- **Check the live site:**
  - `/` redirects to `/en/`, and the EN | ने switch works.
  - Both Nanak Math and Mhepi Ajima appear in English and Nepali, and the walking route on the map has both stops.
  - The prefetch check below (*Prefetch files on Windows builds*).
  - On a phone, opening `/en/map/` directly shows the still picture with **Show 3D map**, while tapping the floating **3D Map** button from another page loads the map at once.
  - Run Lighthouse (Chrome DevTools → Lighthouse → Mobile) or https://pagespeed.web.dev on the live URL; local scores on Windows are noisy (see below).

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
