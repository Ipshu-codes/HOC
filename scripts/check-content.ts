/**
 * Refuses to let unfinished content reach production.
 *
 *   npm run check-content
 *
 * Fails (exit code 1) if any file in content/ contains "[PLACEHOLDER" or
 * "[TODO", or a heritage file has `draft: true` in its frontmatter.
 * It runs automatically before `npm run build` (the "prebuild" script), so a
 * production build stops here while dummy text exists. `npm run dev` is not
 * affected: drafts show a red "Draft content" banner there instead.
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = "content";
const MARKERS = ["[PLACEHOLDER", "[TODO"];

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

function checkFile(file: string): Problem[] {
  const text = fs.readFileSync(file, "utf8");
  const problems: Problem[] = [];

  text.split(/\r?\n/).forEach((line, i) => {
    for (const marker of MARKERS) {
      if (line.includes(marker)) {
        problems.push({ file, line: i + 1, message: `contains ${marker}…]: ${line.trim().slice(0, 100)}` });
      }
    }
  });

  if (file.endsWith(".md") && matter(text).data.draft === true) {
    problems.push({ file, message: "has draft: true" });
  }
  return problems;
}

const problems = listFiles(CONTENT_DIR)
  .filter((file) => /\.(md|json)$/.test(file))
  .flatMap(checkFile);

if (problems.length > 0) {
  const files = new Set(problems.map((p) => p.file));
  console.error(`\n✖ check-content: ${problems.length} problem(s) in ${files.size} file(s) — not ready to publish.\n`);
  for (const p of problems) {
    console.error(`  ${p.file}${p.line ? `:${p.line}` : ""}  ${p.message}`);
  }
  console.error("\nReplace the placeholder/TODO text and remove `draft: true` before building for production.\n");
  process.exit(1);
}

console.log("✔ check-content: no placeholders, TODOs or drafts in content/.");
