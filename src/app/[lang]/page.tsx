import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ContactStrip from "@/components/ContactStrip";
import CursorTrail from "@/components/CursorTrail";
import FanIn from "@/components/FanIn";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import Hero, { type HeroStrip } from "@/components/Hero";
import HeritageRows, { type HeritageRow } from "@/components/HeritageRows";
import { getCredits, getHeritageList, getHeroSlideConfig, getHomeConfig, getPhotoConsent, getWard } from "@/lib/content";
import { naniCreditText } from "@/lib/credits";
import { byCount, getDictionary, isLocale, siteNameList } from "@/lib/i18n";
import { coverImage, findSiteImage, imageSet, type SiteImage } from "@/lib/images";
import type { Heritage } from "@/types/heritage";

/** Photos in the home page carousel ("01 / 09"). */
const GALLERY_PREVIEW_COUNT = 9;
/** The hero shows four strips; this photo is always one of them (the Mhepi Ajima inner shrine). */
const HERO_MUST_INCLUDE = "/images/mhepi-ajima/inner-shrine.webp";

/**
 * The carousel photos: the preferred list from content/home.json first, then any other photos of
 * visible sites. The sites' cover photos are left out: the heritage rows already show them.
 */
function galleryPreview(preferred: string[], heritages: Heritage[]): SiteImage[] {
  const covers = new Set(heritages.map((heritage) => heritage.cover));
  const all = [...preferred, ...heritages.flatMap((heritage) => heritage.gallery.map((image) => image.src))];
  const unique = [...new Set(all)].filter((src) => !covers.has(src));
  return unique
    .map((src) => findSiteImage(src, heritages))
    .filter((image): image is SiteImage => image !== null)
    .slice(0, GALLERY_PREVIEW_COUNT);
}

/**
 * The four hero strips from content/home.json → heroSlides (visible sites only): the first slide (the
 * page's main photo), the inner shrine second (so phones, which show two strips, have it too), then the
 * next slides in their order. Falls back to the first site's cover.
 */
function heroStrips(heritages: Heritage[]): HeroStrip[] {
  const slides = getHeroSlideConfig().flatMap(({ src, position }) => {
    const image = findSiteImage(src, heritages);
    return image ? [{ src: image.src, srcSet: image.srcSet, width: image.width, height: image.height, alt: image.alt, position }] : [];
  });
  if (slides.length === 0) {
    const cover = coverImage(heritages[0]);
    return [{ src: cover.src, srcSet: cover.srcSet, width: cover.width, height: cover.height, alt: cover.alt }];
  }
  const must = slides.find((slide) => slide.src === HERO_MUST_INCLUDE);
  const rest = slides.filter((slide, index) => index > 0 && slide !== must);
  return [slides[0], ...(must && must !== slides[0] ? [must] : []), ...rest].slice(0, 4);
}

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  // Title, description and share image come from the layout; add the language alternates.
  return { alternates: { languages: { en: "/en/", ne: "/ne/" } } };
}

/**
 * Home page in the order of the Biegajaca layout (docs/ui-match/reference-notes.md §3.1): hero wall,
 * works carousel (our Gallery), materials rows (our Heritage sites), dark band (About), fanned prints
 * (Overview), closing call to action (Contact). The words are the same as before (scripts/text-lock.ts).
 */
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
  const siteNames = new Map(heritages.map((h) => [h.slug, lang === "ne" ? h.nameNe : h.name]));
  const credits = getCredits();
  const consent = getPhotoConsent().photos;
  const illustration = ward.illustration ? imageSet(ward.illustration.files) : null;
  const overviewImage = ward.overviewImage ? imageSet(ward.overviewImage.files) : null;
  const wardMap = ward.wardMap ? imageSet(ward.wardMap.files) : null;
  const overviewLogo = ward.overviewLogo ? imageSet(ward.overviewLogo.files) : null;
  // "Nani character by …"; null in production builds until the creator is set in content/credits.json.
  const naniCredit = naniCreditText(credits, dict, lang);

  // Heritage rows: the cover and one more photo of the site (decorative), never one with people in it.
  const rows: HeritageRow[] = heritages.map((heritage) => {
    const secondSrc = heritage.gallery.find((image) => image.src !== heritage.cover && !consent[image.src])?.src;
    const second = secondSrc ? findSiteImage(secondSrc, [heritage]) : null;
    return {
      slug: heritage.slug,
      href: `/${lang}/heritage/${heritage.slug}/`,
      name: lang === "ne" ? heritage.nameNe : heritage.name,
      otherName: lang === "ne" ? heritage.name : heritage.nameNe,
      otherLang: lang === "ne" ? "en" : "ne",
      summary: heritage.summary,
      location: heritage.location,
      cover: coverImage(heritage),
      second: second && { src: second.src, srcSet: second.srcSet, width: second.width, height: second.height },
      draftBadge: heritage.draft && process.env.NODE_ENV !== "production" ? dict.home.draftBadge : null,
    };
  });

  // Small files for the mouse trail in the dark band (no people in them).
  const trailPhotos = preview.filter((image) => !consent[image.src]).map((image) => image.src.replace(/\.webp$/, "-480.webp"));

  return (
    <>
      <Hero
        strips={heroStrips(heritages)}
        title={dict.home.heroTitle}
        subtitle={fill(dict.home.heroSubtitle)}
        primary={{ href: "#heritages", label: fill(byCount(dict.home.explore, count)) }}
        secondary={{ href: `/${lang}/map/`, label: dict.home.viewMap }}
      />

      {/* 2 · Works carousel → our Gallery photos. */}
      <FeaturedCarousel
        lang={lang}
        labels={dict.home.carousel}
        heading={
          <>
            <h2 id="gallery-title" className="d-2 max-w-[12ch]">
              {dict.home.galleryTitle}
            </h2>
            <p className="lede mt-5">{fill(dict.home.galleryIntro)}</p>
          </>
        }
        more={{ href: `/${lang}/gallery/`, label: dict.home.seeAll }}
        slides={preview.map((image) => ({
          src: image.src,
          srcSet: image.srcSet,
          width: image.width,
          height: image.height,
          alt: image.alt,
          site: siteNames.get(image.site) ?? "",
        }))}
      />

      {/* 3 · Materials rows → our Heritage sites. */}
      <section id="heritages" aria-labelledby="heritages-title" className="wrap section rule">
        <div className="site-rows">
          <h2 id="heritages-title" className="d-2 mb-10 max-w-[14ch] lg:w-[calc(50%-var(--gap)/2)]">
            {byCount(dict.home.heritagesTitle, count)}
          </h2>
          <HeritageRows rows={rows} labels={{ readMore: dict.home.readMore, location: dict.home.location }} />
        </div>
      </section>

      {/* 4 · Dark band → About Ward No. 16 (with the mouse trail). */}
      <section id="about" aria-labelledby="about-title" className="band section">
        <CursorTrail photos={trailPhotos} />
        <div className="wrap relative z-[1] mx-auto max-w-5xl text-center">
          <h2 id="about-title" className="d-1 mx-auto max-w-[12ch]">
            {dict.home.aboutTitle}
          </h2>
          <p className="justified mx-auto mt-8 max-w-[38rem] text-lg leading-relaxed">{fill(dict.home.aboutIntro)}</p>
          {illustration && (
            // eslint-disable-next-line @next/next/no-img-element -- static export: no image server
            <img
              src={illustration.src}
              srcSet={illustration.srcSet}
              sizes="18rem"
              width={illustration.width}
              height={illustration.height}
              alt={ward.illustration?.alt[lang] ?? ""}
              loading="lazy"
              decoding="async"
              className="print mx-auto mt-10 w-full max-w-72 -rotate-2"
            />
          )}
          <dl className="mx-auto mt-12 grid max-w-3xl gap-x-8 text-left sm:grid-cols-2">
            {[
              { term: dict.home.aboutMunicipality, value: ward.city[lang] },
              { term: dict.home.aboutWard, value: ward.name[lang] },
              { term: dict.home.aboutOffice, value: ward.office.address[lang] },
              { term: byCount(dict.home.aboutSites, count), value: sites },
            ].map(({ term, value }) => (
              <div key={term} className="rule py-3">
                <dt className="mono muted">{term}</dt>
                <dd className="mt-1 text-lg">{value}</dd>
              </div>
            ))}
          </dl>
          {naniCredit && <p className={`mono mt-8 ${credits.nani.creator ? "muted" : "font-bold"}`}>{naniCredit}</p>}
        </div>
      </section>

      {/* 5 · Commissions (fanned prints + two columns) → Overview. */}
      <section id="overview" aria-labelledby="overview-title" className="wrap section">
        <h2 id="overview-title" className="d-1 mx-auto max-w-[14ch] text-center">
          {dict.home.overviewTitle}
        </h2>
        <FanIn className="mt-10 mb-14">
          {overviewImage && (
            // eslint-disable-next-line @next/next/no-img-element -- static export: no image server
            <img
              src={overviewImage.src}
              srcSet={overviewImage.srcSet}
              sizes="(min-width: 48rem) 15rem, 40vw"
              width={overviewImage.width}
              height={overviewImage.height}
              alt={ward.overviewImage?.alt[lang] ?? ""}
              loading="lazy"
              decoding="async"
              className="print w-[40vw] max-w-60"
            />
          )}
          {wardMap && (
            // The whole ward map; the link opens the largest file to read the labels.
            <a href={wardMap.src} className="print block w-[52vw] max-w-[22rem] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transition-none">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
              <img
                src={wardMap.src}
                srcSet={wardMap.srcSet}
                sizes="(min-width: 48rem) 22rem, 52vw"
                width={wardMap.width}
                height={wardMap.height}
                alt={ward.wardMap?.alt[lang] ?? ""}
                loading="lazy"
                decoding="async"
                className="w-full bg-white"
              />
            </a>
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
              className="print w-[34vw] max-w-48 rounded-full"
            />
          )}
        </FanIn>
        <div className="grid gap-8 md:grid-cols-2 md:gap-[var(--gap)]">
          <p className="justified rule pt-5 text-lg leading-relaxed">{fill(byCount(dict.home.overviewIntro, count))}</p>
          <p className="justified rule pt-5 text-lg leading-relaxed">{byCount(dict.home.overviewNext, count)}</p>
        </div>
      </section>

      {/* 8 · Closing call to action → Contact. */}
      <ContactStrip lang={lang} dict={dict} ward={ward} />
    </>
  );
}
