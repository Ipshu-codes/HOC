import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import DraftBanner from "@/components/DraftBanner";
import FanIn from "@/components/FanIn";
import PhotoCredit from "@/components/PhotoCredit";
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

      {/* The "work page" top (Biegajaca layout): the cover photo sticky on the left; name, facts and
          the map button on the right. */}
      <div className="wrap pt-6 pb-16 md:pt-8">
        <Link href={`/${lang}/#heritages`} prefetch={false} className="mono link-slide">
          <span aria-hidden="true">←&nbsp;</span>
          {t.backToAll}
        </Link>

        <div className="mt-4 grid gap-10 lg:grid-cols-12 lg:gap-[var(--gap)]">
          <div className="lg:col-span-7">
            <div className="work-photo">
              <ResponsiveImage image={cover} sizes="(min-width: 64rem) 56vw, 100vw" priority className="max-h-[80vh] w-full object-cover" />
            </div>
          </div>

          <div className="lg:col-span-5">
            <h1 className="d-1">{name}</h1>
            <p lang={lang === "ne" ? "en" : "ne"} className="mono muted mt-3">
              {otherName}
            </p>
            <div className="mt-8">
              <QuickFacts heritage={heritage} dict={dict} />
            </div>
            {heritage.coordinates && (
              <Link href={`/${lang}/map/?site=${heritage.slug}`} className="btn btn-lg btn-accent mt-8">
                {t.viewOnMap} <span aria-hidden="true">→</span>
              </Link>
            )}
            <div className="mt-10">
              <TableOfContents title={t.onThisPage} entries={toc} />
            </div>
          </div>
        </div>
      </div>

      {/* The story: big headings, short-measure paragraphs; Festivals as rows, How to Visit as steps. */}
      <div className="wrap pb-10">
        {/* Rendered from our own markdown files in content/ (trusted, build-time only). */}
        <article className="heritage-prose" dangerouslySetInnerHTML={{ __html: heritage.html }} />
        {/* Who gave the information (content/credits.json → informationFrom). */}
        {informedBy && <p className="mono muted mt-10">{t.informationFrom.replace("{people}", informedBy)}</p>}
      </div>

      {/* Photos: a grid of portrait prints (their works grid). */}
      <section id="photos" aria-labelledby="photos-title" className="wrap section rule">
        <h2 id="photos-title" className="d-2">
          {t.photos}
        </h2>
        <ul className="mt-8 grid grid-cols-2 gap-x-[var(--gap)] gap-y-8 md:grid-cols-4">
          {photos.map((image) => (
            <li key={image.src}>
              <ResponsiveImage image={image} sizes="(min-width: 48rem) 24vw, 48vw" className="aspect-4/5 w-full object-cover" develop />
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <PhotoCredit credits={credits} dict={dict} lang={lang} className="mono" />
          <Link href={`/${lang}/gallery/?site=${heritage.slug}`} className="btn btn-outline">
            {t.seeAllPhotos} <span aria-hidden="true">→</span>
          </Link>
        </div>
        {/* No Sources section (removed 17 Nov 2026). Sources stay cited in the content's
            <!-- source: --> comments, which the build still checks. */}
      </section>

      {others.length > 0 && (
        <section aria-labelledby="other-heritage-title" className="wrap section rule">
          <h2 id="other-heritage-title" className="d-2 mb-10">
            {byCount(t.otherHeritage, others.length)}
          </h2>
          {others.map((other) => {
            const otherCover = coverImage(other);
            const otherTitle = lang === "ne" ? other.nameNe : other.name;
            return (
              // Their "more works": a fanned print on the left, name and details on the right.
              <article key={other.slug} className="mb-12 grid items-center gap-10 lg:grid-cols-12 lg:gap-[var(--gap)]">
                <FanIn className="lg:col-span-6">
                  <span aria-hidden="true" className="print block aspect-4/5 w-[46vw] max-w-72" />
                  <ResponsiveImage image={otherCover} sizes="(min-width: 64rem) 20rem, 56vw" className="print aspect-4/5 w-[56vw] max-w-80 object-cover" />
                  <span aria-hidden="true" className="print block aspect-4/5 w-[46vw] max-w-72" />
                </FanIn>
                <div className="lg:col-span-6">
                  <h3 className="d-3">{otherTitle}</h3>
                  <p lang={lang === "ne" ? "en" : "ne"} className="mono muted mt-3">
                    {lang === "ne" ? other.name : other.nameNe}
                  </p>
                  <p className="mt-5 max-w-xl">{other.summary}</p>
                  <p className="muted mt-3 max-w-xl text-sm">
                    <span className="font-bold">{dict.home.location}:</span> {other.location}
                  </p>
                  <Link href={`/${lang}/heritage/${other.slug}/`} className="btn btn-lg btn-accent mt-6">
                    {dict.home.readMore}
                    <span className="sr-only"> — {otherTitle}</span>
                    <span aria-hidden="true"> →</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </>
  );
}
