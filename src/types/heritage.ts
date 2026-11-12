import { z } from "zod";

export const LOCALES = ["en", "ne"] as const;
export type Locale = (typeof LOCALES)[number];

export const HERITAGE_SLUGS = ["mhepi-ajima", "nanak-math"] as const;
export type HeritageSlug = (typeof HERITAGE_SLUGS)[number];

/**
 * Frontmatter of content/heritage/<slug>.<lang>.md.
 * Validated at build time, so a typo in a content file fails the build with a
 * clear message instead of rendering `undefined` on the page.
 */
export const heritageFrontmatterSchema = z.object({
  name: z.string().min(1),
  nameNe: z.string().min(1),
  slug: z.enum(HERITAGE_SLUGS),
  /** Draft content may contain [PLACEHOLDER: …] text; `npm run build` refuses to run while any file is a draft. */
  draft: z.boolean().default(false),
  summary: z.string().min(1),
  location: z.string().min(1),
  /** [lat, lng]; null until confirmed (see MISSING_INFO.md). */
  coordinates: z.tuple([z.number(), z.number()]).nullable(),
  established: z.string().min(1),
  deity_or_tradition: z.string().min(1),
  festivals: z.array(
    z.object({
      name: z.string().min(1),
      month: z.string().min(1).optional(),
      description: z.string().min(1),
    }),
  ),
  visiting: z.object({
    hours: z.string().min(1),
    entry: z.string().min(1).optional(),
    tips: z.string().min(1).optional(),
  }),
  cover: z.string().startsWith("/images/"),
  gallery: z.array(
    z.object({
      src: z.string().startsWith("/images/"),
      alt: z.string().min(1),
    }),
  ),
});

export type HeritageFrontmatter = z.infer<typeof heritageFrontmatterSchema>;
export type GalleryImage = HeritageFrontmatter["gallery"][number];

export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface Heritage extends HeritageFrontmatter {
  lang: Locale;
  /** Markdown body rendered to HTML; h2/h3 carry ids for the table of contents. */
  html: string;
  toc: TocEntry[];
}
