/**
 * Last step of `npm run build:preview`.
 *
 * Pages, links, gallery photos, map markers and chatbot answers for draft sites
 * are already left out by src/lib/content.ts. Two things remain:
 *   1. public/ is copied into out/ as-is, so delete out/images/<draft-slug>/.
 *   2. Verify: scan every file in out/ and fail if a draft site's slug or name
 *      still appears anywhere, so a preview can never leak draft content.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const HERITAGE_DIR = path.join("content", "heritage");
const OUT_DIR = "out";
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
  console.error(`prune-drafts: "${OUT_DIR}/" not found — run next build first.`);
  process.exit(1);
}

const drafts = draftSites();
for (const { slug } of drafts) {
  fs.rmSync(path.join(OUT_DIR, "images", slug), { recursive: true, force: true });
  console.log(`  removed out/images/${slug}/ (draft)`);
}

const leaks: string[] = [];
for (const file of listFiles(OUT_DIR)) {
  if (!TEXT_FILE.test(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const { needles } of drafts) {
    for (const needle of needles) {
      if (text.includes(needle)) leaks.push(`${file}: contains "${needle}"`);
    }
  }
}

if (leaks.length > 0) {
  console.error(`\n✖ prune-drafts: draft content leaked into ${OUT_DIR}/:\n`);
  for (const leak of leaks) console.error(`  ${leak}`);
  console.error("\nEvery page/component must get sites from getHeritageList() in src/lib/content.ts.\n");
  process.exit(1);
}

console.log(`✔ prune-drafts: ${drafts.length} draft site(s) fully excluded from ${OUT_DIR}/.`);
