import { z } from "zod";

import { localized } from "@/types/common";
import { HERITAGE_SLUGS } from "@/types/heritage";

/** Topics generated once per visible heritage site, e.g. "Visiting {site}" and "About {site}". */
export const SITE_TOPIC_KINDS = ["visit", "about"] as const;

/**
 * content/faq.json — the chatbot's topics, questions and answers. Visitors tap
 * a topic, then a question; there is no free typing.
 *
 * - `siteTopics`: topic labels repeated for every visible site, in this order
 *   ({site} = the site name). `topics`: fixed topics shown after them.
 * - An entry's `topic` is a site topic kind ("visit", "about", which needs `site`),
 *   a fixed topic id, or `null` = shown only as a related question.
 * - `priority` orders the questions within a topic (1 first).
 * - `site` ties an entry to a heritage site, so a draft site's answers are left
 *   out of production builds. `null` means general.
 * - `directions: true` adds "View on 3D Map" and "Open in OpenStreetMap" links built
 *   from the site's coordinates (marked approximate when the site's are).
 * - `suggestions`: entry ids shown as quick questions when the chat opens.
 * - Answers may use {sites}, {address}, {phone}, {email} and {team}; they are filled
 *   in at build time from the visible sites, content/ward.json and content/credits.json.
 */
export const faqSchema = z
  .object({
    siteTopics: z.array(z.object({ kind: z.enum(SITE_TOPIC_KINDS), label: localized })),
    topics: z.array(z.object({ id: z.string().regex(/^[a-z0-9-]+$/), label: localized })),
    suggestions: z.array(z.string()),
    entries: z.array(
      z.object({
        id: z.string().regex(/^[a-z0-9-]+$/),
        site: z.enum(HERITAGE_SLUGS).nullable(),
        topic: z.string().nullable(),
        priority: z.number().int().positive(),
        directions: z.boolean().default(false),
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
    const issue = (message: string) => ctx.addIssue({ code: "custom", message });
    const ids = faq.entries.map((e) => e.id);
    if (new Set(ids).size !== ids.length) issue("FAQ entry ids must be unique");
    const kinds = new Set<string>(SITE_TOPIC_KINDS);
    const topicIds = new Set(faq.topics.map((t) => t.id));
    const orderKeys = new Set<string>();
    for (const entry of faq.entries) {
      if (entry.topic === null) continue;
      if (kinds.has(entry.topic)) {
        if (entry.site === null) issue(`entry "${entry.id}": topic "${entry.topic}" needs a site`);
      } else if (!topicIds.has(entry.topic)) {
        issue(`entry "${entry.id}" uses unknown topic "${entry.topic}"`);
      }
      const key = `${entry.site}/${entry.topic}/${entry.priority}`;
      if (orderKeys.has(key))
        issue(`entry "${entry.id}": another question in its topic has priority ${entry.priority}`);
      orderKeys.add(key);
      if (entry.directions && entry.site === null) issue(`entry "${entry.id}": directions need a site`);
    }
    for (const id of faq.suggestions) if (!ids.includes(id)) issue(`suggestion "${id}" is not an entry id`);
  });

/** A topic as sent to the browser, in the page language. */
export interface ChatTopic {
  id: string;
  label: string;
}

export interface ChatLink {
  href: string;
  label: string;
  /** Opens another website (in a new tab). */
  external: boolean;
}

/** A question and answer as sent to the browser, in the page language. */
export interface ChatEntry {
  id: string;
  /** Id of the topic it is listed under, e.g. "nanak-math-visit"; null = related-only. */
  topic: string | null;
  site: string | null;
  question: string;
  answer: string;
  /** Small print under the answer, e.g. "The location on the map is approximate." */
  note: string | null;
  links: ChatLink[];
}

export interface ChatData {
  topics: ChatTopic[];
  /** Sorted by topic order, then priority. */
  entries: ChatEntry[];
  /** Entry ids offered as quick questions when the chat opens. */
  suggestions: string[];
}
