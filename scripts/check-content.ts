/**
 * Refuses to let unfinished content reach production.
 *
 *   npm run check-content                  strict: used by `npm run build`
 *   npm run check-content -- --allow-drafts  used by `npm run build:preview`
 *
 * Strict mode fails (exit code 1) if any file in content/ contains
 * "[PLACEHOLDER" or "[TODO", or a heritage file has `draft: true`.
 * With --allow-drafts, files with `draft: true` are skipped (the preview build
 * leaves those sites out entirely), but every other file must still be clean.
 *
 * Both modes also check that every h2/h3 heading has a stable id
 * ("## इतिहास {#history}") and that the English and Nepali versions of a site
 * use the same ids, so anchor links work in both languages.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = "content";
const HERITAGE_DIR = path.join(CONTENT_DIR, "heritage");
const MARKERS = ["[PLACEHOLDER", "[TODO"];
const allowDrafts = process.argv.includes("--allow-drafts");

interface Problem {
  file: string;
  line?: number;
  message: string;
}

function listFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? listFiles(full) : [full];
  });
}

function isDraft(file: string): boolean {
  return file.endsWith(".md") && matter(fs.readFileSync(file, "utf8")).data.draft === true;
}

function checkMarkers(file: string): Problem[] {
  const problems: Problem[] = [];
  fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      for (const marker of MARKERS) {
        if (line.includes(marker)) {
          problems.push({ file, line: i + 1, message: `contains ${marker}…]: ${line.trim().slice(0, 100)}` });
        }
      }
    });
  if (isDraft(file)) problems.push({ file, message: "has draft: true" });
  return problems;
}

/** Ids of h2/h3 headings, in order; reports headings without an id. */
function headingIds(file: string, problems: Problem[]): string[] {
  const ids: string[] = [];
  fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (!/^#{2,3} /.test(line)) return;
      const match = line.match(/\{#([a-z0-9-]+)\}\s*$/);
      if (match) ids.push(match[1]);
      else problems.push({ file, line: i + 1, message: `heading has no stable id like {#history}: ${line.trim()}` });
    });
  return ids;
}

function checkHeadingIds(): Problem[] {
  const problems: Problem[] = [];
  const slugs = new Set(fs.readdirSync(HERITAGE_DIR).map((name) => name.split(".")[0]));
  for (const slug of slugs) {
    const en = path.join(HERITAGE_DIR, `${slug}.en.md`);
    const ne = path.join(HERITAGE_DIR, `${slug}.ne.md`);
    const enIds = headingIds(en, problems);
    const neIds = headingIds(ne, problems);
    if (enIds.join() !== neIds.join()) {
      problems.push({ file: ne, message: `heading ids differ from ${en}:\n    en: ${enIds.join(", ")}\n    ne: ${neIds.join(", ")}` });
    }
  }
  return problems;
}

/**
 * content/photo-consent.json: every listed photo must be a gallery photo (or a typo would hide
 * nothing), and in the strict build every decision must be made: "approved" or "removed".
 * "pending" is allowed only in build:preview (--allow-drafts).
 */
function checkPhotoConsent(): Problem[] {
  const file = path.join(CONTENT_DIR, "photo-consent.json");
  const consent = JSON.parse(fs.readFileSync(file, "utf8")) as { photos: Record<string, { status: string }> };
  const gallerySrcs = new Set(
    fs
      .readdirSync(HERITAGE_DIR)
      .flatMap((name) => matter(fs.readFileSync(path.join(HERITAGE_DIR, name), "utf8")).data.gallery ?? [])
      .map((image: { src: string }) => image.src),
  );
  const problems: Problem[] = Object.keys(consent.photos)
    .filter((src) => !gallerySrcs.has(src))
    .map((src) => ({ file, message: `lists ${src}, which is not in any gallery` }));
  if (!allowDrafts) {
    for (const [src, { status }] of Object.entries(consent.photos)) {
      if (status === "pending") {
        problems.push({ file, message: `${src} is still "pending" — set "approved" or "removed" (docs/photos-with-people.md)` });
      }
    }
  }
  return problems;
}

const files = listFiles(CONTENT_DIR).filter((file) => /\.(md|json)$/.test(file));
const skipped = allowDrafts ? files.filter(isDraft) : [];
const problems = [
  ...files.filter((file) => !skipped.includes(file)).flatMap(checkMarkers),
  ...checkHeadingIds(),
  ...checkPhotoConsent(),
];

for (const file of skipped) console.log(`  skipped draft: ${file} (left out of this build)`);

if (problems.length > 0) {
  const count = new Set(problems.map((p) => p.file)).size;
  console.error(`\n✖ check-content: ${problems.length} problem(s) in ${count} file(s) — not ready to publish.\n`);
  for (const p of problems) {
    console.error(`  ${p.file}${p.line ? `:${p.line}` : ""}  ${p.message}`);
  }
  console.error(
    allowDrafts
      ? "\nFix the problems above (draft files are already skipped).\n"
      : "\nReplace the placeholder/TODO text and remove `draft: true` before building for production,\nor use `npm run build:preview` to build without the draft sites.\n",
  );
  process.exit(1);
}

console.log(`✔ check-content${allowDrafts ? " (drafts skipped)" : ""}: content is ready to publish.`);
