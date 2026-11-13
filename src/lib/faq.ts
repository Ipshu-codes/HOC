import "server-only";

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import { getCredits, getHeritageList, getWard } from "@/lib/content";
import { getDictionary, siteNameList } from "@/lib/i18n";
import { faqSchema, type ChatData } from "@/types/faq";
import { LOCALES, type Locale } from "@/types/locale";

const FAQ_FILE = path.join(process.cwd(), "content", "faq.json");

type HeritagesByLang = Record<Locale, ReturnType<typeof getHeritageList>>;

/**
 * The chatbot's topics and entries for one language on this build:
 * - topics and entries of draft sites are dropped (in production), and so are
 *   topics left with no questions;
 * - placeholders are filled in;
 * - every link to a section of a heritage page is checked against that page's
 *   headings in both languages (a broken anchor fails the build).
 */
export function getChatData(lang: Locale): ChatData {
  const parsed = faqSchema.safeParse(JSON.parse(fs.readFileSync(FAQ_FILE, "utf8")));
  if (!parsed.success) throw new Error(`Invalid ${FAQ_FILE}:\n${z.prettifyError(parsed.error)}`);
  const faq = parsed.data;

  const ward = getWard();
  const credits = getCredits();
  const heritagesByLang = Object.fromEntries(LOCALES.map((l) => [l, getHeritageList(l)])) as HeritagesByLang;
  const visibleSlugs = new Set<string>(heritagesByLang.en.map((h) => h.slug));
  const visible = (site: string | null) => site === null || visibleSlugs.has(site);

  const fill = (text: string) =>
    text
      .replaceAll("{sites}", siteNameList(heritagesByLang[lang], lang, getDictionary(lang)))
      .replaceAll("{address}", ward.office.address[lang])
      .replaceAll("{phone}", ward.office.phone)
      .replaceAll("{email}", ward.office.email)
      .replaceAll("{team}", credits.photos.team?.[lang] ?? "");

  const entries = faq.entries
    .filter((entry) => visible(entry.site))
    .map((entry) => {
      if (entry.link) checkLink(entry.id, entry.link, visibleSlugs, heritagesByLang);
      return {
        id: entry.id,
        topic: entry.topic,
        site: entry.site,
        question: lang === "ne" ? entry.q_ne : entry.q_en,
        answer: fill(lang === "ne" ? entry.a_ne : entry.a_en),
        link: entry.link ? `/${lang}${entry.link}` : null,
      };
    });

  const topics = faq.topics
    .filter((topic) => visible(topic.site) && entries.some((entry) => entry.topic === topic.id))
    .map((topic) => ({ id: topic.id, label: topic.label[lang] }));

  return { topics, entries };
}

/** /heritage/<slug>/#<id> must point at a visible site and an id that exists in both languages. */
function checkLink(id: string, link: string, visibleSlugs: Set<string>, heritagesByLang: HeritagesByLang) {
  const match = link.match(/^\/heritage\/([a-z0-9-]+)\/(?:#([a-z0-9-]+))?$/);
  if (!match) return;
  const [, slug, anchor] = match;
  if (!visibleSlugs.has(slug)) throw new Error(`faq.json "${id}": links to ${slug}, which is not on this build`);
  if (!anchor) return;
  for (const l of LOCALES) {
    const heritage = heritagesByLang[l].find((h) => h.slug === slug);
    const ids = new Set([...(heritage?.toc.map((t) => t.id) ?? []), "photos", "sources"]);
    if (!ids.has(anchor)) throw new Error(`faq.json "${id}": #${anchor} does not exist on the ${l} ${slug} page`);
  }
}
