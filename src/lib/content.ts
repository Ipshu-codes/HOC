import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
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
import { wardSchema, type Ward } from "@/types/ward";
import remarkHeadingIds from "@/lib/remark-heading-ids";

// Content files live outside src/ (see PLAN.md §5) and are read at build time only.
const HERITAGE_DIR = path.join(process.cwd(), "content", "heritage");

const markdownToHtml = unified()
  .use(remarkParse)
  .use(remarkGfm) // tables in the Nanak Math page
  .use(remarkHeadingIds) // "## इतिहास {#history}" → <h2 id="history">
  .use(remarkRehype) // HTML comments in markdown (source notes) are dropped here
  .use(rehypeStringify);

/** Reads h2/h3 headings with their ids for the table of contents. */
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

/**
 * Draft sites (`draft: true`) are shown in `npm run dev`, with a red banner, and
 * left out of every production build. `npm run build` refuses to run while drafts
 * exist; `npm run build:preview` builds without them.
 */
const SHOW_DRAFTS = process.env.NODE_ENV !== "production";

/**
 * The heritage sites that exist on this build. Every page, nav link, gallery,
 * map marker and chatbot answer must come from here (or from the slugs list
 * below) so that a draft site disappears everywhere at once.
 */
export function getHeritageList(lang: Locale): Heritage[] {
  return HERITAGE_SLUGS.map((slug) => getHeritage(slug, lang)).filter(
    (heritage) => SHOW_DRAFTS || !heritage.draft,
  );
}

/** Slugs of the sites on this build, for generateStaticParams. */
export function getHeritageSlugs(): HeritageSlug[] {
  return getHeritageList("en").map((heritage) => heritage.slug);
}

const WARD_FILE = path.join(process.cwd(), "content", "ward.json");

export function getWard(): Ward {
  const parsed = wardSchema.safeParse(JSON.parse(fs.readFileSync(WARD_FILE, "utf8")));
  if (!parsed.success) {
    throw new Error(`Invalid ${WARD_FILE}:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

/** "01-4981653" → "tel:+97714981653" (Nepal country code, leading 0 dropped). */
export function phoneHref(phone: string): string {
  return `tel:+977${phone.replace(/\D/g, "").replace(/^0/, "")}`;
}
