# Ward 16 Heritage Website

An interactive digital platform designed to preserve, explore, and promote the cultural heritage of **Ward No. 16, Kathmandu Metropolitan City**, featuring two major heritage sites: **Mhepi Ajima** temple and **Living Bhu-Samadhi (Nanak Math)**.

## ✨ What's Implemented

### Core Features
- ✅ **Bilingual Interface** — 100% English + Nepali (नेपाली) support with instant language switching
- ✅ **Mobile-First Design** — Fully responsive (360px–1920px), tested on phones/tablets/desktop
- ✅ **Heritage Site Pages** — Rich detail pages with history, architecture, visiting info, Quick Facts
- ✅ **Photo Gallery** — 53+ heritage photos with 3 view modes:
  - **List View:** Photo + description + site metadata (recently improved layout)
  - **Grid View:** Thumbnail grid, tap to enlarge
  - **3D Museum Mode:** WebGL canvas, walk through photos as gallery walls (desktop)
- ✅ **Interactive 3D Map** — MapLibre-based map with:
  - Terrain rendering, site markers, popups, search, filters
  - Floating "Map" button on all pages (bottom-left)
  - Mobile preview mode with "Show 3D Map" CTA
  - Walking routes with turn-by-turn navigation
- ✅ **AI Chatbot ("Nani")** — Floating guide character (bottom-right) with:
  - Tap-only interface (no typing)
  - Topic-based Q&A (site-specific + general topics)
  - Pre-loaded smart question chips
  - Full multilingual support (EN + NE)
- ✅ **Home Page** — Hero slideshow (auto-rotating site photos), overview, ward info, illustrations
- ✅ **Contact Page** — Ward office details, email, visiting hours
- ✅ **Accessibility** — WCAG 2.2 compliant: semantic HTML, keyboard navigation, alt text on all images
- ✅ **SEO** — Sitemap, robots.txt, meta tags, structured data for search engines
- ✅ **Static Export** — Pure HTML/CSS/JS (no server-side code, 100% free hosting on Cloudflare Pages)

### Design & UX
- ✅ **Editorial Minimalism** — Clean layouts, generous whitespace, full-bleed photography
- ✅ **Cultural Color Palette** — Warm stone, crimson, terracotta, gold (Nepali aesthetic)
- ✅ **Responsive Images** — WebP with srcset (480/640/960/1280/1920px), lazy loading, no metadata
- ✅ **Justified Text** — Full-width paragraph justification (1024px+)
- ✅ **Dark Mode** — Full dark/light theme support
- ✅ **Sticky Navigation** — Header collapses, sticky nav bar appears with logo button

### Content Management
- ✅ **Markdown Content** — Heritage pages in Markdown with frontmatter (location, established, festivals, etc.)
- ✅ **Structured Data** — JSON files for FAQ, credits, sources, routes, photo consent
- ✅ **Build-Time Validation** — Automatic checks for:
  - Placeholders (`[PLACEHOLDER: …]`, `[TODO: …]`)
  - Draft pages (unpublished sites hidden from map/links)
  - Broken references (unknown people, sources, photos)
  - EXIF metadata in images (privacy check)
- ✅ **Version Control** — All content in git, collaborative editing with conflict resolution

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (LTS recommended)
- **npm** (or yarn/pnpm)
- **Git**

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Ipshu-codes/HOC.git
cd HOC

# Install dependencies
npm install

# Start development server
npm run dev
# → Open http://localhost:3000 in your browser

# View site in Nepali
http://localhost:3000/ne
```

### Available Commands

```bash
# 🏗️ Development & Building
npm run dev                 # Start dev server (localhost:3000)
npm run build              # Static export to out/ (includes typecheck + lint)
npm run build:preview      # Build without draft sites
npm start                  # Serve static output locally (after build)

# ✍️ Content
npm run optimize-images    # Regenerate responsive images from raw data
npm run check-content      # Validate Markdown frontmatter & build checks
npm run fetch-route        # Update walking routes from OpenStreetMap
npm run lint               # ESLint + TypeScript checks
npm run typecheck          # Full TypeScript type checking

# 📦 Deployment
npm run build              # Builds static export → out/
# (automatically deployed to Cloudflare Pages on main branch)
```

---

## 📁 Project Structure

**Key directories:**

```
src/
├── app/                    # Next.js App Router pages & layouts
│   └── [lang]/             # Language-specific routes (/en, /ne)
│       ├── page.tsx        # Home page
│       ├── gallery/        # Photo gallery (list/grid/3D museum)
│       ├── heritage/[slug] # Heritage site detail pages
│       ├── map/            # 3D interactive map
│       └── contact/        # Contact page
├── components/             # React components (25+ UI components)
│   ├── Gallery.tsx         # Multi-view gallery
│   ├── Chatbot.tsx         # Nani chatbot interface
│   ├── MapView.tsx         # MapLibre 3D map rendering
│   └── ...                 # Header, Nav, Footer, etc.
├── lib/                    # Utility functions
│   ├── content.ts          # Load heritage sites & metadata
│   ├── faq.ts              # Build chatbot topics
│   ├── map-data.ts         # Transform sites into map markers
│   └── ...                 # i18n, format, images, etc.
├── types/                  # TypeScript definitions
├── i18n/                   # UI strings (en.json, ne.json)
└── app/globals.css         # Global styles, Tailwind, breakpoints

content/                     # Content (data, not code)
├── heritage/               # Heritage site Markdown (EN + NE)
│   ├── mhepi-ajima.en.md
│   ├── mhepi-ajima.ne.md
│   ├── nanak-math.en.md
│   └── nanak-math.ne.md
├── faq.json                # Chatbot Q&A (EN + NE)
├── credits.json            # People who provided info
├── sources.json            # Cited sources
├── home.json               # Home page content
├── ward.json               # Ward office details
└── ...                     # Other content files

public/images/              # Optimized responsive images (all WebP)
├── mhepi-ajima/            # 25+ heritage photos
├── nanak-math/             # 30+ heritage photos
├── nani/                   # Chatbot character avatars
└── ...

scripts/                    # Build-time utilities
├── check-content.ts        # Content validation
├── verify-output.ts        # Output verification
└── optimize-images.ts      # Image optimization
```

**→ [Full structure documentation](docs/PROJECT-STRUCTURE.md)**

---

## 🛠️ Development Workflow

### 1. Creating a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
# or for fixes:
git checkout -b fix/your-fix-name
```

### 2. Making Changes

**For content (heritage sites, FAQ, etc.):**
- Edit files in `content/` directory
- Run `npm run check-content` to validate
- Changes are automatically picked up in dev server

**For code (components, pages, styles):**
- Edit files in `src/` directory
- Dev server hot-reloads changes
- Run `npm run typecheck` to catch TypeScript errors
- Run `npm run lint` to check code style

**For images:**
- Place raw images in `ward16-heritageraw-data/HOC/` (git-ignored, local only)
- Run `npm run optimize-images` to generate responsive WebP versions
- Commit the generated images in `public/images/`

### 3. Validating Your Work

```bash
# Full validation (runs before every build)
npm run typecheck           # TypeScript errors
npm run lint                # ESLint issues
npm run check-content       # Content validation
npm run build              # Full static export (includes verify-output)
```

### 4. Testing Responsiveness

**Desktop:**
- Chrome DevTools (F12 → device emulation)
- Test at: 1440px, 1280px, 1024px, 768px

**Mobile:**
- Real device (best)
- Chrome mobile emulation: 390px, 360px

**Bilingual Testing:**
- Switch language in top-right corner
- Verify all text, images, layouts match both EN + NE

### 5. Committing & Pushing

```bash
git add <files>
git commit -m "feat(gallery): improve list view layout" 
# Commit message format: type(scope): description
# Types: feat, fix, docs, style, refactor, test, chore

git push origin feature/your-feature-name
```

**→ [Detailed Git workflow](CONTRIBUTING.md)**

### 6. Opening a Pull Request

1. Go to [GitHub repo](https://github.com/Ipshu-codes/HOC)
2. Click "New Pull Request"
3. Base: `main`, Compare: your branch
4. Add descriptive title & description
5. Mention what you tested
6. Link any related issues

**→ [PR review checklist](CONTRIBUTING.md)**

---

## 🎨 Styling & Colors

**Color Palette (Tailwind named colors):**
- **Crimson** — Primary accent (buttons, links)
- **Brick** — Secondary accent
- **Vermilion, Gold** — Decoration/large text only (poor AA for body text)
- **Cream, Sand** — Backgrounds
- **Ink** — Text

**Responsive Breakpoints:**
- `sm` = 640px
- `md` = 768px
- `lg` = 1024px (`MOBILE_QUERY` for map/gallery layout switch)
- `xl` = 1280px

**Global Styles:** `src/app/globals.css`
- Font families, sizing, spacing
- Dark mode (Tailwind `prefers-color-scheme`)
- Justified text breakpoint
- Gallery list-row layout

---

## 📱 Mobile & Accessibility

### Mobile-First
- Design starts at 360px
- Progressive enhancement up to 1920px
- Touch-friendly buttons (min 44px × 44px)

### Accessibility (WCAG 2.2)
- Semantic HTML (`<section>`, `<nav>`, `<main>`, `<article>`)
- Keyboard navigation (Tab, Enter, Escape)
- Skip links for navigation
- Alt text on all images
- Color contrast ≥ 4.5:1 (body text)
- Focus indicators visible
- Landmarks & ARIA labels for screen readers

### Testing
```bash
# Lighthouse audit in Chrome DevTools
# axe DevTools browser extension
# Screen reader: NVDA (Windows), VoiceOver (Mac)
```

---

## 🌍 Localization (EN + नेपाली)

### UI Strings
- English: `src/i18n/en.json`
- Nepali: `src/i18n/ne.json`

### Heritage Content
- English: `content/heritage/[site].en.md`
- Nepali: `content/heritage/[site].ne.md`

### Font
- **Devanagari:** Mukta (Google Fonts)
- **Latin:** System sans-serif (Segoe UI, Roboto, etc.)

### Adding New Content
1. Write `content/heritage/newsite.en.md`
2. Write `content/heritage/newsite.ne.md` (translated)
3. Add people to `content/credits.json` with `credit` field
4. Run `npm run check-content` to validate
5. Commit both `.md` files + updated `credits.json`

---

## 🗺️ Map & Route Management

### Adding a Walking Route
1. Create stops in `content/routes.json` (site slugs in order)
2. Run `npm run fetch-route` to calculate distances from OpenStreetMap
3. Commit updated `routes.json`

### Map Data Sources
- **Tiles:** OpenStreetMap + OpenStreetMap terrain
- **Markers:** Heritage sites from `content/heritage/`
- **Search:** Fuse.js fuzzy search over site names
- **Attribution:** Always shown in map bottom-left

---

## 🚀 Deployment

### Automatic Deployment (Cloudflare Pages)
1. Push to `main` branch
2. GitHub Actions runs: typecheck → lint → build → verify-output
3. If all checks pass, `out/` is deployed to `https://wardheritage.site` (or configured domain)
4. No manual deployment needed

### Manual Deployment
```bash
npm run build              # Generate out/
npm start                  # Serve locally on port 3000 to test

# To deploy to Cloudflare Pages manually:
# → Push to main (auto-deploys)
# or use Wrangler CLI (see DEPLOY.md)
```

**→ [Deployment docs](DEPLOY.md)**

---

## 📚 Detailed Documentation

- **[Project Structure](docs/PROJECT-STRUCTURE.md)** — Detailed breakdown of all directories & files
- **[Contributing](CONTRIBUTING.md)** — Git workflow, branch naming, PR process
- **[Roadmap](docs/ROADMAP.md)** — Planned features & priorities
- **[Missing Info](MISSING_INFO.md)** — Content gaps needing ward input
- **[Deployment](DEPLOY.md)** — Cloudflare Pages setup & CI/CD
- **[Code Review Checklist](CONTRIBUTING.md)** — What to check before merge

---

## 🤝 Contributing

We welcome contributions! Please:
1. Read [CONTRIBUTING.md](CONTRIBUTING.md) for workflow
2. Create a feature branch from `main`
3. Make changes, test responsively, validate content
4. Push & open a pull request with description
5. Address review feedback
6. Merge only after approval (no force-push to main)

**Team:** @gugu-codes (lead), @Ipshu-codes (design/PM)

---

## 📋 Content Guidelines

### Historical Accuracy
- ✅ All facts must have sources (cite in content comments)
- ❌ Never invent facts (use `[TODO: …]` for unknowns)
- ✅ Tag photos with identifiable people in `content/photo-consent.json`

### Markdown Format
```markdown
---
slug: site-slug
name: "Site Name"
location: "Full address"
established: "Dynasty/Year"
deity_or_tradition: "Main deity or tradition"
visiting:
  hours: "6 AM – 6 PM"
  entry: "Free / NPR 100"
festivals:
  - name: "Festival Name"
    month: "Month"
informationFrom:
  - person:credit-id
---

# History {#history}
Main history section...
```

### Validation
- Slug must match filename (e.g., `site-name.en.md`)
- Headings need stable IDs: `## Title {#id}` (same in EN + NE)
- People references must exist in `content/credits.json`
- No `[PLACEHOLDER: …]` or `[TODO: …]` in published content

---

## 🐛 Troubleshooting

### Dev server shows stale changes
```bash
# Restart dev server:
npm run dev
# (Ctrl+C to stop, then run again)

# If still stale, clear cache:
rm -rf .next
npm run dev
```

### Build fails with validation errors
```bash
npm run check-content       # See specific issues
# Fix content (check output messages)
npm run build              # Retry
```

### Images not optimized
```bash
npm run optimize-images    # Regenerate from raw data
git add public/images
git commit -m "chore(images): regenerate"
```

### Merge conflict in globals.css
- **Keep both sides** of color palette definitions
- **Resolve layout conflicts manually** (read both versions carefully)
- **Test responsively** after resolving
- See [CONTRIBUTING.md](CONTRIBUTING.md) for conflict resolution

---

## 📊 Performance & Analytics

- **Static Export:** Pure HTML/CSS/JS, served by CDN (fast)
- **Image Optimization:** WebP + srcset for fast loading on mobile
- **No Tracking:** Privacy-first (no analytics, no cookies, no ads)
- **Lighthouse Score:** Target 90+ on mobile & desktop

---

## 📝 License

[To be determined — add your license here]

---

## 💬 Questions?

- 📧 **Email:** ward@example.com (or contact page link)
- 🗺️ **GitHub Issues:** [Report a bug or request a feature](https://github.com/Ipshu-codes/HOC/issues)
- 📖 **Docs:** See links above for detailed guides
