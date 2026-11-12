/**
 * Last step of both `npm run build` (as "postbuild") and `npm run build:preview`.
 *
 * 1. Draft sites: pages, links, gallery photos, map markers and chatbot answers
 *    are already left out by src/lib/content.ts, but public/ is copied into out/
 *    as-is, so delete out/images/<draft-slug>/. Then fail if a draft site's slug
 *    or name still appears anywhere in out/.
 * 2. Placeholders: fail if "[PLACEHOLDER" or "[TODO" appears anywhere in out/
 *    (for example dev-only filler text that slipped into a production build).
 * 3. Image metadata: fail if any published image still carries EXIF, XMP or text
 *    chunks (camera details, timestamps, possibly GPS).
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const HERITAGE_DIR = path.join("content", "heritage");
const OUT_DIR = "out";
const MARKERS = ["[PLACEHOLDER", "[TODO"];
const TEXT_FILE = /\.(html|txt|js|json|css|xml|webmanifest)$/;

interface DraftSite {
  slug: string;
  /** Strings that must not appear anywhere in out/. */
  needles: string[];
}

function draftSites(): DraftSite[] {
  return fs
    .readdirSync(HERITAGE_DIR)
    .filter((name) => name.endsWith(".en.md"))
    .map((name) => matter(fs.readFileSync(path.join(HERITAGE_DIR, name), "utf8")).data)
    .filter((data) => data.draft === true)
    .map((data) => ({
      slug: String(data.slug),
      needles: [String(data.slug), String(data.name), String(data.nameNe)],
    }));
}

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

if (!fs.existsSync(OUT_DIR)) {
  console.error(`verify-output: "${OUT_DIR}/" not found — run next build first.`);
  process.exit(1);
}

const drafts = draftSites();
for (const { slug } of drafts) {
  fs.rmSync(path.join(OUT_DIR, "images", slug), { recursive: true, force: true });
  console.log(`  removed out/images/${slug}/ (draft)`);
}

/**
 * Names of metadata chunks in an image file (EXIF, XMP, text, timestamps).
 * WebP is a RIFF file: "RIFF" <size> "WEBP", then chunks of <4-char id><size LE><data>.
 * PNG: 8-byte signature, then chunks of <size BE><4-char type><data><crc>.
 */
function metadataChunks(file: string): string[] {
  const buf = fs.readFileSync(file);
  const found: string[] = [];
  if (file.endsWith(".webp")) {
    for (let pos = 12; pos + 8 <= buf.length; ) {
      const id = buf.toString("latin1", pos, pos + 4);
      const size = buf.readUInt32LE(pos + 4);
      if (id === "EXIF" || id === "XMP ") found.push(id.trim());
      pos += 8 + size + (size % 2); // chunks are padded to an even size
    }
  } else if (file.endsWith(".png")) {
    for (let pos = 8; pos + 8 <= buf.length; ) {
      const size = buf.readUInt32BE(pos);
      const type = buf.toString("latin1", pos + 4, pos + 8);
      if (["eXIf", "tEXt", "iTXt", "zTXt", "tIME"].includes(type)) found.push(type);
      pos += 12 + size;
    }
  } else if (/\.(jpe?g)$/i.test(file)) {
    found.push("JPEG (publish WebP/PNG only)");
  }
  return found;
}

const findings: string[] = [];
let imagesChecked = 0;
for (const file of listFiles(OUT_DIR)) {
  if (/\.(webp|png|jpe?g)$/i.test(file)) {
    imagesChecked++;
    const chunks = metadataChunks(file);
    if (chunks.length > 0) findings.push(`${file}: image metadata present (${chunks.join(", ")})`);
    continue;
  }
  if (!TEXT_FILE.test(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const marker of MARKERS) {
    if (text.includes(marker)) findings.push(`${file}: contains "${marker}"`);
  }
  for (const { needles } of drafts) {
    for (const needle of needles) {
      if (text.includes(needle)) findings.push(`${file}: contains draft site "${needle}"`);
    }
  }
}

if (findings.length > 0) {
  console.error(`\n✖ verify-output: problems found in ${OUT_DIR}/:\n`);
  for (const finding of findings) console.error(`  ${finding}`);
  console.error(
    "\nSites must come from getHeritageList(), placeholder text must be dev-only, and images must be built by" +
      " `npm run optimize-images` (which strips metadata).\n",
  );
  process.exit(1);
}

console.log(
  `✔ verify-output: no placeholders; ${drafts.length} draft site(s) fully excluded; ${imagesChecked} images free of metadata.`,
);
