import "server-only";

import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

import { getCredits, getHeritageList, getWard } from "@/lib/content";
import { getDictionary, siteNameList } from "@/lib/i18n";
import { faqSchema, type ChatData, type ChatLink } from "@/types/faq";
import type { Heritage } from "@/types/heritage";
import { LOCALES, type Locale } from "@/types/locale";

const FAQ_FILE = path.join(process.cwd(), "content", "faq.json");

type HeritagesByLang = Record<Locale, ReturnType<typeof getHeritageList>>;

/**
 * The chatbot's topics and entries for one language on this build:
 * - "Visiting {site}" / "About {site}" topics for every visible site, then the
 *   fixed topics; topics left with no questions are dropped;
 * - entries of draft sites are dropped (in production), the rest sorted by
 *   topic and priority;
 * - placeholders are filled in;
 * - every link to a section of a heritage page is checked against that page's
 *   headings in both languages (a broken anchor fails the build).
 */
export function getChatData(lang: Locale): ChatData {
  const parsed = faqSchema.safeParse(JSON.parse(fs.readFileSync(FAQ_FILE, "utf8")));
  if (!parsed.success) throw new Error(`Invalid ${FAQ_FILE}:\n${z.prettifyError(parsed.error)}`);
  const faq = parsed.data;

  const dict = getDictionary(lang);
  const ward = getWard();
  const credits = getCredits();
  const heritagesByLang = Object.fromEntries(LOCALES.map((l) => [l, getHeritageList(l)])) as HeritagesByLang;
  const heritages = heritagesByLang[lang];
  const visibleSlugs = new Set<string>(heritages.map((h) => h.slug));
  const visible = (site: string | null) => site === null || visibleSlugs.has(site);
  const siteName = (heritage: Heritage) => (lang === "ne" ? heritage.nameNe : heritage.name);

  const fill = (text: string) =>
    text
      .replaceAll("{sites}", siteNameList(heritages, lang, dict))
      .replaceAll("{address}", ward.office.address[lang])
      .replaceAll("{phone}", ward.office.phone)
      .replaceAll("{email}", ward.office.email)
      .replaceAll("{team}", credits.photos.team?.[lang] ?? "");

  // Topic order: each site's own topics (in site order), then the fixed ones.
  const allTopics = [
    ...heritages.flatMap((heritage) =>
      faq.siteTopics.map(({ kind, label }) => ({
        id: `${heritage.slug}-${kind}`,
        label: label[lang].replace("{site}", siteName(heritage)),
      })),
    ),
    ...faq.topics.map((topic) => ({ id: topic.id, label: topic.label[lang] })),
  ];
  const topicIdOf = (site: string | null, topic: string | null) =>
    topic === null ? null : faq.siteTopics.some((t) => t.kind === topic) ? `${site}-${topic}` : topic;
  const topicOrder = (id: string | null) => (id === null ? allTopics.length : allTopics.findIndex((t) => t.id === id));

  const entries = faq.entries
    .filter((entry) => visible(entry.site))
    .map((entry) => {
      if (entry.link) checkLink(entry.id, entry.link, visibleSlugs, heritagesByLang);
      const links: ChatLink[] = [];
      let note: string | null = null;
      const heritage = heritages.find((h) => h.slug === entry.site);
      if (entry.directions && heritage?.coordinates) {
        // Our own 3D map only; the site never links to external map services.
        links.push({ href: `/${lang}/map/?site=${heritage.slug}`, label: dict.chat.viewOnMap, external: false });
        if (heritage.coordinatesApproximate) note = dict.chat.approximateNote;
      }
      if (entry.link)
        links.push({
          href: `/${lang}${entry.link}`,
          label: dict.chat.readMore,
          external: false,
        });
      const topic = topicIdOf(entry.site, entry.topic);
      return {
        id: entry.id,
        topic,
        site: entry.site,
        question: lang === "ne" ? entry.q_ne : entry.q_en,
        answer: fill(lang === "ne" ? entry.a_ne : entry.a_en),
        note,
        links,
      };
    });
  const priority = new Map(faq.entries.map((entry) => [entry.id, entry.priority]));
  entries.sort(
    (a, b) => topicOrder(a.topic) - topicOrder(b.topic) || (priority.get(a.id) ?? 0) - (priority.get(b.id) ?? 0),
  );

  // PREVIEW (branch preview/chatbot-tap): the first tap-only layout (commit f85bcc1, before the
  // "Visiting / About" topics), built from today's content: one topic per site (its "about" questions),
  // "Getting there" (every site's visiting questions, after "Which sites…" and "Is there a map?"), and
  // "Contact the ward office". The other website questions appear only as related questions under
  // answers, and there are no quick-question chips, as in f85bcc1.
  const GETTING_THERE = "getting-there";
  const GENERAL_GETTING_THERE = new Set(["sites", "map"]);
  const regrouped = entries.map((entry) => {
    const t = entry.topic;
    const topic =
      t === null
        ? null
        : t.endsWith("-about")
          ? entry.site
          : t.endsWith("-visit") || (t === "website" && GENERAL_GETTING_THERE.has(entry.id))
            ? GETTING_THERE
            : t === "website"
              ? null
              : t;
    return { ...entry, topic };
  });
  const rank = (entry: { id: string; topic: string | null }) =>
    entry.topic === GETTING_THERE && GENERAL_GETTING_THERE.has(entry.id) ? 0 : 1;
  regrouped.sort((a, b) => rank(a) - rank(b)); // stable: the order within each topic is otherwise kept
  const topics = [
    ...heritages.map((heritage) => ({ id: heritage.slug, label: siteName(heritage) })),
    ...faq.topics
      .filter((topic) => topic.id === GETTING_THERE || topic.id === "contact")
      .map((topic) => ({ id: topic.id, label: topic.label[lang] })),
  ].filter((topic) => regrouped.some((entry) => entry.topic === topic.id));

  return { topics, entries: regrouped, suggestions: [] };
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
