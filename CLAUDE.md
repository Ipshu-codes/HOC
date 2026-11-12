@AGENTS.md

# Ward 16 Heritage Website
- Sites: Mhepi Ajima, Nanak Math — Ward No. 16, Kathmandu Metropolitan City
- Stack: Next.js (App Router) + TypeScript + Tailwind, static export (output: 'export'). Hosting: Cloudflare Pages.
- No server features: no API routes, server actions, middleware or ISR.
- Everything must be FREE. No paid services, no API keys needing billing.
- Theme: red. Use only the named Tailwind colors: crimson, brick, vermilion, gold, cream, sand, ink. Vermilion and gold fail AA for body text — decoration / large text only (see src/app/globals.css).
- Layout follows raw-data/sketch.jpg (actual file: ward16-heritageraw-data/HOC/sketch.png).
- Content lives ONLY in content/. Never invent historical facts; use [TODO: …] and log in MISSING_INFO.md.
- Draft content: files with `draft: true` may hold [PLACEHOLDER: …] text. `npm run check-content` (run automatically by `npm run build`) fails on any [PLACEHOLDER, [TODO or draft — never bypass it. In dev, draft pages show <DraftBanner>.
- Raw data is in ward16-heritageraw-data/HOC/ (git-ignored, ~1.5 GB). Web images are built from it by `npm run optimize-images` using scripts/image-manifest.json; alt text lives in content frontmatter.
- Bilingual EN/NE via app/[lang]/. UI strings in src/i18n/. Font: Mukta for Devanagari.
- Strict TypeScript, no `any`. Client components only where needed (map, chatbot, gallery, nav toggle).
- Team knows JS/TS, React, Next.js, PostgreSQL — explain anything new (MapLibre, Fuse.js) in comments.
- Mobile-first, accessible, every image has alt text.
- Work one phase of PLAN.md at a time; commit and stop for review after each.
