import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ContactStrip from "@/components/ContactStrip";
import HeritageCard from "@/components/HeritageCard";
import MuseumLanding from "@/components/MuseumLanding";
import HomeGalleryCarousel from "@/components/HomeGalleryCarousel";
import HomeSection from "@/components/HomeSection";
import SectionDivider from "@/components/SectionDivider";
import {
  getCredits,
  getHeritageList,
  getHomeConfig,
  getWard,
} from "@/lib/content";
import { naniCreditText } from "@/lib/credits";
import { photoCreditText } from "@/lib/credits";
import { byCount, getDictionary, isLocale, siteNameList } from "@/lib/i18n";
import {
  coverImage,
  findSiteImage,
  galleryPhotos,
  imageSet,
  type SiteImage,
} from "@/lib/images";
import type { Heritage, HeritageSlug } from "@/types/heritage";

const GALLERY_PREVIEW_COUNT = 6;

/** In the home page museum, Nanak Math's wing opens to the left of the junction, Mhepi Ajima's to the right. */
const WING_SIDE: Record<HeritageSlug, -1 | 1> = { "nanak-math": -1, "mhepi-ajima": 1 };

/** The 6 preview photos: the preferred list from content/home.json first, then any other photos of visible sites. */
function galleryPreview(
  preferred: string[],
  heritages: Heritage[],
): SiteImage[] {
  const all = [
    ...preferred,
    ...heritages.flatMap((heritage) =>
      heritage.gallery.map((image) => image.src),
    ),
  ];
  const unique = [...new Set(all)];
  return unique
    .map((src) => findSiteImage(src, heritages))
    .filter((image): image is SiteImage => image !== null)
    .slice(0, GALLERY_PREVIEW_COUNT);
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
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

  const preview = galleryPreview(home.galleryPreview, heritages);
  const credits = getCredits();
  const illustration = ward.illustration
    ? imageSet(ward.illustration.files)
    : null;
  const overviewImage = ward.overviewImage
    ? imageSet(ward.overviewImage.files)
    : null;
  const wardMap = ward.wardMap ? imageSet(ward.wardMap.files) : null;
  const overviewLogo = ward.overviewLogo
    ? imageSet(ward.overviewLogo.files)
    : null;
  // "Nani character by …"; null in production builds until the creator is set in content/credits.json.
  const naniCredit = naniCreditText(credits, dict, lang);
  const photoCredit = photoCreditText(credits, dict, lang);
  const museumSites = heritages.map((heritage) => ({
    slug: heritage.slug,
    name: lang === "ne" ? heritage.nameNe : heritage.name,
  }));

  return (
    <>
      {/* The online museum is the landing: ward map and logo in the entrance, a wing per visible site. */}
      <MuseumLanding
        lang={lang}
        photos={galleryPhotos(heritages)}
        sites={museumSites}
        credit={photoCredit}
        year={credits.photos.year}
        galleryLabels={dict.gallery}
        labels={{
          title: dict.home.museumLandingTitle,
          start: dict.home.startExploring,
          hint: dict.home.museumHint,
          aboutWard: dict.home.aboutWard16,
          overview: dict.nav.overview,
        }}
        exhibit={{
          map:
            ward.wardMap && wardMap
              ? {
                  // The 640 px file on the wall; the 960 px one only for the close look.
                  src: ward.wardMap.files.find((file) => file.endsWith("-640.webp")) ?? wardMap.src,
                  hiSrc: wardMap.src,
                  width: wardMap.width,
                  height: wardMap.height,
                  alt: ward.wardMap.alt[lang],
                }
              : null,
          logo:
            ward.overviewLogo && overviewLogo
              ? { src: overviewLogo.src, width: overviewLogo.width, height: overviewLogo.height, alt: ward.overviewLogo.alt[lang] }
              : null,
          wings: heritages.map((heritage) => ({
            slug: heritage.slug,
            label: dict.home.museumSigns[heritage.slug],
            side: WING_SIDE[heritage.slug],
          })),
        }}
        overviewHref={`/${lang}/#overview`}
      />

      <HomeSection id="overview" title={dict.home.overviewTitle}>
        {/* Same grid as the About section below: text column + 15rem/18rem image column from 768 px.
            Nani's namaste sits beside the text there, raised to the heading (md:-mt-16), and below the text on phones. */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start lg:grid-cols-[minmax(0,48rem)_18rem] lg:justify-between">
          <div className="space-y-4 text-lg">
            <p className="justified">
              {fill(byCount(dict.home.overviewIntro, count))}
            </p>
            <p className="justified">
              {byCount(dict.home.overviewNext, count)}
            </p>
            {wardMap && (
              // The whole ward map fills the space under the text; the link opens the largest file to read the labels.
              <a
                href={wardMap.src}
                className="mt-8 block rounded-xl focus-visible:outline-offset-4"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                <img
                  src={wardMap.src}
                  srcSet={wardMap.srcSet}
                  sizes="(min-width: 64rem) 48rem, (min-width: 48rem) calc(100vw - 21rem), calc(100vw - 2rem)"
                  width={wardMap.width}
                  height={wardMap.height}
                  alt={ward.wardMap?.alt[lang] ?? ""}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-xl bg-white shadow-sm ring-1 ring-gold/40"
                />
              </a>
            )}
          </div>
          {/* Image column: Nani's namaste, then the ward logo beside the map. */}
          <div className="mx-auto flex w-full max-w-72 flex-col items-center gap-10 md:mx-0 md:-mt-16 md:max-w-none">
            {overviewImage && (
              // eslint-disable-next-line @next/next/no-img-element -- static export: no image server
              <img
                src={overviewImage.src}
                srcSet={overviewImage.srcSet}
                sizes="(min-width: 64rem) 18rem, (min-width: 48rem) 15rem, 18rem"
                width={overviewImage.width}
                height={overviewImage.height}
                alt={ward.overviewImage?.alt[lang] ?? ""}
                loading="lazy"
                decoding="async"
                className="w-full rounded-xl shadow-sm ring-1 ring-gold/40"
              />
            )}
            {overviewLogo && (
              // eslint-disable-next-line @next/next/no-img-element -- static export: no image server
              <img
                src={overviewLogo.src}
                srcSet={overviewLogo.srcSet}
                sizes="12rem"
                width={overviewLogo.width}
                height={overviewLogo.height}
                alt={ward.overviewLogo?.alt[lang] ?? ""}
                loading="lazy"
                decoding="async"
                className="w-48 max-w-full rounded-full"
              />
            )}
          </div>
        </div>
      </HomeSection>

      <SectionDivider />

      <HomeSection id="about" title={dict.home.aboutTitle} tone="sand">
        {/* Text from the ward team; {sites} keeps draft sites out of production builds. The ward
            illustration fills the space beside it from 768 px, and sits under it on phones. */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start lg:grid-cols-[minmax(0,48rem)_18rem] lg:justify-between">
          <p className="justified text-lg">{fill(dict.home.aboutIntro)}</p>
          {illustration && (
            // eslint-disable-next-line @next/next/no-img-element -- static export: no image server
            <img
              src={illustration.src}
              srcSet={illustration.srcSet}
              sizes="(min-width: 64rem) 18rem, (min-width: 48rem) 15rem, 18rem"
              width={illustration.width}
              height={illustration.height}
              alt={ward.illustration?.alt[lang] ?? ""}
              loading="lazy"
              decoding="async"
              className="mx-auto w-full max-w-72 rounded-xl shadow-sm ring-1 ring-gold/40 md:mx-0"
            />
          )}
        </div>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { term: dict.home.aboutMunicipality, value: ward.city[lang] },
            { term: dict.home.aboutWard, value: ward.name[lang] },
            { term: dict.home.aboutOffice, value: ward.office.address[lang] },
            { term: byCount(dict.home.aboutSites, count), value: sites },
          ].map(({ term, value }) => (
            <div
              key={term}
              className="rounded-xl bg-cream p-5 shadow-sm ring-1 ring-gold/40"
            >
              <dt className="text-sm font-bold text-crimson">{term}</dt>
              <dd className="mt-1 text-lg font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        {naniCredit && (
          <p
            className={`mt-6 text-sm ${credits.nani.creator ? "text-ink/80" : "font-bold text-crimson"}`}
          >
            {naniCredit}
          </p>
        )}
      </HomeSection>

      <HomeSection
        id="heritages"
        title={byCount(dict.home.heritagesTitle, count)}
      >
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

      <SectionDivider />

      <HomeSection id="gallery" title={dict.home.galleryTitle}>
        <p className="mb-6 text-lg">{fill(dict.home.galleryIntro)}</p>
        <HomeGalleryCarousel
          images={preview}
          labels={{
            title: dict.home.galleryTitle,
            previousPhoto: dict.home.previousPhoto,
            nextPhoto: dict.home.nextPhoto,
          }}
        />
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
