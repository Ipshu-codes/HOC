import { z } from "zod";

import { HERITAGE_SLUGS } from "@/types/heritage";
import type { Locale } from "@/types/locale";

/**
 * content/faq.json — the chatbot's questions and answers.
 * Answers may use {sites}, {address}, {phone}, {email} and {team}; they are filled in
 * at build time from the visible sites, content/ward.json and content/credits.json.
 * `site` ties an entry to a heritage site, so a draft site's answers are left out of
 * production builds; `null` means a general entry.
 */
export const faqSchema = z.object({
  entries: z
    .array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        site: z.enum(HERITAGE_SLUGS).nullable(),
        /** Offered as a suggested-question chip. */
        suggest: z.boolean().default(false),
        q_en: z.array(z.string().min(1)).min(1),
        q_ne: z.array(z.string().min(1)).min(1),
        a_en: z.string().min(1),
        a_ne: z.string().min(1),
        /** Path without the language prefix, e.g. "/heritage/nanak-math/#history". */
        link: z.string().startsWith("/").nullable().default(null),
      }),
    )
    .refine((entries) => new Set(entries.map((e) => e.id)).size === entries.length, "FAQ ids must be unique"),
});

/** One FAQ entry as sent to the browser: both languages, placeholders filled, links prefixed. */
export interface ChatEntry {
  id: string;
  site: string | null;
  suggest: boolean;
  q: Record<Locale, string[]>;
  a: Record<Locale, string>;
  link: Record<Locale, string> | null;
}
