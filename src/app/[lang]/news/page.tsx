import type { Metadata } from "next";
import { notFound } from "next/navigation";

import NewsPortal from "@/components/NewsPortal";
import { getNewsPortalContent } from "@/lib/news";
import { getDictionary, isLocale } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

export async function generateMetadata({ params }: PageProps<"/[lang]/news">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.news.title,
    description: dict.news.intro,
    alternates: { languages: { en: "/en/news/", ne: "/ne/news/" } },
  };
}

function kathmanduToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export default async function NewsPage({ params }: PageProps<"/[lang]/news">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const content = getNewsPortalContent();
  return (
    <NewsPortal
      lang={lang as Locale}
      labels={dict.news}
      notices={content.notices}
      events={content.events}
      initialToday={kathmanduToday()}
    />
  );
}
