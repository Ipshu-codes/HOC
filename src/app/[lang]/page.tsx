import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ContactStrip from "@/components/ContactStrip";
import HeritageCard from "@/components/HeritageCard";
import Hero from "@/components/Hero";
import HomeSection from "@/components/HomeSection";
import ResponsiveImage from "@/components/ResponsiveImage";
import SectionDivider from "@/components/SectionDivider";
import { getHeritageList, getHomeConfig, getWard } from "@/lib/content";
import { byCount, getDictionary, isLocale, siteNameList } from "@/lib/i18n";
import { coverImage, findSiteImage, type SiteImage } from "@/lib/images";
import type { Heritage } from "@/types/heritage";

const GALLERY_PREVIEW_COUNT = 6;

/** The 6 preview photos: the preferred list from content/home.json first, then any other photos of visible sites. */
function galleryPreview(preferred: string[], heritages: Heritage[]): SiteImage[] {
  const all = [...preferred, ...heritages.flatMap((heritage) => heritage.gallery.map((image) => image.src))];
  const unique = [...new Set(all)];
  return unique
    .map((src) => findSiteImage(src, heritages))
    .filter((image): image is SiteImage => image !== null)
    .slice(0, GALLERY_PREVIEW_COUNT);
}

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  // Title, description and share image come from the layout; add the language alternates.
  return { alternates: { languages: { en: "/en/", ne: "/ne/" } } };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const ward = getWard();
  const home = getHomeConfig();

  // Everything that names the heritage sites is built from this list, so the
  // page reads naturally with one site or two (drafts are absent in production).
  const heritages = getHeritageList(lang);
  const count = heritages.length;
  const sites = siteNameList(heritages, lang, dict);
  const fill = (text: string) => text.replace("{sites}", sites);

  const heroImage =
    home.heroCandidates.map((src) => findSiteImage(src, heritages)).find((image) => image !== null) ??
    coverImage(heritages[0]);
  const preview = galleryPreview(home.galleryPreview, heritages);
  const showDevPlaceholder = process.env.NODE_ENV !== "production";

  return (
    <>
      <Hero
        image={heroImage}
        title={dict.home.heroTitle}
        subtitle={fill(dict.home.heroSubtitle)}
        primary={{ href: "#heritages", label: fill(byCount(dict.home.explore, count)) }}
        secondary={{ href: `/${lang}/map/`, label: dict.home.viewMap }}
      />

      <HomeSection id="overview" title={dict.home.overviewTitle}>
        <div className="max-w-3xl space-y-4 text-lg">
          <p>{fill(byCount(dict.home.overviewIntro, count))}</p>
          <p>{byCount(dict.home.overviewNext, count)}</p>
        </div>
      </HomeSection>

      <SectionDivider />

      <HomeSection id="about" title={dict.home.aboutTitle} tone="sand">
        <p className="max-w-3xl text-lg">{dict.home.aboutIntro.replace("{address}", ward.office.address[lang])}</p>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { term: dict.home.aboutMunicipality, value: ward.city[lang] },
            { term: dict.home.aboutWard, value: ward.name[lang] },
            { term: dict.home.aboutOffice, value: ward.office.address[lang] },
            { term: byCount(dict.home.aboutSites, count), value: sites },
          ].map(({ term, value }) => (
            <div key={term} className="rounded-xl bg-cream p-5 shadow-sm ring-1 ring-gold/40">
              <dt className="text-sm font-bold text-crimson">{term}</dt>
              <dd className="mt-1 text-lg font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {/* Dev only: no source yet for more ward facts (see MISSING_INFO.md). Never rendered in a production build. */}
        {showDevPlaceholder && (
          <p className="mt-6 max-w-3xl rounded-xl border-2 border-dashed border-crimson p-4 text-crimson">
            {dict.home.aboutPlaceholder}
          </p>
        )}
      </HomeSection>

      <HomeSection id="heritages" title={byCount(dict.home.heritagesTitle, count)}>
        <div className={count === 1 ? "mx-auto max-w-5xl" : "grid gap-8 md:grid-cols-2"}>
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

      <SectionDivider />

      <HomeSection id="gallery" title={dict.home.galleryTitle}>
        <p className="mb-6 text-lg">{fill(dict.home.galleryIntro)}</p>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {preview.map((image) => (
            <li key={image.src}>
              <ResponsiveImage
                image={image}
                sizes="(min-width: 768px) 33vw, 50vw"
                className="aspect-square w-full rounded-xl object-cover shadow-sm"
              />
            </li>
          ))}
        </ul>
        <Link
          href={`/${lang}/gallery/`}
          className="mt-6 inline-block font-bold text-crimson underline underline-offset-4 hover:text-brick"
        >
          {dict.home.seeAll} <span aria-hidden="true">→</span>
        </Link>
      </HomeSection>

      <ContactStrip lang={lang} dict={dict} ward={ward} />
    </>
  );
}
