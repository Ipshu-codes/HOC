# Project Structure

Complete breakdown of all directories, files, and their purposes.

## Overview
**Tech Stack:** Next.js 16.4.6 (App Router) + TypeScript + React 19 + Tailwind v4  
**Output:** Static export (HTML/CSS/JS only, no server-side code)  
**Hosting:** Cloudflare Pages  
**Bilingual:** English + Nepali (नेपाली)  
**Two Heritage Sites:** Mhepi Ajima temple + Living Bhu-Samadhi (Nanak Math)

---

## Directory Structure

### 📁 `src/app/` — Next.js App Router Pages & Layout

```
src/app/
├── (root)/
│   ├── layout.tsx        → Root HTML wrapper, scripts, fonts
│   └── page.tsx          → Redirect logic (/ → /en or /ne)
├── [lang]/
│   ├── layout.tsx        → Language-specific wrapper, header/nav/footer
│   ├── page.tsx          → Home page (hero slides, overview, about ward)
│   ├── gallery/
│   │   └── page.tsx      → Full gallery: 53+ photos (list/grid views, 3D museum)
│   ├── heritage/[slug]/
│   │   └── page.tsx      → Heritage site detail page (Mhepi Ajima, Nanak Math)
│   ├── map/
│   │   └── page.tsx      → Interactive 3D map (MapLibre, map exploration)
│   ├── contact/
│   │   └── page.tsx      → Contact page (ward office info, email)
├── globals.css           → Global styles, Tailwind config, responsive breakpoints
├── fonts.ts              → Font imports (Mukta for Devanagari, system sans)
├── robots.ts             → SEO: robots.txt generation
└── sitemap.ts            → SEO: sitemap.xml generation
```

**Key Routes:**
- `/en`, `/ne` — Language-specific home pages
- `/[lang]/gallery` — Full heritage photo gallery (2 views: list + 3D museum mode)
- `/[lang]/heritage/mhepi-ajima`, `/[lang]/heritage/nanak-math` — Site detail pages
- `/[lang]/map` — 3D interactive map (floating button links here)
- `/[lang]/contact` — Ward office contact + visiting info

---

### 📁 `src/components/` — React Components

#### **Layout & Navigation**
- **Header.tsx** — Top navigation bar (logo, language toggle, sticky on scroll)
- **Nav.tsx** — Mobile hamburger menu, language switcher
- **Footer.tsx** — Footer with ward logo, name, city, links
- **BrandLink.tsx** — Reusable logo-link component (home link in header + sticky nav + footer)
- **LanguageToggle.tsx** — EN/नेपाली switcher

#### **Page Structure**
- **HomeSection.tsx** — Reusable section wrapper for home page
- **HeroSlides.tsx** — Rotating hero image carousel (10 photos, auto-advance)
- **SectionDivider.tsx** — Visual separator between page sections
- **TableOfContents.tsx** — Jump-to-section links for heritage pages
- **DraftBanner.tsx** — Warning banner for draft (unpublished) pages

#### **Heritage Content**
- **HeritageCard.tsx** — Card component for displaying a heritage site (home page)
- **QuickFacts.tsx** — Sidebar with key facts (location, established, festivals, etc.)
- **PhotoView.tsx** — Photo gallery viewer with modal/carousel
- **PhotoCredit.tsx** — Attribution line for photo team
- **Gallery.tsx** — Multi-view heritage photo gallery (list + grid + 3D museum mode)
- **HomeGalleryCarousel.tsx** — Featured gallery carousel for home page

#### **Map & 3D**
- **MapView.tsx** — MapLibre canvas (renders 3D terrain, markers, popups)
- **MapExplorer.tsx** — Map UI controller (search, filters, route selection, state)
- **MapButton.tsx** — Floating button to open 3D map page
- **map/MapControls.tsx** — Map UI: zoom, rotate, bearing controls
- **map/MapLegend.tsx** — Map legend (site markers, routes, filters)
- **map/PlaceDetailPanel.tsx** — Right-side panel showing selected site details
- **map/RouteNav.tsx** — Navigation for walking routes (next/prev stops)

#### **Chatbot & AI**
- **Chatbot.tsx** — Main chatbot interface (tap-only, topic/question interface)
- **ChatPanel.tsx** — Chat conversation panel (messages, Nani avatar)
- **NaniAvatar.tsx** — Reusable avatar component (Nani's face, used in messages)
- **ContactStrip.tsx** — Contact info component (email, phone in chat fallback)

#### **Gallery 3D Museum**
- **gallery/MuseumCanvas.tsx** — Three.js 3D scene rendering (photos as gallery walls)
- **gallery/MuseumScene.tsx** — 3D scene setup (lights, geometry, camera controls)
- **gallery/MuseumErrorBoundary.tsx** — Error handling for WebGL failures
- **gallery/useMuseumTextures.ts** — Hook to load & manage 3D textures

#### **Utilities**
- **ResponsiveImage.tsx** — Image component with srcset, lazy loading, responsive sizes
- **Hero.tsx** — Single hero banner (used on some pages)

---

### 📁 `src/lib/` — Utility Functions & Data Processing

#### **Content Loading**
- **content.ts** — `getHeritageList()`, `getHeritageSlugs()`: Load heritage site metadata
- **credits.ts** — Parse `content/credits.json`: People who provided information
- **faq.ts** — `generateTopics()`: Build FAQ topics from `content/faq.json`

#### **Localization**
- **i18n.ts** — `getDictionary(lang)`: Load language strings from `src/i18n/*.json`

#### **Formatting & Helpers**
- **format.ts** — String helpers (title case, date formatting, etc.)
- **site-url.ts** — URL building for heritage sites, routes
- **images.ts** — Image optimization: responsive sizes, srcset generation

#### **Map & 3D**
- **map-data.ts** — Transform heritage sites into map markers (coordinates, popups)
- **museum-layout.ts** — 3D gallery layout (wall positioning, texture placement)
- **webgl.ts** — WebGL capability detection

#### **Markdown Processing**
- **remark-heading-ids.ts** — Remark plugin: assign stable IDs to h2/h3 headings
- **rehype-section-photos.ts** — Rehype plugin: inject photos beside list items (from `content/section-photos.json`)

#### **Config**
- **breakpoints.ts** — Responsive breakpoints (lg:1024px, md:768px, etc.)

---

### 📁 `src/types/` — TypeScript Type Definitions

- **heritage.ts** — Heritage site frontmatter schema (Zod validation)
- **locale.ts** — UI strings type definitions
- **faq.ts** — FAQ/chatbot topic & question types
- **home.ts** — Home page content schema
- **route.ts** — Walking route schema
- **site.ts** — Site coordinate/metadata type
- **ward.ts** — Ward office details schema
- **common.ts** — Shared types

---

### 📁 `src/i18n/` — Localization Strings

- **en.json** — English UI strings (nav, buttons, labels, page titles)
- **ne.json** — Nepali (नेपाली) UI strings (100% translated)

**Keys organized by feature:**
- `a11y` — Accessibility labels
- `nav` — Navigation menu
- `home` — Home page text
- `heritage` — Heritage page labels (Quick Facts, etc.)
- `gallery` — Gallery UI strings
- `map` — Map UI strings
- `contact` — Contact page text
- `faq` — FAQ/chatbot strings
- `footer` — Footer text

---

### 📁 `content/` — Content (Markdown, JSON)

#### **Heritage Site Content**
- **heritage/mhepi-ajima.en.md**, **mhepi-ajima.ne.md** — Full history & description (Markdown with frontmatter)
- **heritage/nanak-math.en.md**, **nanak-math.ne.md** — Living Bhu-Samadhi history & description

**Frontmatter fields:**
```yaml
---
slug: mhepi-ajima
name: Mhepi Ajima
location: "Naxal, Kathmandu"
established: "15th century"
deity_or_tradition: "Ajima (mother goddess)"
visiting:
  hours: "6 AM – 6 PM"
  entry: "Free"
festivals:
  - name: "Ajima Jatra"
    month: "October"
informationFrom:
  - person:mhepi-priest
---
```

#### **Metadata & FAQ**
- **home.json** — Home page: overview text, hero slides, illustrations
- **ward.json** — Ward 16 office: address, phone, email, logo
- **faq.json** — Chatbot questions & answers (EN + NE, organized by site & topic)
- **credits.json** — People who provided historical info
- **sources.json** — Cited sources (key-value: source ID → plain-language name)
- **photo-consent.json** — Photo consent status (approved/removed)
- **section-photos.json** — Maps photos to heritage page sections (e.g., "यहाँ भएका सम्पदाहरू" section)
- **routes.json** — Walking routes (stops, distances, GeoJSON)

---

### 📁 `public/images/` — Optimized Image Assets

Responsive images in multiple sizes (480, 640, 960, 1280, 1920px) as WebP:

```
public/images/
├── logo/
│   ├── ward-logo-64.png, -128.png, -256.png  → Ward emblem (small)
│   └── ward-illustration-*.webp               → Ward 16 illustration
├── map/
│   └── preview-*.webp                         → Map preview (mobile CTA)
├── nani/
│   ├── nani-*.webp                            → Avatar (28–112px, in chat)
│   ├── nani-figure-*.webp                     → Half-body hover figure (130–520px)
│   └── nani-namaste-*.webp                    → Nani's namaste pose (home hero)
├── mhepi-ajima/                               → 25+ heritage photos
├── nanak-math/                                → 30+ heritage photos
└── (all images built by `npm run optimize-images`)
```

**All images:**
- Generated from raw data via `npm run optimize-images` script
- Stripped of EXIF/metadata (privacy, file size)
- WebP with fallback PNG/JPEG
- Multiple breakpoint sizes via srcset
- Alt text in content frontmatter

---

### 📁 `scripts/` — Build-Time Utilities

- **check-content.ts** — `npm run check-content`: Validate content
  - Detects `[TODO: …]`, `[PLACEHOLDER: …]`, draft pages
  - Validates heading IDs (must be stable EN+NE)
  - Fails build if issues found

- **verify-output.ts** — `npm run build` runs this automatically
  - Checks static output for EXIF metadata, drafts, placeholders
  - Ensures no broken links or unknown source/person references

- **optimize-images.ts** — `npm run optimize-images`
  - Converts raw images to WebP/responsive sizes
  - Strips metadata, applies compression
  - Generates optimized image list

- **fetch-route.ts** — `npm run fetch-route`
  - Fetches walking route geometry (OpenStreetMap)
  - Calculates turn-by-turn distances
  - Updates `content/routes.json`

- **image-manifest.json** — Config for image optimization (sizes, formats, compression)

---

### 📁 `docs/` — Reference & Decisions

- **README.md** — Project overview, quick-start, development guide
- **CONTRIBUTING.md** — Git workflow, branch naming, PR process
- **CLAUDE.md** — Project constraints & guidelines
- **DEPLOY.md** — Deployment to Cloudflare Pages
- **ROADMAP.md** — Feature roadmap & priorities
- **MISSING_INFO.md** — Content gaps needing ward input
- **screenshots/** — UI reference screenshots (phase-by-phase)
- **photos-with-people.md** — Photos containing identifiable people

---

### 📁 `.github/workflows/` — CI/CD

- Automated builds on push/PR
- Deploy preview to Cloudflare Pages
- Run typecheck, lint, build, verify-output

---

## Key Concepts & Data Flow

### **Content → Type → Component**
1. **Raw Content** (content/heritage/*.md, content/faq.json)
2. **Parse with Zod** (types/heritage.ts, types/faq.ts)
3. **Transform** (lib/content.ts, lib/faq.ts)
4. **React Component** renders data (components/*)

### **Bilingual Pipeline**
```
content/heritage/mhepi-ajima.en.md ─┐
content/heritage/mhepi-ajima.ne.md ─┤→ getHeritageList() → map marker, breadcrumb, SEO
content/faq.json (EN + NE)           ├→ Chatbot topics
src/i18n/en.json, ne.json            └→ UI strings
```

### **Image Delivery**
```
raw-data/mhepi-ajima/*.jpg (1–8 MB) ─→ npm run optimize-images
                                       ↓
                            public/images/mhepi-ajima/*
                            -480.webp, -640.webp, etc.
                            + no EXIF/metadata
```

### **3D Map Data**
```
content/heritage/*.md (coordinates) ─→ lib/map-data.ts ─→ MapLibre GeoJSON markers
                                       + heritage/people/sites features
                                       + clickable popups
```

### **Gallery Modes**
- **List View:** Photo + description + site name + year (responsive grid)
- **Grid View:** Photo grid thumbnails, tap to enlarge
- **3D Museum Mode:** WebGL canvas, photos as gallery walls, walk-through (desktop only)

---

## Key Files to Know

| Purpose | File |
|---------|------|
| **Page Layout** | `src/app/[lang]/layout.tsx` (html/body, the museum shell `MuseumShell.tsx` around every page, chatbot, map button); `src/app/[lang]/(site)/layout.tsx` (the cream content surface for every page except home) |
| **Global Styles** | `src/app/globals.css` |
| **Home Page** | `src/app/[lang]/page.tsx` (the museum itself: `src/components/MuseumShell.tsx`, `src/components/gallery/`) |
| **Heritage Detail** | `src/app/[lang]/(site)/heritage/[slug]/page.tsx` |
| **Gallery** | `src/app/[lang]/(site)/gallery/page.tsx`, `src/components/Gallery.tsx` |
| **3D Map** | `src/app/[lang]/(site)/map/page.tsx`, `src/components/MapView.tsx` |
| **Chatbot** | `src/components/Chatbot.tsx`, `src/components/ChatPanel.tsx` |
| **Content Loader** | `src/lib/content.ts` |
| **Build Check** | `scripts/check-content.ts` |
| **Heritage Sites** | `content/heritage/*.md` |
| **FAQ/Chatbot** | `content/faq.json` |
| **Localization** | `src/i18n/en.json`, `src/i18n/ne.json` |

---

## Deployment & Build

```bash
npm run build           # Static export → out/ (typecheck + lint + verify-output)
npm run dev            # Dev server on localhost:3000
npm run optimize-images # Regenerate responsive images from raw data
npm run check-content  # Validate markdown frontmatter
npm run fetch-route    # Update walking routes from OpenStreetMap
```

**Output:** `out/` directory (static HTML/CSS/JS)  
**Hosting:** Pushed to Cloudflare Pages, served from CDN

---

## Constraints & Design Principles

✅ **Static Export Only** — No server-side rendering, API routes, or database  
✅ **100% Free** — No paid APIs, keys, or services  
✅ **Mobile-First** — Responsive design for 360px–1920px viewports  
✅ **Bilingual** — Full EN + NE support, 100% translated UI  
✅ **Accessible** — WCAG 2.2 (semantic HTML, keyboard nav, alt text)  
✅ **Performance** — WebP images, lazy loading, static hosting on Cloudflare  
✅ **Truthfulness** — All historical facts from `content/`; placeholders fail the build
