# PLAN.md — Ward No. 16 Heritage Website

> **Instructions for Claude Code:** This is the full build plan. Work **one phase at a time**, in order.
> At the end of each phase: run the site, check the phase's checklist, run `git commit`, then
> **stop and wait for my review** before starting the next phase. Never invent historical facts —
> all heritage content must come from `raw-data/`. If information is missing, list it in
> `MISSING_INFO.md` and use a clear placeholder like `[TODO: founding year]`.

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
| Framework | **Astro** (static site) |
| Styling | **Tailwind CSS** |
| Interactive parts | **React** islands (chatbot, gallery lightbox, map) |
| 3D map | **MapLibre GL JS** + **OpenFreeMap** vector tiles (no key) + **AWS Terrain Tiles** (Terrarium DEM, open data) for 3D terrain, with 3D building extrusions |
| Chatbot | Runs **entirely in the browser**: **Fuse.js** fuzzy search over `faq.json` + heritage content. No server, no API. |
| Gallery lightbox | **PhotoSwipe** (or a small custom component) |
| Contact form | **Web3Forms** (free) — access key in `.env`, with a `mailto:` fallback |
| Images | Astro's built-in `<Image>` (sharp) → WebP, responsive sizes |
| Fonts | **Google Fonts**: *Mukta* (Nepali + English body), *Cinzel* or *Playfair Display* (English headings) |
| Content editing (later) | **Decap CMS** (free, git-based) — optional, Phase 9 |
| Hosting | **Cloudflare Pages** (free) — fallback: GitHub Pages |
| Domain | Free `*.pages.dev` subdomain; later a free `.com.np` / `.org.np` (Mercantile) or `.gov.np` via the municipality |

Do **not** add any service that needs a credit card.

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
- Put the colors in `tailwind.config` as named colors so they are used everywhere consistently.

---

## 5. Folder structure

```
ward16-heritage/
├── CLAUDE.md
├── PLAN.md
├── MISSING_INFO.md
├── raw-data/                  # original Drive download — never edit, never deploy
├── public/
│   ├── images/
│   │   ├── logo/
│   │   ├── mhepi-ajima/
│   │   └── nanak-math/
│   └── favicon.svg
└── src/
    ├── content/
    │   ├── heritage/
    │   │   ├── mhepi-ajima.en.md
    │   │   ├── mhepi-ajima.ne.md
    │   │   ├── nanak-math.en.md
    │   │   └── nanak-math.ne.md
    │   ├── ward.json          # ward info, office contact, opening hours
    │   └── faq.json           # chatbot Q&A (EN + NE)
    ├── i18n/
    │   ├── en.json
    │   └── ne.json
    ├── components/
    │   ├── Header.astro  Nav.astro  Footer.astro  Hero.astro
    │   ├── HeritageCard.astro  SectionDivider.astro
    │   ├── Chatbot.tsx  MapView.tsx  Gallery.tsx
    │   └── LanguageToggle.astro
    ├── layouts/BaseLayout.astro
    └── pages/
        ├── index.astro
        ├── heritage/[slug].astro
        ├── gallery.astro
        ├── map.astro
        ├── contact.astro
        └── ne/…               # Nepali versions of the same routes
```

---

## 6. Phases

### Phase 1 — Organize the data ⭐ most important
1. Read **everything** in `raw-data/` (text, docx, pdf, images, spreadsheets).
2. Write `DATA_INVENTORY.md`: what exists for each site, file by file.
3. Create the content files in `src/content/heritage/` with this frontmatter:
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
1. Scaffold Astro + Tailwind + React integration. Init git with a `.gitignore` (include `node_modules`, `.env`, `dist`, `raw-data/` if it contains large files).
2. Add the design tokens from Section 4 to Tailwind config, load Google Fonts.
3. Write `CLAUDE.md` (see Section 8).

✅ `npm run dev` works and shows a blank page with the cream background.

### Phase 3 — Base layout
1. `Header`: logo circle on the left, title "WARD NO. 16" + "Kathmandu Metropolitan City" (and Nepali: "वडा नं. १६, काठमाडौं महानगरपालिका").
2. Sticky `Nav`: Overview · About · Heritages · Gallery · Contact + EN/ने toggle. Hamburger on mobile.
3. `Footer` (brick red): ward office address, phone, email, quick links, "© Ward No. 16, KMC".
4. Match the layout in `raw-data/sketch.jpg`.

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
`/heritage/[slug]` generated from the content files:
- Cover image banner with name in English + Nepali
- Quick-facts box (location, established, tradition, festivals, hours)
- Body sections from Phase 1 with a sticky table of contents on desktop
- Photo strip, "View on 3D Map" button (opens `/map?site=<slug>`)
- "Other heritage" card at the bottom linking to the other site

### Phase 6 — Gallery
- `/gallery` with filter tabs: All · Mhepi Ajima · Nanak Math
- Masonry/grid layout, lazy-loaded WebP images, lightbox with captions and keyboard navigation

### Phase 7 — 3D Map
1. Floating **"🗺 3D Map"** button, bottom-right on every page (as in the sketch) → `/map`.
2. `/map`: full-screen MapLibre map
   - Style: OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`)
   - 3D terrain: AWS Terrain Tiles, Terrarium encoding
     (`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png`)
   - 3D building extrusions, pitch ~60°, slow rotate-on-load animation
   - Ward 16 boundary outline if a GeoJSON exists in `raw-data/` (otherwise list it in MISSING_INFO)
   - Custom red markers for both sites → popup with photo, name, summary, "Read more" link
   - `?site=<slug>` flies the camera to that site
   - Side panel listing both sites; clicking flies to them
   - Navigation + fullscreen controls; works with touch on mobile
3. Show proper attribution (OpenFreeMap / OpenStreetMap contributors).

### Phase 8 — Chatbot (free, no API)
1. Floating button bottom-left with a speech bubble: **"How can I help?"** / **"म कसरी मद्दत गर्न सक्छु?"**
2. Opens a small chat panel (red header, cream body).
3. Build `src/content/faq.json` from the heritage content: at least **30 Q&A pairs** in both languages, e.g.
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

### Phase 9 — Bilingual, contact form, polish
1. EN/NE toggle: all UI strings from `src/i18n/`, Nepali routes under `/ne/`. Mark any machine-generated Nepali in `MISSING_INFO.md` for native-speaker review.
2. Contact page: Web3Forms form (name, email, message), honeypot spam field, success message; Web3Forms access key from `.env` (`PUBLIC_WEB3FORMS_KEY`); `mailto:` fallback.
3. SEO: titles, meta descriptions, Open Graph images, `sitemap.xml`, `robots.txt`.
4. Accessibility: alt text, focus rings, keyboard nav for chatbot/lightbox/map panel, `lang` attributes.
5. Performance: Lighthouse ≥ 90 on all four scores; compress images; lazy-load map and chatbot.
6. 404 page in the red theme.
7. (Optional) Decap CMS at `/admin` so the ward office can edit text and photos later.

### Phase 10 — Deploy (free)
1. Write `DEPLOY.md` with step-by-step instructions:
   - Push to a GitHub repository
   - Cloudflare Pages → connect repo → build command `npm run build`, output `dist`
   - Add `PUBLIC_WEB3FORMS_KEY` as an environment variable
   - Optional: connect a free `.com.np` domain
2. Run `npm run build` locally and fix all errors and warnings before I deploy.

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
- [ ] Builds cleanly and deploys to Cloudflare Pages

---

## 8. Contents for `CLAUDE.md`

```markdown
# Ward 16 Heritage Website
- Sites: Mhepi Ajima, Nanak Math — Ward No. 16, Kathmandu Metropolitan City
- Stack: Astro + Tailwind + React islands. Hosting: Cloudflare Pages.
- Everything must be FREE. No paid services, no API keys needing billing.
- Theme: red. Use only the named Tailwind colors: crimson, brick, vermilion, gold, cream, sand, ink.
- Layout follows raw-data/sketch.jpg.
- Content lives ONLY in src/content/. Never invent historical facts; use [TODO: …] and log in MISSING_INFO.md.
- Bilingual EN/NE. UI strings in src/i18n/. Font: Mukta for Devanagari.
- Mobile-first, accessible, every image has alt text.
- Work one phase of PLAN.md at a time; commit and stop for review after each.
```
