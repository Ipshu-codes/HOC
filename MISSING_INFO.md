# MISSING_INFO.md — gaps to fill before launch

Everything here is either missing from the raw data or needs a human to check it.

In the content files, gaps are marked `[TODO: …]`. Claude's own transcriptions and translations are marked in HTML comments or in italics.

## 0. Highest priority: untranscribed audio

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
- [ ] **Architecture**: dating and style. The current text only describes what the photos show.
- [ ] **Opening hours**: the committee notice board says 8–11 am, but this may be office or booking hours
- [ ] **Entry fee**
- [ ] **Photography rules**, dress and footwear etiquette
- [ ] **Directions / nearest landmark**: the only written location is "नयाँ बजार, का.म.न.पा. वडा नं. १६"
- [ ] **Committee phone**: read as ४३५९८९० from a weathered notice board; must be checked
- [ ] **Sattal fees**: read from the notice board (Rs 1,000–5,000 + Rs 300); confirm the current rates
- [ ] **Bhajan line 2**: is it "जय गुह्येश्वरी आमा"? The letter was hard to read.
- [ ] **Official spelling of the name**: the sources use म्हेपी, म्हेंपी, म्हैपी, म्ह्यपी, म्हयपि and म्हेयपि. The site uses **म्हेपी अजिमा** (from PLAN.md). Confirm, and confirm the English spelling "Mhepi Ajima".
- [ ] **Translations of the three Nepal Bhasa (Newari) inscriptions** (NS 1120 marble, NS 1121 brass, NS 1134 brass): Claude's rendering needs a Nepal Bhasa reader
- [ ] **Day of the marble inscription**: "वि.सं. २०५७ श्रावण __ गते" is faded
- [ ] **Identify the reclining figure in the water tank** and the other smaller shrines (alt text currently only describes them)
- [ ] **Location of the tree-lined stairway** (`tree-lined-stairway.webp`): was it the approach to Mhepi Ajima?

## 2. Nanak Math

- [ ] **Entry fee**
- [ ] **Photography rules** and dress/footwear etiquette
- [ ] **Festival months**: the docx gives the festival names but not months, except Akshaya Tritiya (Baishakh, from the plaques) and Asar Shashthi. Months are left as `[TODO: month]` for Basanta Panchami, Kojagrat Purnima, Teej, Vijaya Dashami, Navaratri and the Sorha Shraddha full moon.
- [ ] **Why it is called "Nanak" Math**: the sources never explain the name. They mention only that the gurus brought the Guru Granth Sahib for study.
- [ ] **Conflicting age of the guru gaddi**: the docx says **1,000 years** old; both signboards say **5,000 years** ("बिगत ५००० बर्ष देखि"). The content uses the docx wording. Which is correct?
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

- [ ] **Coordinates** (`coordinates: null` in all four files): no photo has GPS data. Get lat/lng from a site visit or by placing a pin on OpenStreetMap. Needed for Phase 7.
- [ ] **Ward 16 boundary GeoJSON**: not in the raw data. Needed for Phase 7. It might be available from KMC or OSM.
- [ ] **Photo credits**: photographers are unknown.
  - The `IMG-*-WA*.jpg` files are WhatsApp forwards, several watermarked "SHOT ON UMIDIGI G9A", so they were taken by someone outside the team.
  - Of these, `bhandara.webp` is used on the site.
- [ ] **Consent for people in photos**:
  - Used on the site: `akhanda-dhuni.webp`, `sadhus-at-veranda.webp`, `bhandara.webp` and Mhepi's `tree-lined-stairway.webp` (visitors).
  - Not used: the Mhepi team group photo (`Mhepi Ajima/Photo/20261104_085758.heic`), a team selfie (`Guru Nanak Mantha/Photo/20261104_100241.heic`), and portraits of an elderly sadhu (`IMG_20261104_095808.jpg`, `IMG_20261104_095816.jpg`, `IMG_20261104_095816_1.jpg`).
- [ ] **Permission** from the math's mahant and the Mhepi committee to publish photos of the inner shrines
- [ ] **Video**: none is used yet. Decide whether to include a short clip; the files are 6–297 MB and would need compressing.

## 4. Ward information (for `ward.json`, header, footer, contact page)

- [ ] **Ward logo** (sketch shows a logo circle; no image file provided)
- [ ] **Ward office address**
- [ ] **Phone**
- [ ] **Email**
- [ ] **Office hours**
- [ ] **Ward facts** for the About section: area, population, tole names, etc.
- [ ] **Ward chair / officials**, if they are to appear on the site
- [ ] **Web3Forms recipient email** (Phase 9)

## 5. Nepali text needing native-speaker review

These files contain Nepali written by Claude, not taken from a source. A native speaker should review them.

- `src/content/heritage/mhepi-ajima.ne.md`: the whole file apart from quoted inscriptions and the bhajan
- `src/content/heritage/nanak-math.ne.md`: mostly the docx's own sentences, shortened. The summary, How to Visit, list intros and table labels are by Claude.
- The `alt` text in all `gallery` entries of the `.ne.md` files
