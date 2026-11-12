import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { z } from "zod";

import {
  HERITAGE_SLUGS,
  heritageFrontmatterSchema,
  type Heritage,
  type HeritageSlug,
  type Locale,
  type TocEntry,
} from "@/types/heritage";

// Content files live outside src/ (see PLAN.md §5) and are read at build time only.
const HERITAGE_DIR = path.join(process.cwd(), "content", "heritage");

const markdownToHtml = unified()
  .use(remarkParse)
  .use(remarkGfm) // tables in the Nanak Math page
  .use(remarkRehype) // HTML comments in markdown (source notes) are dropped here
  .use(rehypeSlug) // adds id="history" etc. to headings
  .use(rehypeStringify);

/** Reads h2/h3 headings with the ids rehype-slug gave them. */
function extractToc(html: string): TocEntry[] {
  const toc: TocEntry[] = [];
  for (const match of html.matchAll(/<h([23]) id="([^"]+)">(.*?)<\/h\1>/g)) {
    toc.push({
      depth: Number(match[1]) as 2 | 3,
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, ""),
    });
  }
  return toc;
}

export function getHeritage(slug: HeritageSlug, lang: Locale): Heritage {
  const file = path.join(HERITAGE_DIR, `${slug}.${lang}.md`);
  const { data, content } = matter(fs.readFileSync(file, "utf8"));

  const parsed = heritageFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`Invalid frontmatter in ${file}:\n${z.prettifyError(parsed.error)}`);
  }
  if (parsed.data.slug !== slug) {
    throw new Error(`${file}: slug "${parsed.data.slug}" does not match the filename`);
  }

  const html = String(markdownToHtml.processSync(content));
  return { ...parsed.data, lang, html, toc: extractToc(html) };
}

export function getAllHeritage(lang: Locale): Heritage[] {
  return HERITAGE_SLUGS.map((slug) => getHeritage(slug, lang));
}
