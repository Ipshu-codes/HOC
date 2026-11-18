/**
 * Text lock for the UI match (docs/ui-match/): the redesign may move blocks, never change words.
 *
 *   tsx scripts/text-lock.ts save    write docs/ui-match/text-baseline.json from the current out/
 *   tsx scripts/text-lock.ts check   compare out/ (and content/, src/i18n/) with that baseline
 *
 * Two locks, both must hold:
 * 1. Source: every file in content/ and src/i18n/ is byte-identical to the baseline (SHA-256), so no
 *    word of the content, the interface strings or the chatbot answers can change.
 * 2. Rendered: for every built page (EN and NE), the words a visitor or a screen reader gets (text,
 *    plus alt, aria-label, title and placeholder attributes) are compared with the baseline as a
 *    multiset. An added or changed word fails. A removed word fails unless it is listed in
 *    docs/ui-match/text-allow-removed.json with a reason (an element the layout dropped). Words that
 *    only changed place are reported as moved, which is allowed.
 *
 * `check` runs after every build (package.json "postbuild" / "build:preview") once the baseline exists.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = "out";
const BASELINE = path.join("docs", "ui-match", "text-baseline.json");
const ALLOW_REMOVED = path.join("docs", "ui-match", "text-allow-removed.json");
const SOURCE_DIRS = ["content", path.join("src", "i18n")];
const PAGE_FILES = /(^|\/)index\.html$/;

interface Baseline {
  sources: Record<string, string>;
  pages: Record<string, string[]>;
}

interface AllowRemoved {
  /** page ("en/", "ne/gallery/", …) or "*" → words that may be gone from it, with why. */
  [page: string]: { words: string[]; reason: string }[];
}

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'" };

function decode(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (whole, name: string) => {
    if (name[0] === "#") {
      const code = name[1] === "x" || name[1] === "X" ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
      return String.fromCodePoint(code);
    }
    return ENTITIES[name] ?? whole;
  });
}

/** The page's words in document order: text nodes and the alt / aria-label / title / placeholder attributes. */
export function pageWords(html: string): string[] {
  const body = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<(script|style|noscript|template)\b[\s\S]*?<\/\1>/gi, " ")
    .replace(/<head\b[\s\S]*?<\/head>/i, " ");
  const pieces: string[] = [];
  for (const match of body.matchAll(/<[^>]+>|[^<]+/g)) {
    const token = match[0];
    if (token.startsWith("<")) {
      for (const attr of token.matchAll(/\s(alt|aria-label|title|placeholder)="([^"]*)"/gi)) pieces.push(attr[2]);
    } else {
      pieces.push(token);
    }
  }
  return decode(pieces.join(" "))
    .split(/\s+/)
    .filter((word) => word !== "");
}

function sourceHashes(): Record<string, string> {
  const hashes: Record<string, string> = {};
  for (const file of SOURCE_DIRS.flatMap(walk).sort()) {
    hashes[file.split(path.sep).join("/")] = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
  }
  return hashes;
}

function renderedPages(): Record<string, string[]> {
  const pages: Record<string, string[]> = {};
  for (const file of walk(OUT_DIR)) {
    const rel = path.relative(OUT_DIR, file).split(path.sep).join("/");
    if (!PAGE_FILES.test(rel) || !/^(en|ne)\//.test(rel)) continue;
    pages[rel.replace(/index\.html$/, "")] = pageWords(fs.readFileSync(file, "utf8"));
  }
  return pages;
}

function counts(words: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const word of words) map.set(word, (map.get(word) ?? 0) + 1);
  return map;
}

function save() {
  const baseline: Baseline = { sources: sourceHashes(), pages: renderedPages() };
  fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
  fs.writeFileSync(BASELINE, JSON.stringify(baseline, null, 1) + "\n");
  const words = Object.values(baseline.pages).reduce((sum, list) => sum + list.length, 0);
  console.log(`✔ text-lock: baseline saved (${Object.keys(baseline.sources).length} source files, ${Object.keys(baseline.pages).length} pages, ${words} words) → ${BASELINE}`);
}

function check(): boolean {
  if (!fs.existsSync(BASELINE)) {
    console.log("text-lock: no baseline yet (docs/ui-match/text-baseline.json), skipped.");
    return true;
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE, "utf8")) as Baseline;
  const allow = fs.existsSync(ALLOW_REMOVED) ? (JSON.parse(fs.readFileSync(ALLOW_REMOVED, "utf8")) as AllowRemoved) : {};
  const errors: string[] = [];
  const notes: string[] = [];

  // 1. Source lock.
  const now = sourceHashes();
  for (const [file, hash] of Object.entries(baseline.sources)) {
    if (!(file in now)) errors.push(`${file}: deleted (text source)`);
    else if (now[file] !== hash) errors.push(`${file}: changed (text sources must stay word-for-word)`);
  }
  for (const file of Object.keys(now)) if (!(file in baseline.sources)) errors.push(`${file}: new text source`);

  // 2. Rendered words per page.
  const pages = renderedPages();
  for (const [page, before] of Object.entries(baseline.pages)) {
    const after = pages[page];
    if (!after) {
      errors.push(`${page}: page missing from out/`);
      continue;
    }
    const was = counts(before);
    const is = counts(after);
    const allowed = counts([...(allow[page] ?? []), ...(allow["*"] ?? [])].flatMap((entry) => entry.words));
    const added: string[] = [];
    const removed: string[] = [];
    for (const [word, n] of is) for (let i = was.get(word) ?? 0; i < n; i++) added.push(word);
    for (const [word, n] of was) for (let i = is.get(word) ?? 0; i < n; i++) removed.push(word);
    const unexplained = removed.filter((word) => {
      const left = allowed.get(word) ?? 0;
      if (left > 0) {
        allowed.set(word, left - 1);
        return false;
      }
      return true;
    });
    if (added.length) errors.push(`${page}: ${added.length} added/changed word(s): ${added.slice(0, 20).join(" | ")}`);
    if (unexplained.length) errors.push(`${page}: ${unexplained.length} removed word(s) not in ${ALLOW_REMOVED}: ${unexplained.slice(0, 20).join(" | ")}`);
    const allowedGone = removed.length - unexplained.length;
    const moved = before.join(" ") !== after.filter((w) => was.has(w)).join(" ");
    notes.push(`${page.padEnd(28)} ${after.length} words, 0 changed${allowedGone ? `, ${allowedGone} removed (allowed)` : ""}${moved ? ", order changed (blocks moved)" : ", same order"}`);
  }
  for (const page of Object.keys(pages)) if (!(page in baseline.pages)) errors.push(`${page}: new page with no baseline`);

  if (errors.length) {
    console.error("✖ text-lock: words changed\n  " + errors.join("\n  "));
    return false;
  }
  console.log("✔ text-lock: 0 words changed\n  " + notes.join("\n  "));
  return true;
}

const mode = process.argv[2];
if (mode === "save") save();
else if (mode === "check") process.exit(check() ? 0 : 1);
else {
  console.error("usage: tsx scripts/text-lock.ts save|check");
  process.exit(2);
}
