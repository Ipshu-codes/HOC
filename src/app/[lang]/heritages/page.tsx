import type { Metadata } from "next";
import { notFound } from "next/navigation";

import HeritageCard from "@/components/HeritageCard";
import HomeSection from "@/components/HomeSection";
import { getHeritageList } from "@/lib/content";
import { byCount, getDictionary, isLocale } from "@/lib/i18n";
import { coverImage } from "@/lib/images";

export async function generateMetadata({ params }: PageProps<"/[lang]/heritages">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  const count = getHeritageList(lang).length;
  return {
    title: byCount(dict.home.heritagesTitle, count),
    alternates: { languages: { en: "/en/heritages/", ne: "/ne/heritages/" } },
  };
}

/** The Heritage Sites content that used to be a section of the home page. */
export default async function HeritagesPage({ params }: PageProps<"/[lang]/heritages">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  // Visible sites only: draft sites are absent in production builds.
  const heritages = getHeritageList(lang);
  const count = heritages.length;

  return (
    <HomeSection id="heritages" title={byCount(dict.home.heritagesTitle, count)}>
      <div
        className={
          count === 1 ? "mx-auto max-w-5xl" : "grid gap-8 md:grid-cols-2"
        }
      >
        {heritages.map((heritage) => (
          <HeritageCard
            key={heritage.slug}
            heritage={heritage}
            cover={coverImage(heritage)}
            lang={lang}
            dict={dict}
            layout={count === 1 ? "horizontal" : "vertical"}
          />
        ))}
      </div>
    </HomeSection>
  );
}
