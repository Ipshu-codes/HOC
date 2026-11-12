/**
 * Last step of both `npm run build` (as "postbuild") and `npm run build:preview`.
 *
 * 1. Draft sites: pages, links, gallery photos, map markers and chatbot answers
 *    are already left out by src/lib/content.ts, but public/ is copied into out/
 *    as-is, so delete out/images/<draft-slug>/. Then fail if a draft site's slug
 *    or name still appears anywhere in out/.
 * 2. Placeholders: fail if "[PLACEHOLDER" or "[TODO" appears anywhere in out/
 *    (for example dev-only filler text that slipped into a production build).
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

const findings: string[] = [];
for (const file of listFiles(OUT_DIR)) {
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
  console.error(`\n✖ verify-output: draft or placeholder content found in ${OUT_DIR}/:\n`);
  for (const finding of findings) console.error(`  ${finding}`);
  console.error(
    "\nSites must come from getHeritageList() in src/lib/content.ts, and placeholder text must be dev-only.\n",
  );
  process.exit(1);
}

console.log(`✔ verify-output: no placeholders; ${drafts.length} draft site(s) fully excluded from ${OUT_DIR}/.`);
