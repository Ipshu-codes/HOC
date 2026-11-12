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
  type SourceCitation,
  type Locale,
  type TocEntry,
} from "@/types/heritage";
import { homeSchema, type HomeConfig } from "@/types/home";
import {
  creditsSchema,
  photoConsentSchema,
  sourcesSchema,
  type Credits,
  type PhotoConsent,
  type SourceRegistry,
} from "@/types/site";
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

/** HTML → plain text: drop tags, decode the entities the markdown renderer emits (e.g. "&#x26;" for "&"). */
function htmlToText(html: string): string {
  const named: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number(dec)))
    .replace(/&(amp|lt|gt|quot|apos);/g, (_, name: string) => named[name]);
}

/** Reads h2/h3 headings with their ids for the table of contents. */
function extractToc(html: string): TocEntry[] {
  const toc: TocEntry[] = [];
  for (const match of html.matchAll(/<h([23]) id="([^"]+)">(.*?)<\/h\1>/g)) {
    toc.push({
      depth: Number(match[1]) as 2 | 3,
      id: match[2],
      text: htmlToText(match[3]),
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

  // Photos marked "removed" in content/photo-consent.json disappear from every page.
  const consent = getPhotoConsent().photos;
  const gallery = parsed.data.gallery.filter((image) => consent[image.src]?.status !== "removed");
  if (consent[parsed.data.cover]?.status === "removed") {
    throw new Error(`${file}: the cover photo ${parsed.data.cover} is marked "removed" — choose another cover`);
  }

  const html = String(markdownToHtml.processSync(content));
  return {
    ...parsed.data,
    gallery,
    lang,
    html,
    toc: extractToc(html),
    sources: extractSources(content, lang, file),
  };
}

/**
 * Sources cited in the markdown, in order of first appearance, with their
 * plain-language names. Content cites them in HTML comments:
 *   <!-- source: nanak-account, nanak-signboards | DOCX para 3; signboard 2026…heic -->
 * Everything after "|" is detail for reviewers and is never shown on the page.
 */
function extractSources(markdown: string, lang: Locale, file: string): SourceCitation[] {
  const registry = getSourceRegistry();
  const keys = new Set<string>();
  for (const match of markdown.matchAll(/<!--\s*source:\s*([^|]+?)\s*(?:\||-->)/g)) {
    for (const key of match[1].split(",").map((k) => k.trim())) keys.add(key);
  }
  return [...keys].map((key) => {
    const names = registry[key];
    if (!names) throw new Error(`${file}: unknown source "${key}" — add it to content/sources.json`);
    return { key, label: names[lang] };
  });
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

/** Reads a JSON file from content/ and validates it against a zod schema. */
function readJson<T>(name: string, schema: z.ZodType<T>): T {
  const file = path.join(process.cwd(), "content", name);
  const parsed = schema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
  if (!parsed.success) {
    throw new Error(`Invalid ${file}:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export function getWard(): Ward {
  return readJson("ward.json", wardSchema);
}

export function getHomeConfig(): HomeConfig {
  return readJson("home.json", homeSchema);
}

export function getSourceRegistry(): SourceRegistry {
  return readJson("sources.json", sourcesSchema);
}

export function getCredits(): Credits {
  return readJson("credits.json", creditsSchema);
}

export function getPhotoConsent(): PhotoConsent {
  return readJson("photo-consent.json", photoConsentSchema);
}

/** "01-4981653" → "tel:+97714981653" (Nepal country code, leading 0 dropped). */
export function phoneHref(phone: string): string {
  return `tel:+977${phone.replace(/\D/g, "").replace(/^0/, "")}`;
}
