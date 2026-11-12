# PLAN.md — Ward No. 16 Heritage Website

> **Instructions for Claude Code:** This is the full build plan. Work **one phase at a time**, in order.
> At the end of each phase: run the site, check the phase's checklist, run `git commit`, then
> **stop and wait for my review** before starting the next phase. Never invent historical facts —
> all heritage content must come from `raw-data/`. If information is missing, list it in
> `MISSING_INFO.md` and use a clear placeholder like `[TODO: founding year]`.
> Our team knows **JavaScript, TypeScript, React, Next.js and PostgreSQL** — keep the code
> idiomatic and readable for that skill set, and explain anything new (MapLibre, Fuse.js) in comments.

---

## 1. Project summary

A bilingual (English / नेपाली) website for **Ward No. 16, Kathmandu Metropolitan City**, showcasing
two heritage sites:

1. **Mhepi Ajima** (म्हेपी अजिमा)
2. **Nanak Math** (नानक मठ)

- **Theme:** red
- **Budget:** Rs. 0 — every tool, library, service and host must be **free** with no paid tier needed,
  and no API keys that require billing.
- **Source data:** `raw-data/` (downloaded from the ward's Google Drive)
- **Layout reference:** `raw-data/sketch.jpg` (hand-drawn wireframe)

---

## 2. Layout from the sketch

```
┌──────────────────────────────────────────────────────────────┐
│ (LOGO)   WARD NO. 16                                         │
│          Kathmandu Metropolitan City                         │
│   Overview   About   Heritages   Gallery   Contact   [EN|ने] │  ← sticky nav
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              HERO: photo of the heritage sites               │
│                                                              │
│ ┌──────────────┐                                ┌──────────┐ │
│ │💬 How can I  │                                │ 🗺 3D Map │ │
│ │   help?      │                                └──────────┘ │
│ └──────────────┘                                             │
└──────────────────────────────────────────────────────────────┘
   chatbot: floating, bottom-left        3D map button: floating, bottom-right
```

---

## 3. Tech stack (all free)

| Need | Tool |
|---|---|
| Framework | **Next.js (App Router) + TypeScript**, built as a **static export** (`output: 'export'`) |
| UI | **React** components, **Tailwind CSS** |
| Content | Markdown files in `content/`, parsed with **gray-matter** + **remark/rehype** at build time |
| Bilingual routing | `app/[lang]/…` with `generateStaticParams` for `en` and `ne` |
| 3D map | **MapLibre GL JS** (client component, loaded with `next/dynamic`, `ssr: false`) + **OpenFreeMap** vector tiles (no key) + **AWS Terrain Tiles** (Terrarium DEM, open data) for 3D terrain, with 3D building extrusions |
| Chatbot | Runs **entirely in the browser**: **Fuse.js** fuzzy search over `faq.json` + heritage content. No server, no API. |
| Gallery lightbox | **yet-another-react-lightbox** (free, MIT) |
| Images | Pre-optimized to WebP with a **sharp** script (`scripts/optimize-images.ts`); `next/image` with `unoptimized: true` (required for static export) |
| Fonts | `next/font/google`: *Mukta* (Nepali + English body), *Playfair Display* (English headings) |
| Contact form | **Web3Forms** (free) — key in `.env.local`, with a `mailto:` fallback |
| Database (optional, Phase 10) | **Supabase free tier (PostgreSQL)** — only for storing contact messages and unanswered chatbot questions |
| Content editing (optional) | **Decap CMS** (free, git-based) |
| Hosting | **Cloudflare Pages** (free) — deploy the static `out/` folder. Fallback: GitHub Pages |
| Domain | Free `*.pages.dev` subdomain; later a free `.com.np` / `.org.np` (Mercantile) or `.gov.np` via the municipality |

Do **not** add any service that needs a credit card. Do **not** use Next.js features that need a
running server (API routes, server actions, middleware, ISR) — the site must work as a static export.

---

## 4. Design system — red theme

```css
--crimson:   #C8102E;  /* primary: buttons, links, nav active, markers */
--brick:     #8B1E1E;  /* dark red: header bar, footer, headings */
--vermilion: #E34234;  /* hover / accent (sindoor tone) */
--gold:      #D4A017;  /* thin borders, dividers, icons — use sparingly */
--cream:     #FFF8F0;  /* page background */
--sand:      #F3E6D8;  /* card / alternate section background */
--ink:       #2B1A1A;  /* body text */
```

Rules:
- Cream background with red as the strong accent — the page must not feel like a solid red wall.
- All text/background pairs must pass **WCAG AA contrast** (check white-on-crimson and crimson-on-cream).
- Section dividers: a subtle traditional Newari woodcarving / dhaka-style SVG pattern in gold or brick.
- Rounded corners `rounded-xl`, soft shadows, generous spacing.
- Mobile-first. Nav becomes a hamburger menu under 768px.
- Put the colors in the Tailwind theme as named colors so they are used everywhere consistently.

---

## 5. Folder structure

```
ward16-heritage/
├── CLAUDE.md
├── PLAN.md
├── MISSING_INFO.md
├── raw-data/                     # original Drive download — never edit, never deploy
├── content/
│   ├── heritage/
│   │   ├── mhepi-ajima.en.md
│   │   ├── mhepi-ajima.ne.md
│   │   ├── nanak-math.en.md
│   │   └── nanak-math.ne.md
│   ├── ward.json                 # ward info, office contact, opening hours
│   └── faq.json                  # chatbot Q&A (EN + NE)
├── public/
│   ├── images/{logo,mhepi-ajima,nanak-math}/
│   └── favicon.svg
├── scripts/optimize-images.ts
└── src/
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx              # redirects to /en
    │   ├── not-found.tsx
    │   └── [lang]/
    │       ├── layout.tsx
    │       ├── page.tsx          # home
    │       ├── heritage/[slug]/page.tsx
    │       ├── gallery/page.tsx
    │       ├── map/page.tsx
    │       └── contact/page.tsx
    ├── components/
    │   ├── Header.tsx  Nav.tsx  Footer.tsx  Hero.tsx
    │   ├── HeritageCard.tsx  SectionDivider.tsx  LanguageToggle.tsx
    │   ├── Chatbot.tsx  MapView.tsx  Gallery.tsx   # "use client"
    ├── lib/
    │   ├── content.ts            # read + parse markdown
    │   └── i18n.ts               # dictionaries
    ├── i18n/{en,ne}.json
    └── types/heritage.ts
```

---

## 6. Phases

### Phase 1 — Organize the data ⭐ most important
1. Read **everything** in `raw-data/` (text, docx, pdf, images, spreadsheets).
2. Write `DATA_INVENTORY.md`: what exists for each site, file by file.
3. Create the content files in `content/heritage/` with this frontmatter:
   ```yaml
   name: "Mhepi Ajima"
   nameNe: "म्हेपी अजिमा"
   slug: "mhepi-ajima"
   summary: "…one or two sentences…"
   location: "…"
   coordinates: [lat, lng]       # from the data; if missing → TODO
   established: "…"
   deity_or_tradition: "…"
   festivals: [{ name: "", month: "", description: "" }]
   visiting: { hours: "", entry: "", tips: "" }
   cover: "/images/mhepi-ajima/cover.webp"
   gallery: [ … ]
   ```
   Body sections: **History**, **Legends & Beliefs**, **Festivals & Jatras**, **Architecture**,
   **Present Day**, **How to Visit**.
4. Copy images into `public/images/<site>/`, rename to `kebab-case`, keep originals in `raw-data/`.
   Write meaningful alt text for each one.
5. Create `MISSING_INFO.md` listing every gap (coordinates, dates, Nepali text, photo credits, logo, contact).

✅ Checklist: no fact exists in content that isn't in `raw-data/`; every image has alt text.
🛑 Stop for review — I will verify facts before design work begins.

### Phase 2 — Project setup
1. `npx create-next-app@latest` with TypeScript, Tailwind, ESLint, App Router, `src/` directory.
2. In `next.config`: `output: 'export'`, `images: { unoptimized: true }`, `trailingSlash: true`.
3. Add the design tokens from Section 4 to the Tailwind theme; load fonts with `next/font/google`.
4. Add `src/types/heritage.ts` and `src/lib/content.ts` (typed loader for the markdown files).
5. Add `scripts/optimize-images.ts` (sharp → WebP, 640/1280/1920 widths).
6. Init git with a `.gitignore` (include `node_modules`, `.env*`, `out`, `.next`).
7. Write `CLAUDE.md` (see Section 8).

✅ `npm run dev` works; `npm run build` produces an `out/` folder.

### Phase 3 — Base layout
1. `Header`: logo circle on the left, title "WARD NO. 16" + "Kathmandu Metropolitan City" (and Nepali: "वडा नं. १६, काठमाडौं महानगरपालिका").
2. Sticky `Nav`: Overview · About · Heritages · Gallery · Contact + EN/ने toggle. Hamburger on mobile.
3. `Footer` (brick red): ward office address, phone, email, quick links, "© Ward No. 16, KMC".
4. `app/[lang]/layout.tsx` sets `<html lang>` and loads the right dictionary.
5. Match the layout in `raw-data/sketch.jpg`.

✅ Looks right at 375px, 768px and 1440px widths.

### Phase 4 — Home page
Sections in order:
1. **Hero** — full-width photo, dark-red gradient overlay, title, subtitle, two buttons: "Explore Heritages" and "View 3D Map".
2. **Overview** — short intro to Ward 16 and why these two sites matter.
3. **About** — ward facts (from `ward.json`).
4. **Heritages** — two large `HeritageCard`s side by side (stacked on mobile) linking to detail pages.
5. **Gallery preview** — 6 photos + "See all" link.
6. **Contact** strip — address, phone, small map.

Nav links scroll smoothly to these sections on the home page.

### Phase 5 — Heritage detail pages
`app/[lang]/heritage/[slug]/page.tsx` with `generateStaticParams` for both sites × both languages:
- Cover image banner with name in English + Nepali
- Quick-facts box (location, established, tradition, festivals, hours)
- Body sections from Phase 1 with a sticky table of contents on desktop
- Photo strip, "View on 3D Map" button (opens `/[lang]/map?site=<slug>`)
- "Other heritage" card at the bottom linking to the other site
- `generateMetadata` for title, description and Open Graph image

### Phase 6 — Gallery
- `/[lang]/gallery` with filter tabs: All · Mhepi Ajima · Nanak Math
- Responsive grid, lazy-loaded WebP images, lightbox with captions and keyboard navigation

### Phase 7 — 3D Map
1. Floating **"🗺 3D Map"** button, bottom-right on every page (as in the sketch) → `/[lang]/map`.
2. `MapView.tsx` (client component, imported with `next/dynamic` and `ssr: false`):
   - Style: OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`)
   - 3D terrain: AWS Terrain Tiles, Terrarium encoding
     (`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`)
   - 3D building extrusions, pitch ~60°, slow rotate-on-load animation
   - Ward 16 boundary outline if a GeoJSON exists in `raw-data/` (otherwise list it in MISSING_INFO)
   - Custom red markers for both sites → popup with photo, name, summary, "Read more" link
   - `?site=<slug>` flies the camera to that site (read with `useSearchParams` inside a `<Suspense>`)
   - Side panel listing both sites; clicking flies to them
   - Navigation + fullscreen controls; works with touch on mobile
3. Show proper attribution (OpenFreeMap / OpenStreetMap contributors).

### Phase 8 — Chatbot (free, no API)
1. Floating button bottom-left with a speech bubble: **"How can I help?"** / **"म कसरी मद्दत गर्न सक्छु?"**
2. Opens a small chat panel (red header, cream body). Client component, mounted in the `[lang]` layout.
3. Build `content/faq.json` from the heritage content: at least **30 Q&A pairs** in both languages, e.g.
   ```json
   { "id": "nanak-built", "q_en": ["When was Nanak Math built?", "age of nanak math"],
     "q_ne": ["नानक मठ कहिले बनेको हो?"], "a_en": "…", "a_ne": "…",
     "link": "/heritage/nanak-math#history" }
   ```
   Cover: history, location, how to reach, opening hours, festivals, entry fee, photography rules, contact.
4. Matching: Fuse.js over the questions (threshold ~0.4). Detect Nepali by Devanagari characters and reply in the same language.
5. Show 3–4 suggested-question chips at the start and after each answer.
6. No match → friendly fallback with the ward office phone/email.
7. Each answer can include a "Read more →" link.

✅ Works offline after page load; no network requests when chatting.

### Phase 9 — Contact form, polish
1. Make sure every UI string comes from `src/i18n/`; mark any machine-generated Nepali in `MISSING_INFO.md` for native-speaker review.
2. Contact page: Web3Forms form (name, email, message), honeypot spam field, success message; key from `NEXT_PUBLIC_WEB3FORMS_KEY`; `mailto:` fallback.
3. SEO: metadata on every page, Open Graph images, `app/sitemap.ts`, `app/robots.ts`.
4. Accessibility: alt text, focus rings, keyboard nav for chatbot/lightbox/map panel, `lang` attributes.
5. Performance: Lighthouse ≥ 90 on all four scores; lazy-load map and chatbot.
6. `not-found.tsx` in the red theme.

### Phase 10 — Optional: PostgreSQL with Supabase (free tier)
Only do this phase if I ask for it.
1. Create tables:
   ```sql
   create table contact_messages (
     id bigint generated always as identity primary key,
     name text not null, email text not null, message text not null,
     created_at timestamptz default now()
   );
   create table chatbot_unanswered (
     id bigint generated always as identity primary key,
     question text not null, lang text not null,
     created_at timestamptz default now()
   );
   ```
2. Row Level Security: allow **insert only** for the `anon` role; no select/update/delete for anon.
3. Insert from the browser with `@supabase/supabase-js` (keys in `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`), so the site stays a static export.
4. Chatbot: log questions with no match to `chatbot_unanswered` so we can add them to `faq.json` later.
5. Note in `DEPLOY.md`: free Supabase projects pause after a period of inactivity and must be resumed from the dashboard.

### Phase 11 — Deploy (free)
1. Write `DEPLOY.md` with step-by-step instructions:
   - Push to a GitHub repository
   - Cloudflare Pages → connect repo → framework preset "Next.js (Static HTML Export)", build command `npm run build`, output directory `out`
   - Add the `NEXT_PUBLIC_*` environment variables
   - Optional: connect a free `.com.np` domain
2. Run `npm run build` locally and fix all errors, type errors and lint warnings before I deploy.

---

## 7. Definition of done
- [ ] All pages work in English and Nepali
- [ ] Layout matches the sketch: logo, title, nav, chatbot bottom-left, 3D map button bottom-right
- [ ] Red theme applied consistently, contrast passes WCAG AA
- [ ] Every fact traces back to `raw-data/`; `MISSING_INFO.md` is up to date
- [ ] 3D map shows both sites with working popups
- [ ] Chatbot answers common questions in both languages, fully offline
- [ ] Mobile-friendly at 375px
- [ ] Lighthouse ≥ 90
- [ ] Zero paid services, zero billing API keys
- [ ] `npm run build` passes with no TypeScript errors and deploys to Cloudflare Pages

---

## 8. Contents for `CLAUDE.md`

```markdown
# Ward 16 Heritage Website
- Sites: Mhepi Ajima, Nanak Math — Ward No. 16, Kathmandu Metropolitan City
- Stack: Next.js (App Router) + TypeScript + Tailwind, static export (output: 'export'). Hosting: Cloudflare Pages.
- No server features: no API routes, server actions, middleware or ISR.
- Everything must be FREE. No paid services, no API keys needing billing.
- Theme: red. Use only the named Tailwind colors: crimson, brick, vermilion, gold, cream, sand, ink.
- Layout follows raw-data/sketch.jpg.
- Content lives ONLY in content/. Never invent historical facts; use [TODO: …] and log in MISSING_INFO.md.
- Bilingual EN/NE via app/[lang]/. UI strings in src/i18n/. Font: Mukta for Devanagari.
- Strict TypeScript, no `any`. Client components only where needed (map, chatbot, gallery, nav toggle).
- Mobile-first, accessible, every image has alt text.
- Work one phase of PLAN.md at a time; commit and stop for review after each.