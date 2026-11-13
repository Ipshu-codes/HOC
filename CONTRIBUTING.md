# Contributing

How we work on the Ward 16 heritage website. Read `CLAUDE.md` for the project rules (content, images, map, chatbot) before changing code.

## Branches and pull requests

- **Never commit to `main` directly.** `main` is what Cloudflare Pages deploys.
- Start every piece of work on a branch from an up-to-date `main`:
  ```
  git switch main
  git pull origin main
  git switch -c feature/short-description
  ```
  Use `feature/…` for new work, `fix/…` for bug fixes and `content/…` for text or photo changes.
- Keep a branch to one topic. Small pull requests are reviewed and merged faster.
- Before you open a pull request, merge the latest `main` into your branch and solve any conflicts there (see below), not on `main`.
- Open a pull request on GitHub into `main`. Describe what changed, how you tested it, and add a screenshot for anything visible. Ask someone else to review it.
- Don't force-push to `main`, and don't rebase or force-push a branch someone else is also working on.

## Before you open a pull request

Run these and fix everything they report:

```
npm run typecheck
npm run lint
npm run build
```

`npm run build` is the real production build. It runs `check-content` first, which fails on any `draft: true`, `[PLACEHOLDER` or `[TODO`. After building it runs `verify-output`, which fails if a draft site, placeholder text, an unfilled `{person:…}` credit or image metadata reaches `out/`. Never bypass these checks. If the build fails, fix the cause.

Also open the pages you changed in `npm run dev`, in **English and Nepali**, at phone width (375 px) and desktop width (1440 px).

## Merge conflicts

When Git reports a conflict, open the file and look at both sides before choosing anything.

### `src/app/globals.css`: keep both sides

Conflicts here almost always mean two people **added** different styles near the same place, for example new map styles on one branch and Nani's chat animations on the other. Neither side replaces the other.

- **Keep both blocks**, one after the other, and delete only the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
- Never resolve this file with "accept current" or "accept incoming" for the whole file. That silently deletes the other person's styles. It has happened here: Nani's animations and, separately, the map's `.map-detail-prose` block were each lost once this way.
- After resolving, check that each side's classes are still present, then run `npm run build` and look at the affected pages:
  ```
  grep -c "nani-bob\|nani-sway\|map-detail-prose\|map-marker-selected" src/app/globals.css
  ```

### Other files

- **Map code** (`MapView.tsx`, `MapExplorer.tsx`, `src/components/map/*`, the map page): take the map author's version as the base, then re-apply only the fixes the other side needs. Typical ones: every place in the start view, the phone "Show 3D map" preview, Nepali labels, the map attribution.
- **Content, chatbot (`content/faq.json`), Nani, `src/i18n/*.json`**: keep both sides; these are usually additions. For JSON, make sure the result is still valid (the build checks it).
- If you are not sure what a side is for, ask its author before deleting anything.

## Content and images (short version)

- Facts only from the raw data or a cited source; gaps go into `MISSING_INFO.md` as `[TODO: …]`, never invented.
- Every `##`/`###` heading has a stable English id, the same in EN and NE: `## इतिहास {#history}`.
- Add images only through `npm run optimize-images` (it strips metadata). Check new photos for faces and record them in `content/photo-consent.json`.
- Pin new npm packages to a release at least two weeks old: `npm install --save-exact package@x.y.z`.
- Everything must stay free: no paid services and no API keys that need billing.
