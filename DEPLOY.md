# DEPLOY.md

The full step-by-step deployment guide is written in Phase 11. This file collects deployment notes as they come up.

## Build settings (Cloudflare Pages)

- **Build command:** `npm run build`. This is the strict build: it refuses to run while any content is a draft or contains `[PLACEHOLDER`/`[TODO`. `npm run build:preview` builds without the draft sites and is only for previews.
- **Output directory:** `out`
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
