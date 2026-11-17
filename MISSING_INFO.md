# MISSING_INFO.md — gaps to fill before launch

Everything here is either missing from the raw data or needs a human to check it. Feature ideas live in [docs/ROADMAP.md](docs/ROADMAP.md).

**Current status (13 Nov 2026):**

- **Mhepi Ajima is published** (13 Nov 2026). History, legends, festivals, architecture and present day now come from the ward's interview with the temple's chief priest (`Mhepi Ajima/mhepi_ajima.docx`), plus the inscriptions and notice boards. Facts still unknown (opening hours, entry fee, photography rules, directions) are left off the page and listed in §1. The sattal fees and committee phone are still off the page until confirmed.
- **Nanak Math is publishable.** Facts that are still unknown (entry fee, photography rules, etiquette, most festival months) are simply left off the page rather than shown as TODOs. They stay listed in §2 so they can be added later.
- `npm run build` refuses to run while any content file has `draft: true`, `[PLACEHOLDER` or `[TODO` (`npm run check-content`).

## 0. Untranscribed audio (Whisper skipped)

Most of the missing Mhepi Ajima content, and all ward information, is probably in these recordings. They have **not** been transcribed.

| File | Length | Likely contents |
|---|---|---|
- **Mhepi: written transcript received (13 Nov 2026).** `Mhepi Ajima/mhepi_ajima.docx` is the chief priest's interview, typed in the legacy **Preeti** font (Latin letters that only look Nepali in that font). Claude converted it to Unicode with a Preeti→Unicode mapping and saved the result next to it as `mhepi_ajima.unicode.txt` (raw-data, not committed). The page cites it by paragraph number in that file.
  - [ ] A Nepali reader should check the converted text against the docx opened in the Preeti font, especially conjuncts (e.g. "बुङ्मती" in the transcript; the site writes बुङ्गमती) and one unclear phrase in the last paragraph ("सो फ्रस्टको पाउन सक्छन्", not used).
  - The audio files below were not used; the transcript may be a summary of them.

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

- [x] **History, legends, festivals, tradition, architecture, present day**: from the chief priest's interview (13 Nov 2026). Every claim is attributed to him ("according to the priest") and cited by paragraph.
- [x] **The chief priest agreed to be named** (confirmed by the ward team, 13 Nov 2026). His credit is one setting: `content/credits.json` → `people` → `mhepi-priest` ("the temple's chief priest, Bhushan Ratna Bajracharya"). The History section and the Sources entry use it through `{person:mhepi-priest}`. If he prefers not to be named, change the text there to "the temple's chief priest" / "मन्दिरका मूल पुरोहित"; nothing else needs to change.
- [x] **Main deity**: the chief priest's interview confirms **Yogambar Jnaneshwari** as the main deity (popularly called Mhepi Ajima), matching the temple's inscriptions. Resolved by the interview, 13 Nov 2026.
- [x] **Founding year**: not recorded. Quick facts say so and give what is known (tradition traces it to the Swayambhu Purana; most images placed before VS 2030).
- [ ] **Jatra length (conflict in the interview)**: the priest says a five-day mela runs "from Chaitra Shukla Chaturdashi … until Baishakh trayodashi", which is more than five days. Until confirmed, the page and the chatbot (EN + NE) say only "the yearly jatra", starting on Chaitra Shukla Chaturdashi, with no duration or end date (Phase 9 review).
- [x] **Committee founding year**: the transcript says "सन् २०५४ साल"; 2054 can only be VS. Shown as "VS 2054 (1997/98 AD)" / "वि.सं. २०५४ (सन् १९९७/९८)" (Phase 9 review).
- [ ] **"About three years ago"** (Narayan temple below the hill): the page writes "about three years ago (as of 2026)". An exact year would be better.
- [ ] **Shantashri / Shantikar Acharya**: the priest calls the monk Shantashri, then speaks of "Shantikar Acharya's son". The page treats them as the same person and avoids the second name. Confirm.
- [ ] **Charhe**: is the main puja on *every* Krishna Paksha Chaturdashi, or on one in particular? The page does not say "every month".
- [ ] **Opening hours**: still unknown. The page shows only the daily puja (4:00–5:30 am, from the interview). The committee notice board says 8–11 am, which may be office or booking hours.
- [ ] **Entry fee**
- [ ] **Photography rules**, dress and footwear etiquette
- [ ] **Directions / nearest landmark**: the page says "on a small wooded hill in Naya Bazar" (from the interview); step-by-step directions are still missing
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
- **Guru's review (17 Nov 2026):** Luniva Malakar revised the Nepali Nanak Math page and its chatbot answers "as per feedback of guru" (commit `1afc237`); the English was mirrored on 17 Nov 2026 (branch `feat/en-sync-heritage-photos`). As a result:
  - The name is now "महायोगी श्री ब्रह्महरिदास महाराजको जीवित भू-समाधि स्थल (नानक मठ)" / "Living Bhu-Samadhi Site of Mahayogi Shri Brahmaharidas Maharaj (Nanak Math)" everywhere, including the menu, cards, map and chatbot.
  - The section on the name, the Guru Nanak association and the three ages (Spotlight, Nepali Times, Wikipedia) was removed. The chatbot now says Guru Nanak's visit is a legend without an authentic basis, and gives the age as "about 5,000 years; more than 500 by the samadhi".
  - The **Sources** section was removed from every heritage page (decision, 17 Nov 2026). The `<!-- source: -->` comments in the content files stay and are still checked by the build.
- [ ] **Attribution restored (17 Nov 2026, branch fix/credits-attribution).** After the guru's revision, five claims read as plain fact; each now names its source again, in EN and NE. Luniva: please check the four Nepali additions:
  - Quick facts "Established": "According to the math, …" / "मठका अनुसार, …"
  - The line of mahants: "According to the math, the guru–disciple tradition …" / "मठका अनुसार, यस परम्परा …"
  - Vishnu paduka photo text: "said to be 1,000 years old" / "१००० वर्ष पुरानो मानिने"
  - Akhanda dhuni photo text: "said to have been kept burning for 700 years" / "७०० वर्षदेखि चलिआएको भनिएको"
  - Chatbot "How old is it?": "According to the math, it is believed …" / "मठका अनुसार, …"
  - Not restored, because the guru's revision removed them: the 1,000-year guru gaddi age, the three ages side by side, and the web sources for Guru Nanak's visit around 1516. The chatbot's Guru Nanak answer is still attributed ("According to a legend … no authentic basis").
- [ ] **Brahmaharidas's dates disagree**: the new paragraph says he came and became mahant in **VS 1450**; the new mahant list gives **VS 1482**–1664.
- [ ] **Who is the present mahant?** The new paragraph says Gurudev Buddhidas told the history to "आज यस मठका महन्त श्री नेममुनिदासजी महाराज" ("today the mahant"); the list says Nem Muni served VS 2045–2080 and Naval Kishor Das from Asoj VS 2080 to the present.
- [x] **Festival descriptions**: Krishna Ashtami, Mahashivaratri and Vasantik Navaratri had "………" in Nepali. On instruction (17 Nov 2026) they now show the festival name only, in both languages. The build now fails on dot placeholders like these (`scripts/dot-placeholders.ts`); a scan of all content and interface text found no others. The quick facts now have no festivals (`festivals: []`). Months are still missing for most festivals.
- [ ] **"उदासीन" / "Udasin"**: dropped from the tradition field but still in the summary, the signboard name and How to Visit. Confirm which is right.
- [ ] **Typos in the Nepali to check (not changed):** "बुद्धिदास महाराजको तिथ" (तिथि); "वि.सं. २०८० असाेज" typed as ा+े (असोज); "वासन्तीक नवरात्र" (वासन्तिक); "विष्णु पञ्चायन" in 4 places (पञ्चायतन elsewhere); "संवर्धन  एवं" double space; "नेपाली चोकन मन्दिर" (चोक?).
- [ ] **Photos beside "यहाँ भएका सम्पदाहरू" / "The Heritage Here"** (`content/section-photos.json`): matched by Claude using the guru's new photo descriptions. Confirm, especially item 11 (ancient Nepali chok temple and mahant gaddi → `main-courtyard`, the courtyard of the two-storey buildings) and item 2 (`gilded-shrine`, described as the Vishnu Panchayatan temple). No photo yet for items 1, 10 and 12–16.
  - [x] **Item 11 description**: turned on (17 Nov 2026) on confirmation that the courtyard photo matches "the ancient Nepali chok temple and the mahant gaddi". All nine items now show their photo's description.
  - [x] **Items 10, 12, 13, 16 replaced (17 Nov 2026, from the team's pictures):** 10 Shivalinga in a stone niche (new: `shivalinga-niche.webp`), 12 paddy field, 13 courtyard view, 16 bhandara (re-added; since removed from item 16, still in the gallery); 15 (yajnashala) and 16 (satsang hall) now read "under construction" / "निर्माणाधीन" and show the team's construction photos (new: `yajnashala-construction.webp`, `satsang-hall-construction.webp`; Nepali alt text by Claude, please check) (ward team; Nepali by Claude, please check); 14 (Brahma Kunda) has no photo and now reads "in need of repair" / "मर्मत आवश्यक", from the ward team (source key `ward-team`). Nepali wording by Claude; please check. Nepali alt text of `shivalinga-niche.webp` is by Claude; please check.
  - [x] **Items 1, 10, 12–16** (superseded for 10, 12, 13, 16 by the line above) (17 Nov 2026, chosen by the team from the gallery's 4-column grid): 1 samadhi temple, 10 statue of Mahant Buddhidas, 12 Hanuman shrine under the peepal tree, 13 Nandi & Shivalinga, 14 heritage signboard, 15 painting of Brahmaharidas, 16 painting of Gothalramdas, all **without** captions. Now every item has a photo. Three photos appear twice in the list (samadhi temple: 1 and 9; Hanuman shrine: 4 and 12; Nandi & Shivalinga: 3 and 13); swap them for photos of the actual places when the team has them.
- [ ] **Alternative name "Siddheshwar Mahadev" — needs a source.** Given by the ward team (13 Nov 2026) but not confirmed. It was removed from the chatbot topic label in the Phase 9 review and is **not shown anywhere** on the site.
  - A search of raw-data found **no occurrence** of Siddheshwar / सिद्धेश्वर (or its spelling variants) in the docx, the transcribed signboards and inscriptions, or any file name. The three web sources don't mention it either.
  - [ ] Give a source for the name (a document, signboard or interview) before it is used anywhere on the site.
  - [ ] Check the Nepali spelling सिद्धेश्वर महादेव (written by Claude).
  - The earlier message with "six steps" for this name never arrived.
- [ ] **"1450"**: the docx says Brahmaharidas practised at the math "from 1450" without naming the era. The content assumes VS, to match his VS 1432 birth.
- [ ] **Name and spelling**: Nanak Math / Nanak Mantha / Prachin Udasin (Udashin) Nanak Math; नानक मठ / नानकमठ. Confirm the preferred English and Nepali forms.
- [x] **Photographed features identified** by the guru's review (alt text, 17 Nov 2026): the statue under the canopy is Brahmaleen Mahant Shri Buddhidas Ji Maharaj; the orange image under the tree is Sankatmochan Siddha Hanuman; the three garlanded platforms are the samadhi of the maharajs; the shrine room is where the sadhus keep and worship the Vedic texts; the gilded shrine is the Vishnu Panchayatan temple.
  - [x] The construction photos: the team identified one as the yajnashala and one as the satsang hall, both under construction (17 Nov 2026).
- [ ] **Who wrote the docx?** It speaks of "my gurudev" and appears to be by the current mahant. This is needed for attribution.
- [ ] **Review of the English translation** of the docx (by Claude)

## 3. Both sites

- **Coordinates** (given by the ward team on 12 Nov 2026, checked against OpenStreetMap):
  - [x] **Mhepi Ajima**: 27.727614400718654, 85.30859929776761 (given by the ward team, 13 Nov 2026; replaces 27.7172, 85.3082). The point is where OpenStreetMap labels "Mhepi" on the base map. Not marked approximate. Shown on the map in dev only while the site is a draft.
    - [ ] When Mhepi leaves draft, retake the map preview picture (`map/preview` in `scripts/image-manifest.json`, see DEPLOY.md) so its marker appears in it.
  - [x] **Nanak Math**: 27.7257, 85.3064 (from gurdwara-sahib.pages.dev). OSM reverse-geocodes it to an amenity named **"Gurunayak Math"**, Naya Bazar, Kathmandu-16 ✓. It is marked approximate (`coordinatesApproximate: true`). The first point offered, 27.73678, 85.28086, landed on a Shiva temple in Nagarjun Municipality and was rejected.
  - [ ] Confirm the exact point on a site visit, then remove `coordinatesApproximate`.
  - [x] **Ward office**: about 27.7290, 85.3016 (Balaju, Kathmandu-16 on OSM). It is marked approximate in `content/ward.json` and on the map. An exact point would allow a small embedded map in the home Contact section.
- **Ward boundary on the map:** moved to [docs/ROADMAP.md](docs/ROADMAP.md) (Later). The boundary data is still not in the raw data.
- [x] **Photo credit line**: "Photos: Samyojan, 2026" / "तस्बिर: संयोजन, २०२६" (`content/credits.json`). It is shown on the detail pages, the gallery page and inside the lightbox.
- [x] **Bhandara photo — re-added 17 Nov 2026.** The team confirmed that the people shown agree and that the photographer gave permission and wants no credit line. It is back in the Nanak Math gallery and beside list item 16. Earlier note: the `IMG-*-WA*.jpg` files are WhatsApp forwards, several watermarked "SHOT ON UMIDIGI G9A", so someone outside the team took them. `bhandara.webp` (from `IMG-20261104-WA0022.jpg`) was **removed from the site** in Phase 6; the original stays in raw-data. **Re-add only with the photographer's permission and a "Photo courtesy of …" credit.** No other WhatsApp photo is published.
- [x] **Consent decisions for people in photos**: all nine photos in `docs/photos-with-people.md` were set to `"approved"` in `content/photo-consent.json` on 12 Nov 2026 ("use photos with people"). Changing one to `"removed"` still hides it everywhere. The strict build fails if any photo is ever `"pending"` again.
  - Not used: the Mhepi team group photo (`Mhepi Ajima/Photo/20261104_085758.heic`), a team selfie (`Guru Nanak Mantha/Photo/20261104_100241.heic`), and portraits of an elderly sadhu (`IMG_20261104_095808.jpg`, `IMG_20261104_095816.jpg`, `IMG_20261104_095816_1.jpg`).
- [ ] **Permission** from the math's mahant and the Mhepi committee to publish photos of the inner shrines
- **Video:** moved to [docs/ROADMAP.md](docs/ROADMAP.md) ("YouTube videos", Soon after launch).

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
- [x] **About text**: a paragraph given by the ward team on 13 Nov 2026 replaces the About intro (EN; the NE is a translation). It is not from raw-data. The site names in it come from the visible-site list, so a draft site is never named.
- [ ] **More ward facts** for the About section: area, population, tole names, etc. The home page About section currently has only the municipality, ward number, office location and the list of sites. A dev-only `[PLACEHOLDER]` box (`home.aboutPlaceholder` in `src/i18n/*.json`) marks the gap. Production builds never render it, and `verify-output` would fail if they did.
- [x] **Ward chairperson**: Rojina Shrestha (in `ward.json`; not yet shown on the site)
  - [ ] Check the Nepali spelling रोजिना श्रेष्ठ (written by Claude)
- [ ] **Official portal URL**: the ward team named "Kathmandu Metropolitan City Ward No. 16" as the official portal but gave no web address
- [x] **Web3Forms recipient email**: no longer needed. The contact form and Web3Forms were removed on 17 Nov 2026; the contact page links to ward16@kathmandu.gov.np.

## 5. Nepali text needing native-speaker review

These files contain Nepali written by Claude, not taken from a source. A native speaker should review them.

- `content/heritage/mhepi-ajima.ne.md`: rewritten on 13 Nov 2026 by Claude from the priest's Nepali transcript (condensed, mostly his own words). Everything apart from the quoted inscriptions and the bhajan needs review. The new Mhepi chatbot answers in `content/faq.json` (`mhepi-*`, including the new `mhepi-name` and `mhepi-machhindranath`) too.
- `content/credits.json` → `people.mhepi-priest.credit.ne` ("म्हेपी अजिमाका मूल पुरोहित भुषण रत्न बज्राचार्य") and `src/i18n/ne.json` → `heritage.informationFrom` ("जानकारी: …"): the Mhepi Ajima "Information from" line, by Claude, 17 Nov 2026.
- `content/ward.json` → `illustration.alt.ne` (ward illustration, `wardlogo1.png`) and `overviewImage.alt.ne` (Nani's namaste beside Overview): alt text written by Claude, 17 Nov 2026.
- `content/heritage/nanak-math.ne.md`: mostly the docx's own sentences, shortened. The summary, How to Visit, list intros and table labels are by Claude.
  - **Revised on 17 Nov 2026** by Luniva Malakar from the guru's feedback (native speaker). The English page (`nanak-math.en.md`) and the English chatbot answers now mirror her Nepali; Claude's English translation of the new text needs a review.
- The `alt` text in all `gallery` entries of the `.ne.md` files
- `src/i18n/ne.json` → `contactPage` (17 Nov 2026, contact page without a form): the welcoming intro, "हामीलाई लेख्नुहोस्", its text, "वडा कार्यालयलाई इमेल गर्नुहोस्" and "वडा कार्यालयलाई सम्पर्क गर्नुहोस्", by Claude; please check.
- `src/i18n/ne.json`: all Nepali UI strings (nav, footer, language toggle, skip link) were written by Claude
- `src/i18n/ne.json` → `chat.didntFindAnswer`: the chatbot's "मेरो प्रश्न यहाँ छैन" reply (wording given by the ward team on 13 Nov 2026), plus `chat.backToTopics` and the other chat labels. Phone numbers in Nepali chat replies are shown in Devanagari digits (०१-४९८१६५३).
- `src/i18n/ne.json` → Nani: `chat.bubble`, `chat.greeting` and `chat.dialogLabel`/`naniAlt` (wording given by the ward team, 13 Nov 2026); `credits.naniCharacter` ("नानी पात्र: …", by Claude); `content/credits.json` → `nani.creator.ne` ("जेमिनी (एआई-निर्मित चित्र)", by Claude).
- `src/i18n/ne.json` → `home.aboutIntro`: the Nepali About text is **Claude's translation** of the English paragraph given by the ward team on 13 Nov 2026.
- `content/faq.json`: all Nepali questions (`q_ne`) and answers (`a_ne`) were written by Claude from the page content. Also check that the Nepali question variants match how people would actually ask.
  - **New in the Phase 9 chatbot restructure (13 Nov 2026):** topic labels "{site} घुम्न जाँदा", "{site}को बारेमा", "वडा कार्यालयमा सम्पर्क", "यो वेबसाइटको बारेमा" (wording given by the ward team); all the short questions (e.g. "नानक मठ कहाँ छ?", "त्यहाँ कसरी पुग्ने?", "कति बजे खुल्छ?", "प्रवेश शुल्क लाग्छ?", "फोटो खिच्न मिल्छ?", "जानुअघि के थाहा पाउनुपर्छ?", "यो कति पुरानो हो?", "गुरु नानकसँग यसको के सम्बन्ध छ?", "यहाँ कुन कुन चाड मनाइन्छ?", "त्यहाँ के के हेर्न सकिन्छ?"); the new answers `nanak-what`, `nanak-see`, `nanak-tips` and all `mhepi-*` visit/about answers; the "no information yet" reply "यो जानकारी हामीसँग अहिलेसम्म छैन…".
  - `src/i18n/ne.json` → `chat.greeting` (new ending "तलको प्रश्न थिच्नुहोस् वा विषय छान्नुहोस्।"), `chat.quickQuestions`, `chat.viewOnMap`, `chat.openOsm`, `chat.approximateNote`, `chat.newTab`; `map.showMap`, `map.showMapNote`, `map.previewAlt` — all by Claude.

## 6. Chatbot

- [x] **Nani's creator**: made with Google Gemini (ward team, 13 Nov 2026). The About credit reads "Nani character by Gemini (AI-generated image)" / "नानी पात्र: जेमिनी (एआई-निर्मित चित्र)" (`content/credits.json`).
  - [ ] Confirm that wording, or whether to say just "Gemini".
- [ ] **Nani animation**: `Nani.jpeg` is a single still JPEG (848×1264, one frame), so no animated WebP or MP4/WebM loop could be made from it. The floating button uses the still picture with a gentle CSS bob-and-tilt instead, which is static under reduced motion. If an animated original exists, add it to raw-data and convert it (target < 300 KB, plus a still frame).
- [ ] Nani is an AI-generated illustration of a child. Confirm the ward is happy to publish it on a public government website, and that Gemini's terms allow this use.
- **Size (13 Nov 2026):** Nani is a 56 px round face, bottom-left on every page. Hovering over her with a mouse shows the large half-body cut-out (background removed by `npm run optimize-images`; 260 px tall from 768 px, 130 px below) with her speech bubble. Touch screens always show the round face. (Earlier the big figure stood on the page permanently, but it covered the hero buttons, the table of contents, gallery photos, the contact form and the map.)

- [ ] **Answers without data**: the entry-fee and photography answers say there is no confirmed information and point to the ward office. Update them in `content/faq.json` once the facts are known.
- [ ] **More questions**: add entries for questions people actually ask. The answers must come from the content; the build checks that every "Read more" anchor exists in both languages.

## 7. Heritage map and walking route (added with the map enhancement)

- [ ] **Confirm the stop order** in `content/routes.json` (`mhepi-ajima` → `nanak-math`). It was set by the developer, not taken from the ward; swap it if the walk should run the other way.
- [x] **Walking paths and distances.** Fetched on 13 Nov 2026 with `npm run fetch-route` (OpenStreetMap data, OSRM foot routing): Mhepi Ajima → Nanak Math is **366 m, about 5 minutes** on foot, along 15 path points. The earlier "≈ 960 m" was the straight line from Mhepi's old coordinates. Re-run the script whenever stops or coordinates change, and still **verify the route on foot** (below).
- [ ] **Better coordinates.** Nanak Math and the ward office are marked approximate; the Mhepi Ajima point (27.727614400718654, 85.30859929776761) was given by the ward team on 13 Nov 2026 and is not marked approximate. Walking paths end at these points, so they are only as good as the coordinates.
- [ ] **Verify the walking route on foot.** Walk Mhepi Ajima → Nanak Math (and on to the ward office if it is added) with the map open on a phone. Check that the stops are in a sensible order, the path shown is walkable (once real paths are fetched), and the distances and times are about right. Note anything unsafe or confusing (busy crossings, steps, closed lanes).
- [x] **Route needs two published sites.** Mhepi Ajima was published on 13 Nov 2026, so the route now appears with both stops (checked in the strict build).
- **Map categories:** moved to [docs/ROADMAP.md](docs/ROADMAP.md) ("More ward heritage sites", Later).
- [ ] **Nepali interface strings** added under `map` in `src/i18n/ne.json` (search, filters, legend, route, detail panel) were written by the developer and need a native-speaker review.
- **Audio stories:** moved to [docs/ROADMAP.md](docs/ROADMAP.md) ("Phase 9B: Spatial Memory Archive", Before launch).
