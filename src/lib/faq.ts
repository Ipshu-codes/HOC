import "server-only";

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import { getCredits, getHeritageList, getWard } from "@/lib/content";
import { getDictionary, siteNameList } from "@/lib/i18n";
import { faqSchema, type ChatEntry } from "@/types/faq";
import { LOCALES, type Locale } from "@/types/locale";

const FAQ_FILE = path.join(process.cwd(), "content", "faq.json");

/**
 * The chatbot's entries for this build: entries of draft sites are dropped (in
 * production), placeholders are filled, and every link to a section of a heritage
 * page is checked against that page's headings in both languages (a broken anchor
 * fails the build).
 */
export function getChatEntries(): ChatEntry[] {
  const parsed = faqSchema.safeParse(JSON.parse(fs.readFileSync(FAQ_FILE, "utf8")));
  if (!parsed.success) throw new Error(`Invalid ${FAQ_FILE}:\n${z.prettifyError(parsed.error)}`);

  const ward = getWard();
  const credits = getCredits();
  const heritagesByLang = Object.fromEntries(LOCALES.map((lang) => [lang, getHeritageList(lang)])) as Record<
    Locale,
    ReturnType<typeof getHeritageList>
  >;
  const visibleSlugs = new Set(heritagesByLang.en.map((h) => h.slug));

  const fill = (text: string, lang: Locale) =>
    text
      .replaceAll("{sites}", siteNameList(heritagesByLang[lang], lang, getDictionary(lang)))
      .replaceAll("{address}", ward.office.address[lang])
      .replaceAll("{phone}", ward.office.phone)
      .replaceAll("{email}", ward.office.email)
      .replaceAll("{team}", credits.photos.team?.[lang] ?? "");

  return parsed.data.entries
    .filter((entry) => entry.site === null || visibleSlugs.has(entry.site))
    .map((entry) => {
      if (entry.link) checkLink(entry.id, entry.link, visibleSlugs, heritagesByLang);
      return {
        id: entry.id,
        site: entry.site,
        suggest: entry.suggest,
        q: { en: entry.q_en, ne: entry.q_ne },
        a: { en: fill(entry.a_en, "en"), ne: fill(entry.a_ne, "ne") },
        link: entry.link ? { en: `/en${entry.link}`, ne: `/ne${entry.link}` } : null,
      };
    });
}

/** /heritage/<slug>/#<id> must point at a visible site and an id that exists in both languages. */
function checkLink(
  id: string,
  link: string,
  visibleSlugs: Set<string>,
  heritagesByLang: Record<Locale, ReturnType<typeof getHeritageList>>,
) {
  const match = link.match(/^\/heritage\/([a-z0-9-]+)\/(?:#([a-z0-9-]+))?$/);
  if (!match) return;
  const [, slug, anchor] = match;
  if (!visibleSlugs.has(slug)) throw new Error(`faq.json "${id}": links to ${slug}, which is not on this build`);
  if (!anchor) return;
  for (const lang of LOCALES) {
    const heritage = heritagesByLang[lang].find((h) => h.slug === slug);
    const ids = new Set([...(heritage?.toc.map((t) => t.id) ?? []), "photos", "sources"]);
    if (!ids.has(anchor)) throw new Error(`faq.json "${id}": #${anchor} does not exist on the ${lang} ${slug} page`);
  }
}
