import { z } from "zod";

import { localized } from "@/types/common";
import { HERITAGE_SLUGS } from "@/types/heritage";

/**
 * content/faq.json — the chatbot's topics, questions and answers. Visitors tap
 * a topic, then a question; there is no free typing.
 *
 * - `site` ties a topic or entry to a heritage site, so a draft site's topic and
 *   answers are left out of production builds. `null` means general.
 * - `topic` is the topic id an entry is listed under; `null` = shown only as a
 *   related question under other answers.
 * - Answers may use {sites}, {address}, {phone}, {email} and {team}; they are filled
 *   in at build time from the visible sites, content/ward.json and content/credits.json.
 */
export const faqSchema = z
  .object({
    topics: z.array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        site: z.enum(HERITAGE_SLUGS).nullable(),
        label: localized,
      }),
    ),
    entries: z.array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        site: z.enum(HERITAGE_SLUGS).nullable(),
        topic: z.string().nullable(),
        q_en: z.string().min(1),
        q_ne: z.string().min(1),
        a_en: z.string().min(1),
        a_ne: z.string().min(1),
        /** Path without the language prefix, e.g. "/heritage/nanak-math/#history". */
        link: z.string().startsWith("/").nullable().default(null),
      }),
    ),
  })
  .superRefine((faq, ctx) => {
    const ids = faq.entries.map((e) => e.id);
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: "custom", message: "FAQ entry ids must be unique" });
    const topicIds = new Set(faq.topics.map((t) => t.id));
    for (const entry of faq.entries) {
      if (entry.topic !== null && !topicIds.has(entry.topic)) {
        ctx.addIssue({ code: "custom", message: `entry "${entry.id}" uses unknown topic "${entry.topic}"` });
      }
    }
  });

/** A topic as sent to the browser, in the page language. */
export interface ChatTopic {
  id: string;
  label: string;
}

/** A question and answer as sent to the browser, in the page language. */
export interface ChatEntry {
  id: string;
  topic: string | null;
  site: string | null;
  question: string;
  answer: string;
  /** e.g. "/ne/heritage/nanak-math/#history"; null when there is no page to point to. */
  link: string | null;
}

export interface ChatData {
  topics: ChatTopic[];
  entries: ChatEntry[];
}
