# MISSING_INFO.md — gaps to fill before launch

Everything here is either missing from the raw data or needs a human to check it.

**Current status (12 Nov 2026):**

- **Mhepi Ajima is a draft** (`draft: true`). Only facts from inscriptions and notice boards are kept; every other section is `[PLACEHOLDER: …]` text until the ward sends the data. The sattal fees and committee phone were removed from the page until confirmed.
- **Nanak Math is publishable.** Facts that are still unknown (entry fee, photography rules, etiquette, most festival months) are simply left off the page rather than shown as TODOs. They stay listed in §2 so they can be added later.
- `npm run build` refuses to run while any content file has `draft: true`, `[PLACEHOLDER` or `[TODO` (`npm run check-content`).

## 0. Untranscribed audio (Whisper skipped — ward will supply Mhepi data)

Most of the missing Mhepi Ajima content, and all ward information, is probably in these recordings. They have **not** been transcribed.

| File | Length | Likely contents |
|---|---|---|
| `Mhepi Ajima/Audio/mhepi ajima 1.m4a` | 13 min | History, legends, festivals |
| `Mhepi Ajima/Audio/Mhepi Ajima 2.m4a` | ~19 min | Same as above |
| `Mhepi Ajima/Audio/Mhepi Temple .m4a` | ~5.5 min | Same as above |
| `Ward people/ward 16 puspa sir.m4a` | 6 min | Ward facts, office contact |
| `Guru Nanak Mantha/Audio/nanak mantha 1–10.m4a` | ~32 min | May add to, or contradict, the docx |

**Options:**

- **(a)** A team member listens and writes notes or transcripts into a `.docx` or `.txt` in raw-data.
- **(b)** Claude runs free, local speech-to-text (Whisper) to produce **draft** transcripts for a human to correct. Accuracy for Nepali and Nepal Bhasa is limited, so the drafts cannot be published unchecked.

## 1. Mhepi Ajima

- [ ] **Founding year / age** (`established`)
- [ ] **History**: origin, who built it, major events
- [ ] **Legends & beliefs**: what the goddess is known for, why she is called "Yogambar Jnaneshwari"
- [ ] **Festivals & jatras**: names, months, descriptions (the `festivals` list is all TODO)
- [ ] **Tradition / community**: which community worships here (the donor names are Shrestha, Shakya, Timila and Maharjan)
- [ ] **Architecture**: style, materials and dating (section is a placeholder; the earlier photo-based description was removed)
- [ ] **Opening hours**: the committee notice board says 8–11 am, but this may be office or booking hours
- [ ] **Entry fee**
- [ ] **Photography rules**, dress and footwear etiquette
- [ ] **Directions / nearest landmark**: the only written location is "नयाँ बजार, का.म.न.पा. वडा नं. १६"
- [ ] **Committee phone** (removed from page): read as ४३५९८९० from a weathered notice board; must be checked
- [ ] **Sattal fees** (removed from page): read from the notice board (Rs 1,000–5,000 + Rs 300); confirm the current rates
- [ ] **Bhajan line 2**: is it "जय गुह्येश्वरी आमा"? The letter was hard to read.
- [ ] **Official spelling of the name**: the sources use म्हेपी, म्हेंपी, म्हैपी, म्ह्यपी, म्हयपि and म्हेयपि. The site uses **म्हेपी अजिमा** (from PLAN.md). Confirm, and confirm the English spelling "Mhepi Ajima".
- [ ] **Translations of the three Nepal Bhasa (Newari) inscriptions** (NS 1120 marble, NS 1121 brass, NS 1134 brass): Claude's rendering needs a Nepal Bhasa reader
- [ ] **Day of the marble inscription**: "वि.सं. २०५७ श्रावण __ गते" is faded
- [ ] **Identify the reclining figure in the water tank** and the other smaller shrines (alt text currently only describes them)
- [ ] **Location of the tree-lined stairway** (`tree-lined-stairway.webp`): was it the approach to Mhepi Ajima?

## 2. Nanak Math

- [ ] **Entry fee** (not shown on the page until known)
- [ ] **Photography rules** and dress/footwear etiquette (not shown on the page until known)
- [ ] **Festival months**: the docx gives the festival names but not months, except Akshaya Tritiya (Baishakh, from the plaques) and Asar Shashthi. The `month` field is omitted for Basanta Panchami, Kojagrat Purnima, Teej, Vijaya Dashami, Navaratri and the Sorha Shraddha full moon.
- [ ] **Have a local source confirm the Guru Nanak connection.** The History section ("The name and the age of the math") says Sikh tradition *associates* the math with Guru Nanak Dev, who is *believed* to have visited and meditated here. It cites three web sources:
  - **Spotlight, 2019:** he came on his third udasi; the math is next to the Bishnumati bridge, Balaju. It gives no year.
  - **Nepali Times, 2014 ("Little Punjab"):** he meditated for more than a year at the site now known as Nanak Math, Balaju. It gives no year.
  - **Wikipedia, "Sikhism in Nepal":** "It is believed that Guru Nanak visited the math in 1516". Its only citation for the year is a 2013 SikhNet news item.
  - None of the sources says the math is *named* after him, so the page doesn't say so either.
  - The math's own written account and signboards do not mention Guru Nanak.
  - The Hindustan Times / barusahib.org article was dropped (13 Nov 2026) because it is about a different shrine, in Thapathali.
- [x] **Conflicting ages**: the written account says the guru gaddi is **1,000 years** old; the signboards speak of **5,000 years**; published accounts of Sikh tradition place Guru Nanak's believed visit **around 1516**. All three are shown side by side, each attributed, in History (EN + NE) and in the chatbot. The Architecture section also mentions the first two.
- [ ] **Alternative name "Siddheshwar Mahadev"**: given by the ward team (13 Nov 2026). It is shown **only** in the chatbot's topic label, "Nanak Math (Siddheshwar Mahadev)" / "नानक मठ (सिद्धेश्वर महादेव)", as instructed.
  - A search of raw-data found **no occurrence** of Siddheshwar / सिद्धेश्वर (or its spelling variants) in the docx, the transcribed signboards and inscriptions, or any file name. The three web sources don't mention it either.
  - [ ] Give a source for the name (a document, signboard or interview) before it is used anywhere else on the site.
  - [ ] Check the Nepali spelling सिद्धेश्वर महादेव (written by Claude).
  - The earlier message with "six steps" for this name never arrived.
- [ ] **"1450"**: the docx says Brahmaharidas practised at the math "from 1450" without naming the era. The content assumes VS, to match his VS 1432 birth.
- [ ] **Name and spelling**: Nanak Math / Nanak Mantha / Prachin Udasin (Udashin) Nanak Math; नानक मठ / नानकमठ. Confirm the preferred English and Nepali forms.
- [ ] **Identify photographed features** (the alt text is descriptive only):
  - Is the shrine room with the pink canopy (`shrine-room.webp`) the Vedic granth gaddi or the guru gaddi?
  - Are the three garlanded stone platforms (`three-stone-platforms.webp`) the samadhi of the three saints?
  - Is the orange image under the tree (`shrine-under-tree.webp`) the Hanuman shrine?
  - Who does the statue under the canopy (`sadhu-statue.webp`) depict?
  - Is the construction site in the photos the yajnashala?
- [ ] **Who wrote the docx?** It speaks of "my gurudev" and appears to be by the current mahant. This is needed for attribution.
- [ ] **Review of the English translation** of the docx (by Claude)

## 3. Both sites

- **Coordinates** (given by the ward team on 12 Nov 2026, checked against OpenStreetMap):
  - [x] **Mhepi Ajima**: 27.7172, 85.3082. OSM reverse-geocodes this to Naya Bazar, Kathmandu-16 ✓. It is in the content (shown on the map in dev; the site is still a draft).
  - [x] **Nanak Math**: 27.7257, 85.3064 (from gurdwara-sahib.pages.dev). OSM reverse-geocodes it to an amenity named **"Gurunayak Math"**, Naya Bazar, Kathmandu-16 ✓. It is marked approximate (`coordinatesApproximate: true`). The first point offered, 27.73678, 85.28086, landed on a Shiva temple in Nagarjun Municipality and was rejected.
  - [ ] Confirm the exact point on a site visit, then remove `coordinatesApproximate`.
  - [x] **Ward office**: about 27.7290, 85.3016 (Balaju, Kathmandu-16 on OSM). It is marked approximate in `content/ward.json` and on the map. An exact point would allow a small embedded map in the home Contact section.
- [ ] **Ward 16 boundary GeoJSON**: not in the raw data, so the map has no ward outline. It might be available from KMC or OSM.
- [x] **Photo credit line**: "Photos: Samyojan, 2026" / "तस्बिर: संयोजन, २०२६" (`content/credits.json`). It is shown on the detail pages, the gallery page and inside the lightbox.
- [ ] **Bhandara photo**: the `IMG-*-WA*.jpg` files are WhatsApp forwards, several watermarked "SHOT ON UMIDIGI G9A", so someone outside the team took them. `bhandara.webp` (from `IMG-20261104-WA0022.jpg`) was **removed from the site** in Phase 6; the original stays in raw-data. **Re-add only with the photographer's permission and a "Photo courtesy of …" credit.** No other WhatsApp photo is published.
- [x] **Consent decisions for people in photos**: all nine photos in `docs/photos-with-people.md` were set to `"approved"` in `content/photo-consent.json` on 12 Nov 2026 ("use photos with people"). Changing one to `"removed"` still hides it everywhere. The strict build fails if any photo is ever `"pending"` again.
  - Not used: the Mhepi team group photo (`Mhepi Ajima/Photo/20261104_085758.heic`), a team selfie (`Guru Nanak Mantha/Photo/20261104_100241.heic`), and portraits of an elderly sadhu (`IMG_20261104_095808.jpg`, `IMG_20261104_095816.jpg`, `IMG_20261104_095816_1.jpg`).
- [ ] **Permission** from the math's mahant and the Mhepi committee to publish photos of the inner shrines
- [ ] **Video**: none is used yet. Decide whether to include a short clip; the files are 6–297 MB and would need compressing.

## 3b. Home page

- [x] **Hero photo**: option 1 (`courtyard-view`) chosen in the Phase 4 review. Option 2 (`carved-windows`, which shows identifiable people) is not to be used and has been removed from `heroCandidates`.
- [ ] **Chairperson's name** is in `content/ward.json` but deliberately not shown anywhere until confirmed.

## 4. Ward information (for `ward.json`, header, footer, contact page)

- [x] **Ward logo**: `wardlogo.png` added to raw data (the KMC emblem); cropped to a circle in `public/images/logo/`
  - [ ] Confirm the ward has no logo of its own and the KMC emblem is the right one to use
- [x] **Ward office address**: Balaju, Kathmandu (given by the ward team, 12 Nov 2026)
  - [ ] A more precise address or landmark for the Contact section and the map
- [x] **Phone**: 01-4981653
- [x] **Email**: ward16@kathmandu.gov.np
- [ ] **Office hours**
- [ ] **Ward facts** for the About section: area, population, tole names, etc. The home page About section currently has only the municipality, ward number, office location and the list of sites. A dev-only `[PLACEHOLDER]` box (`home.aboutPlaceholder` in `src/i18n/*.json`) marks the gap. Production builds never render it, and `verify-output` would fail if they did.
- [x] **Ward chairperson**: Rojina Shrestha (in `ward.json`; not yet shown on the site)
  - [ ] Check the Nepali spelling रोजिना श्रेष्ठ (written by Claude)
- [ ] **Official portal URL**: the ward team named "Kathmandu Metropolitan City Ward No. 16" as the official portal but gave no web address
- [ ] **Web3Forms recipient email** (Phase 9)

## 5. Nepali text needing native-speaker review

These files contain Nepali written by Claude, not taken from a source. A native speaker should review them.

- `content/heritage/mhepi-ajima.ne.md`: the whole file apart from quoted inscriptions and the bhajan
- `content/heritage/nanak-math.ne.md`: mostly the docx's own sentences, shortened. The summary, How to Visit, list intros and table labels are by Claude.
- The `alt` text in all `gallery` entries of the `.ne.md` files
- `src/i18n/ne.json`: all Nepali UI strings (nav, footer, language toggle, skip link) were written by Claude
- `content/faq.json`: all Nepali questions (`q_ne`) and answers (`a_ne`) were written by Claude from the page content. Also check that the Nepali question variants match how people would actually ask.

## 6. Chatbot

- [ ] **Answers without data**: the entry-fee and photography answers say there is no confirmed information and point to the ward office. Update them in `content/faq.json` once the facts are known.
- [ ] **More questions**: add entries for questions people actually ask. The answers must come from the content; the build checks that every "Read more" anchor exists in both languages.
- **Tap-only (13 Nov 2026):** visitors choose a topic, then a question; there is no typing. Three general entries ("Where can I see photos?", "Is this website in Nepali?", "Who took the photos?") have no topic (`"topic": null`). They appear only as related questions under other answers.
  - [ ] Should they get a topic of their own?
