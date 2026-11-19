import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import DraftBanner from "@/components/DraftBanner";
import HeritageCard from "@/components/HeritageCard";
import PhotoCredit from "@/components/PhotoCredit";
import PhotoStoryRail from "@/components/PhotoStoryRail";
import QuickFacts from "@/components/QuickFacts";
import ResponsiveImage from "@/components/ResponsiveImage";
import TableOfContents from "@/components/TableOfContents";
import { getCredits, getHeritageList, getHeritageSlugs, informationFromText } from "@/lib/content";
import { byCount, getDictionary, isLocale } from "@/lib/i18n";
import { coverImage, findSiteImage, type SiteImage } from "@/lib/images";
import type { Heritage, Locale } from "@/types/heritage";

const PHOTO_STRIP_COUNT = 10;

// Static export: one page per visible site (drafts only exist in `npm run dev`).
export const dynamicParams = false;

export function generateStaticParams() {
  return getHeritageSlugs().map((slug) => ({ slug }));
}

/** The site with this slug, if it is on this build. */
function findHeritage(lang: Locale, slug: string): Heritage | undefined {
  return getHeritageList(lang).find((heritage) => heritage.slug === slug);
}

export async function generateMetadata({ params }: PageProps<"/[lang]/heritage/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isLocale(lang)) return {};
  const heritage = findHeritage(lang, slug);
  if (!heritage) return {};

  const cover = coverImage(heritage);
  const largest = cover.src.replace(/\.webp$/, "-1920.webp");
  return {
    title: lang === "ne" ? heritage.nameNe : heritage.name,
    description: heritage.summary,
    alternates: {
      languages: { en: `/en/heritage/${slug}/`, ne: `/ne/heritage/${slug}/` },
    },
    openGraph: {
      title: lang === "ne" ? heritage.nameNe : heritage.name,
      description: heritage.summary,
      images: [{ url: cover.srcSet.includes(largest) ? largest : cover.src, alt: cover.alt }],
    },
  };
}

export default async function HeritagePage({ params }: PageProps<"/[lang]/heritage/[slug]">) {
  const { lang, slug } = await params;
  if (!isLocale(lang)) notFound();
  const heritage = findHeritage(lang, slug);
  if (!heritage) notFound();

  const dict = getDictionary(lang);
  const t = dict.heritage;
  const credits = getCredits();
  const informedBy = informationFromText(heritage.slug, lang);
  const cover = coverImage(heritage);
  const name = lang === "ne" ? heritage.nameNe : heritage.name;
  const otherName = lang === "ne" ? heritage.name : heritage.nameNe;

  const photos = heritage.gallery
    .slice(0, PHOTO_STRIP_COUNT)
    .map((image) => findSiteImage(image.src, [heritage]))
    .filter((image): image is SiteImage => image !== null);

  // Only sites on this build: in a preview without drafts there may be none.
  const others = getHeritageList(lang).filter((other) => other.slug !== heritage.slug);

  const toc = [
    ...heritage.toc,
    { id: "photos", text: t.photos, depth: 2 as const },
  ];

  return (
    <>
      <DraftBanner draft={heritage.draft} dict={dict} />

      <section className="heritage-cover" aria-label={name}>
        <ResponsiveImage image={cover} sizes="100vw" priority className="heritage-cover__image" />
        <header className="heritage-opening">
          <Link href={`/${lang}/#heritages`} prefetch={false} className="text-link heritage-opening__back">
            <span aria-hidden="true">← </span>{t.backToAll}
          </Link>
          <div className="heritage-opening__grid">
            <div>
              <p className="eyebrow">{heritage.location}</p>
              <h1>{name}</h1>
              <p lang={lang === "ne" ? "en" : "ne"} className="heritage-opening__other">{otherName}</p>
            </div>
            <div className="heritage-opening__summary">
              <p className="justified">{heritage.summary}</p>
              {heritage.coordinates && (
                <Link href={`/${lang}/map/?site=${heritage.slug}`} className="button button--dark">
                  {t.viewOnMap}<span aria-hidden="true"> ↗</span>
                </Link>
              )}
            </div>
          </div>
        </header>
      </section>

      <div className="heritage-reading">
        <aside className="heritage-reading__navigation">
          <TableOfContents title={t.onThisPage} entries={toc} />
        </aside>

        <div className="heritage-reading__body">
          <QuickFacts heritage={heritage} dict={dict} />
          {/* Rendered from our own Markdown files (trusted, build-time only); the words are unchanged. */}
          <article className="heritage-prose" dangerouslySetInnerHTML={{ __html: heritage.html }} />
          {informedBy && <p className="heritage-credit">{t.informationFrom.replace("{people}", informedBy)}</p>}

          <section id="photos" aria-labelledby="photos-title" className="heritage-photos">
            <div className="heritage-photos__heading">
              <h2 id="photos-title">{t.photos}</h2>
              <Link href={`/${lang}/gallery/?site=${heritage.slug}`} className="text-link">
                {t.seeAllPhotos}<span aria-hidden="true"> ↗</span>
              </Link>
            </div>
            <PhotoStoryRail photos={photos} labels={{ previous: dict.home.previousPhoto, next: dict.home.nextPhoto, photos: dict.home.photoSlides }} />
            <PhotoCredit credits={credits} dict={dict} lang={lang} className="mt-5" />
          </section>
        </div>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="other-heritage-title" className="bg-sand">
          {/* Same vertical rhythm as the home page sections (HomeSection). */}
          <div className="editorial-section__inner">
              <h2 id="other-heritage-title" className="section-title">
              {byCount(t.otherHeritage, others.length)}
            </h2>
            <div className={others.length === 1 ? "mx-auto max-w-5xl" : "grid gap-8 md:grid-cols-2"}>
              {others.map((other) => (
                <HeritageCard
                  key={other.slug}
                  heritage={other}
                  cover={coverImage(other)}
                  lang={lang}
                  labels={dict.home}
                  layout={others.length === 1 ? "horizontal" : "vertical"}
                  index={1}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
