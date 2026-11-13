# Roadmap

A living list of features for the Ward 16 heritage website. Move items between sections as plans change, and move them to **Done** with the pull request that delivered them.

Each item gives:
- **What:** a description of the feature.
- **Why:** why it matters.
- **Effort:** S (a day or two), M (about a week), L (several weeks).
- **Needs:** dependencies: data, consent, a translator, files from the ward.
- **Free:** how it stays within the Rs 0 budget, with no paid services and no billing keys.

Missing *facts* (dates, spellings, permissions) are tracked in [`MISSING_INFO.md`](../MISSING_INFO.md), not here. How we work (branches, pull requests, checks) is in [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## Before launch

### Phase 9B: Spatial Memory Archive
- **What:** a map layer of *memories* pinned to places. Each memory is one item: an inscription (photo, transcription, translation), a photo, or a short clip of interview audio, with a date or period. A timeline filter shows memories from a chosen period. Memories open in the place's detail panel and on the heritage page.
- **Why:** much of what makes these places matter lives in people's memories and in inscriptions few people can read. Pinning them to the map keeps them with the place, and the timeline shows how the place changed.
- **Effort:** L.
- **Needs:**
  - **Data:** the interview recordings in raw-data (Mhepi Ajima, Nanak Math, ward), cut into short clips with written transcripts, plus the inscription photos already transcribed.
  - **Consent:** a written consent form for each speaker and identifiable person. A memory is published only with consent `"approved"`, recorded in a consent file like `photo-consent.json`, and the build fails on anything else (the same rule as photos and the priest's credit).
  - **Translator:** Nepal Bhasa and Nepali review of transcriptions and translations.
  - Agreement on what counts as a "period" for the timeline (e.g. VS decades).
- **Free:**
  - Memories are content files in the repository, validated like the heritage pages.
  - Audio clips are compressed (Opus or MP3, a few hundred KB each) and served from Cloudflare Pages like the images.
  - The map layer reuses MapLibre, so no new service.
- *Absorbs the former MISSING_INFO item "Audio stories": community recordings with written consent, a place in the content schema and the detail panel.*

### Printable QR codes per site
- **What:** a QR code for each heritage site, in English and Nepali versions, linking to its page. Available as an SVG (for sign makers) and a print-ready PDF (an A5 card with the site name, the code and a short line in both languages).
- **Why:** visitors standing at the temple or math can open its story on their phone, which is the most direct way to bring people to the site.
- **Effort:** S.
- **Needs:**
  - The final public address (QR codes must point at a URL that will not change: set `SITE_URL` first).
  - Permission from the temple committee and the math to place the cards.
- **Free:**
  - Codes are generated at build time with an open-source QR library (pinned, MIT-licensed) into SVG files.
  - The PDF comes from a print stylesheet page ("Save as PDF" in any browser).
  - Printing is the only cost, and that is outside the website.

---

## Soon after launch

### YouTube videos
- **What:** short videos of the sites and festivals on the heritage pages, embedded with a "lite" player that shows only a thumbnail until tapped, through `youtube-nocookie.com`.
- **Why:** festivals, music and processions are best shown in motion. The lite embed keeps pages fast (no YouTube script until play) and sets no tracking cookies before play.
- **Effort:** S–M.
- **Needs:**
  - Edited, compressed videos (the raw files are 6–297 MB).
  - Consent for identifiable people.
  - A ward or team YouTube channel.
- **Free:**
  - YouTube hosting is free.
  - The lite embed is a small open-source component, pinned.
- *Absorbs the former MISSING_INFO item "Video": decide whether to include a short clip.*

### Festival calendar (Bikram Sambat + AD, `.ics` download)
- **What:** the festivals and jatras of each site listed by date in both Bikram Sambat and AD, with an "Add to calendar" `.ics` download per event and for the whole year.
- **Why:** visitors and families can plan around the yearly jatra and the main pujas.
- **Effort:** M.
- **Needs:**
  - Each year's exact dates: lunar festivals move every year, so the dates come from the official panchanga or the ward, not from calculation.
  - The unresolved Mhepi jatra length (see MISSING_INFO.md).
- **Free:**
  - Dates live in a content file updated once a year.
  - `.ics` files are generated at build time as static files.
  - No calendar service is involved.

### Then-and-now photo slider
- **What:** an old photo and a new one of the same view, with a slider to compare them.
- **Why:** it shows change (rebuilding after earthquakes, the surroundings) at a glance.
- **Effort:** S–M.
- **Needs:**
  - Historic photos with the owner's permission and a credit.
  - New photos taken from the same spot.
- **Free:** a small client component; images go through `npm run optimize-images` like all others.

### Offline PWA
- **What:** an installable web app. Pages, photos and the chatbot stay readable without a connection once visited.
- **Why:** mobile data is patchy around the sites, and visitors may want to read on the spot.
- **Effort:** M.
- **Needs:** a decision on what to cache. Map tiles from OpenFreeMap must **not** be bulk-cached; the map stays online-only.
- **Free:** a web app manifest and a service worker, served as static files. No push notifications or paid services.

### Decap CMS for ward staff
- **What:** a simple editing screen, at an `/admin` page, where ward staff change text and photos without touching code. Each edit becomes a pull request, so the same build checks run before anything goes live.
- **Why:** the ward should be able to keep the site current without a developer.
- **Effort:** M–L.
- **Needs:**
  - Mapping our bilingual content (frontmatter, heading ids, source comments) into the CMS.
  - GitHub accounts for editors.
  - Training.
- **Free:**
  - Decap CMS is open source.
  - The login runs through GitHub plus a small OAuth helper on a Cloudflare Worker's free tier.
  - Content stays in the repository.

### Cloudflare Web Analytics
- **What:** page views and popular pages, without cookies or personal data.
- **Why:** shows which pages and features people actually use, to guide this roadmap.
- **Effort:** S.
- **Needs:** turning it on for the Pages project, and allowing its script in `public/_headers` if a content security policy is added.
- **Free:** Cloudflare Web Analytics is free and needs no cookie banner.

---

## Later

### 360° panoramas
- **What:** look-around views of courtyards and shrines (where allowed), using Pannellum.
- **Why:** gives a sense of place to people who cannot visit, such as the diaspora and students.
- **Effort:** M.
- **Needs:**
  - Panorama photos (from a phone app or a 360° camera).
  - Permission for inner areas.
  - Consent for identifiable people.
- **Free:** Pannellum is open source (MIT); the panoramas are ordinary images served from Pages.

### Photogrammetry 3D models of temples
- **What:** a 3D model of a shrine or building that visitors can rotate, using `<model-viewer>`.
- **Why:** records the structures as they are today, which matters after earthquake damage and rebuilding, and lets people explore them closely.
- **Effort:** L.
- **Needs:**
  - Permission to photograph every side.
  - Many overlapping photos.
  - Processing into a compressed glTF/GLB file, small enough for phones.
- **Free:**
  - Free photogrammetry software for processing.
  - `<model-viewer>` is open source.
  - Model files are served from Pages (within its per-file size limit).

### Inscription zoom viewer with transcription
- **What:** a high-resolution inscription photo to pan and zoom, beside its transcription and translation, with matching lines highlighted.
- **Why:** inscriptions are primary sources, and most visitors cannot read Nepal Bhasa or old scripts.
- **Effort:** M.
- **Needs:**
  - High-resolution photos.
  - A Nepal Bhasa reader to check the transcriptions (already listed in MISSING_INFO.md).
- **Free:** an open-source zoom viewer and image tiles generated at build time.

### Nepal Bhasa as a third language
- **What:** the whole site, including the chatbot, in Nepal Bhasa, next to English and Nepali.
- **Why:** it is the language of the Newar communities whose heritage much of this is, including the Mhepi Ajima inscriptions and jatra.
- **Effort:** L.
- **Needs:**
  - A translator and a reviewer.
  - Agreement on spelling conventions.
  - A language code and hreflang setup.
- **Free:** the language system already supports adding a locale. The cost is translation time, done by volunteers or the ward.

### "Listen to this page" narration
- **What:** a play button that reads the page aloud.
- **Why:** helps people who find reading hard, older visitors and visitors on the move.
- **Effort:** M.
- **Needs:** human recordings for Nepali and Nepal Bhasa (browser text-to-speech is poor or missing for them); English could fall back to the browser's voice.
- **Free:** volunteers record the narration, and the audio files are served from Pages.

### Learning corner (quiz + worksheets)
- **What:** a tap-only quiz per site (like the chatbot: no typing) and printable worksheets for schools.
- **Why:** brings local schools to the sites and the site to classrooms.
- **Effort:** M.
- **Needs:**
  - Questions written only from published content.
  - Input from teachers.
  - Nepali review.
- **Free:** a static JSON file and a small component; worksheets print to PDF from the browser.

### Moderated "share a memory" form
- **What:** a form where people send a memory, photo or story about a site. Nothing appears on the site automatically: a moderator checks it, gets consent, and adds it to the Memory Archive.
- **Why:** lets the community add to the archive.
- **Effort:** S–M.
- **Needs:**
  - A moderator at the ward.
  - A consent form.
  - The Memory Archive (Before launch) to publish into.
- **Free:** the existing Web3Forms setup (free tier) sends submissions by email; no database is needed.

### More ward heritage sites
- **What:** add other heritage sites in Ward 16 (temples, maths, kuthis, ponds) when their data is ready.
- **Why:** Ward 16 has more heritage than two sites.
- **Effort:** M per site.
- **Needs:**
  - Data (history, interviews, inscriptions), photos and consent.
  - Ward approval.
  - With several sites, agreed **categories** for the map filters (e.g. temple, math, kuthi). Add a `category` field to the content schema only once the ward agrees.
- **Free:** pages, gallery, map markers, chatbot topics and the walking route all come from the content files automatically.
- *Absorbs the former MISSING_INFO item "Categories".*

### Ward boundary on the map
- **What:** an outline of Ward 16 on the 3D map.
- **Why:** shows visitors where the ward begins and ends, and which sites are inside it.
- **Effort:** S once the data exists.
- **Needs:** boundary data (GeoJSON) from KMC or OpenStreetMap; it is not in the raw data.
- **Free:** a static GeoJSON file drawn by MapLibre, with OpenStreetMap attribution if taken from OSM.
- *Absorbs the former MISSING_INFO item "Ward 16 boundary GeoJSON".*

### News and announcements
- **What:** short bilingual posts from the ward, about festivals, restoration work and events, with an RSS feed.
- **Why:** gives people a reason to come back, and the ward a channel for heritage news.
- **Effort:** S–M.
- **Needs:**
  - Someone at the ward to write posts.
  - Ideally Decap CMS, so they can publish without a developer.
- **Free:** posts are content files; the RSS feed is generated at build time.

---

## Done

### Walking route and map enhancement (Bhumi, PR #1)
- **What:** the map sidebar with search and filters, a place-detail panel with each site's story and photos, and a step-by-step walking route between the published sites (`content/routes.json`).
- **Merged:** 13 Nov 2026. Follow-ups are on branch `fix/route-polish` (Nepali digits, real walking paths, one shared phone breakpoint), plus "verify the walking route on foot" in MISSING_INFO.md.
