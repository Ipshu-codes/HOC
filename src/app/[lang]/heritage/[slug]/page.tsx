import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import DraftBanner from "@/components/DraftBanner";
import HeritageCard from "@/components/HeritageCard";
import PhotoCredit from "@/components/PhotoCredit";
import QuickFacts from "@/components/QuickFacts";
import ResponsiveImage from "@/components/ResponsiveImage";
import TableOfContents from "@/components/TableOfContents";
import { getCredits, getHeritageList, getHeritageSlugs } from "@/lib/content";
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
    { id: "sources", text: t.sources, depth: 2 as const },
  ];

  return (
    <>
      <DraftBanner draft={heritage.draft} dict={dict} />

      {/* Cover banner with the name in both languages */}
      <section className="relative isolate flex min-h-[18rem] items-end overflow-hidden md:min-h-[26rem]">
        <ResponsiveImage image={cover} sizes="100vw" priority className="absolute inset-0 -z-10 size-full object-cover" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-brick via-brick/70 to-brick/10" />
        <div className="mx-auto w-full max-w-6xl px-4 pt-20 pb-8 md:pb-12">
          <Link
            href={`/${lang}/#heritages`}
            prefetch={false}
            className="text-sm font-medium text-cream underline-offset-4 hover:underline focus-visible:outline-cream"
          >
            <span aria-hidden="true">← </span>
            {t.backToAll}
          </Link>
          <h1 className="mt-2 text-4xl font-bold text-white md:text-6xl">{name}</h1>
          <p lang={lang === "ne" ? "en" : "ne"} className="mt-1 text-xl text-cream md:text-2xl">
            {otherName}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:py-14">
        <div>
          <TableOfContents title={t.onThisPage} entries={toc} />
        </div>

        <div className="min-w-0">
          <QuickFacts heritage={heritage} dict={dict} />

          {heritage.coordinates && (
            <Link
              href={`/${lang}/map/?site=${heritage.slug}`}
              className="mt-6 inline-block rounded-xl bg-crimson px-5 py-3 font-bold text-white hover:bg-brick"
            >
              {t.viewOnMap} <span aria-hidden="true">→</span>
            </Link>
          )}

          {/* Rendered from our own markdown files in content/ (trusted, build-time only). */}
          <article className="heritage-prose mt-10" dangerouslySetInnerHTML={{ __html: heritage.html }} />

          <section id="photos" aria-labelledby="photos-title" className="mt-14">
            <h2 id="photos-title" className="text-3xl font-bold">
              {t.photos}
            </h2>
            <ul className="mt-4 flex snap-x gap-3 overflow-x-auto pb-3">
              {photos.map((image) => (
                <li key={image.src} className="w-56 shrink-0 snap-start md:w-64">
                  <ResponsiveImage
                    image={image}
                    sizes="16rem"
                    className="aspect-4/3 w-full rounded-xl object-cover shadow-sm"
                  />
                </li>
              ))}
            </ul>
            <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
              <PhotoCredit credits={credits} dict={dict} lang={lang} />
              <Link
                href={`/${lang}/gallery/?site=${heritage.slug}`}
                className="font-bold text-crimson underline underline-offset-4 hover:text-brick"
              >
                {t.seeAllPhotos} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </section>

          <section id="sources" aria-labelledby="sources-title" className="mt-14">
            <h2 id="sources-title" className="text-3xl font-bold">
              {t.sources}
            </h2>
            <p className="mt-3">{t.sourcesIntro}</p>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              {heritage.sources.map((source) => (
                <li key={source.key}>
                  {source.url ? (
                    <a href={source.url} className="text-crimson underline underline-offset-4 hover:text-brick">
                      {source.label}
                    </a>
                  ) : (
                    source.label
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-ink/80">{t.sourcesNote}</p>
          </section>
        </div>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="other-heritage-title" className="bg-sand">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <h2 id="other-heritage-title" className="mb-8 text-3xl font-bold">
              {byCount(t.otherHeritage, others.length)}
            </h2>
            <div className={others.length === 1 ? "mx-auto max-w-5xl" : "grid gap-8 md:grid-cols-2"}>
              {others.map((other) => (
                <HeritageCard
                  key={other.slug}
                  heritage={other}
                  cover={coverImage(other)}
                  lang={lang}
                  dict={dict}
                  layout={others.length === 1 ? "horizontal" : "vertical"}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
