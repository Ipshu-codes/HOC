import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AssistantCallout from "@/components/AssistantCallout";
import ContactStrip from "@/components/ContactStrip";
import HeritageCard from "@/components/HeritageCard";
import Hero from "@/components/Hero";
import type { HeroSlide } from "@/components/HeroSlides";
import HomeSection from "@/components/HomeSection";
import PhotoStoryRail from "@/components/PhotoStoryRail";
import SectionDivider from "@/components/SectionDivider";
import { getCredits, getHeritageList, getHomeConfig, getWard } from "@/lib/content";
import { naniCreditText } from "@/lib/credits";
import { byCount, getDictionary, isLocale, siteNameList } from "@/lib/i18n";
import { coverImage, findSiteImage, imageSet, type SiteImage } from "@/lib/images";
import type { Heritage } from "@/types/heritage";

const GALLERY_PREVIEW_COUNT = 6;
const HERO_SLIDE_SOURCES = new Set([
  "/images/nanak-math/courtyard-view.webp",
  "/images/mhepi-ajima/temple-and-courtyard-shrine.webp",
  "/images/nanak-math/samadhi-temple.webp",
  "/images/mhepi-ajima/temple-front.webp",
]);

/** Preferred story photos first, followed by other approved images from published sites. */
function galleryPreview(preferred: string[], heritages: Heritage[]): SiteImage[] {
  const all = [
    ...preferred,
    ...heritages.flatMap((heritage) => heritage.gallery.map((image) => image.src)),
  ];
  return [...new Set(all)]
    .map((src) => findSiteImage(src, heritages))
    .filter((image): image is SiteImage => image !== null)
    .slice(0, GALLERY_PREVIEW_COUNT);
}

export async function generateMetadata({ params }: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  return { alternates: { languages: { en: "/en/", ne: "/ne/" } } };
}

export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const ward = getWard();
  const home = getHomeConfig();
  const heritages = getHeritageList(lang);
  const heroSlides = home.heroSlides.flatMap((entry): HeroSlide[] => {
    const slide = typeof entry === "string" ? { src: entry, position: undefined } : entry;
    if (!HERO_SLIDE_SOURCES.has(slide.src)) return [];
    const image = findSiteImage(slide.src, heritages);
    return image ? [{ ...image, position: slide.position }] : [];
  });
  const count = heritages.length;
  const sites = siteNameList(heritages, lang, dict);
  const fill = (text: string) => text.replace("{sites}", sites);
  const photos = galleryPreview(home.galleryPreview, heritages);
  const credits = getCredits();
  const illustration = ward.illustration ? imageSet(ward.illustration.files) : null;
  const overviewImage = ward.overviewImage ? imageSet(ward.overviewImage.files) : null;
  const wardMap = ward.wardMap ? imageSet(ward.wardMap.files) : null;
  const overviewLogo = ward.overviewLogo ? imageSet(ward.overviewLogo.files) : null;
  const naniCredit = naniCreditText(credits, dict, lang);

  return (
    <div className="heritage-home">
      <Hero
        lang={lang}
        title={dict.home.heroTitle}
        subtitle={fill(dict.home.heroSubtitle)}
        mapLabel={dict.home.viewMap}
        eyebrow={dict.home.heroEyebrow}
        slides={heroSlides}
        intervalMs={home.heroIntervalMs}
      />

      <HomeSection id="overview" title={dict.home.overviewTitle} index="01">
        <div className="home-intro-layout">
          <div className="home-intro-copy">
            <p className="home-intro-lead justified">{fill(byCount(dict.home.overviewIntro, count))}</p>
            <p className="justified">{byCount(dict.home.overviewNext, count)}</p>
          </div>
          {overviewImage && (
            <figure className="home-intro-image">
              {/* eslint-disable-next-line @next/next/no-img-element -- prebuilt responsive assets */}
              <img src={overviewImage.src} srcSet={overviewImage.srcSet} sizes="(min-width: 900px) 28vw, 74vw" width={overviewImage.width} height={overviewImage.height} alt={ward.overviewImage?.alt[lang] ?? ""} className="home-intro-image__nani" loading="lazy" decoding="async" />
              {overviewLogo && (
                // eslint-disable-next-line @next/next/no-img-element -- static export: source set is built at optimize time
                <img
                  src={overviewLogo.src}
                  srcSet={overviewLogo.srcSet}
                  sizes="6rem"
                  width={overviewLogo.width}
                  height={overviewLogo.height}
                  alt={ward.overviewLogo?.alt[lang] ?? ""}
                  className="home-intro-image__seal"
                  loading="lazy"
                  decoding="async"
                />
              )}
              {naniCredit && <figcaption className={`home-intro-caption ${credits.nani.creator ? "text-slate" : "font-bold text-crimson"}`}>{naniCredit}</figcaption>}
            </figure>
          )}
        </div>
      </HomeSection>

      <SectionDivider />

      <HomeSection id="about" title={dict.home.aboutTitle} tone="crimson" index="02">
        <div className="ward-story">
          <div className="ward-story__copy">
            <p className="justified text-lg leading-relaxed">{fill(dict.home.aboutIntro)}</p>
            <dl className="ward-facts">
              {[
                { term: dict.home.aboutMunicipality, value: ward.city[lang] },
                { term: dict.home.aboutWard, value: ward.name[lang] },
                { term: dict.home.aboutOffice, value: ward.office.address[lang] },
                { term: byCount(dict.home.aboutSites, count), value: sites },
              ].map(({ term, value }) => (
                <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
              ))}
            </dl>
          </div>
          {illustration && (
            <div className="ward-story__art">
              {/* eslint-disable-next-line @next/next/no-img-element -- prebuilt responsive assets */}
              <img src={illustration.src} srcSet={illustration.srcSet} sizes="(min-width: 900px) 36vw, 86vw" width={illustration.width} height={illustration.height} alt={ward.illustration?.alt[lang] ?? ""} className="ward-story__illustration" loading="lazy" decoding="async" />
            </div>
          )}
        </div>
      </HomeSection>

      <HomeSection id="heritages" title={byCount(dict.home.heritagesTitle, count)} index="03">
        <p className="section-lead justified">{fill(dict.home.heroSubtitle)}</p>
        <div className={count === 1 ? "heritage-index heritage-index--single" : "heritage-index"}>
          {heritages.map((heritage, index) => (
            <HeritageCard
              key={heritage.slug}
              heritage={heritage}
              cover={coverImage(heritage)}
              lang={lang}
              labels={dict.home}
              layout={count === 1 ? "horizontal" : "vertical"}
              index={index + 1}
            />
          ))}
        </div>
      </HomeSection>

      <section className="map-invitation" aria-labelledby="map-invitation-title">
        <div className="map-invitation__copy">
          <p className="eyebrow">{dict.map.title}</p>
          <h2 id="map-invitation-title">{dict.home.mapStoryTitle}</h2>
          <p className="justified">{dict.map.intro}</p>
          <Link className="button button--light" href={`/${lang}/map/`}>{dict.home.viewMap}<span aria-hidden="true"> ↗</span></Link>
        </div>
        {wardMap && (
          <a href={wardMap.src} className="map-invitation__image-link" aria-label={dict.home.openWardMap}>
            {/* eslint-disable-next-line @next/next/no-img-element -- map source set is built with the image pipeline */}
            <img src={wardMap.src} srcSet={wardMap.srcSet} sizes="(min-width: 900px) 48vw, 100vw" width={wardMap.width} height={wardMap.height} alt={ward.wardMap?.alt[lang] ?? ""} loading="lazy" decoding="async" />
          </a>
        )}
      </section>

      <HomeSection id="gallery" title={dict.home.visualStoryTitle} index="04">
        <div className="section-heading-row">
          <p className="section-lead justified">{dict.home.visualStoryIntro}</p>
          <Link href={`/${lang}/gallery/`} className="text-link">{dict.home.seeAll}<span aria-hidden="true"> ↗</span></Link>
        </div>
        <PhotoStoryRail photos={photos} labels={{ previous: dict.home.previousPhoto, next: dict.home.nextPhoto, photos: dict.home.photoSlides }} />
      </HomeSection>

      <AssistantCallout
        eyebrow={dict.chat.title}
        title={dict.home.guideTitle}
        text={dict.home.guideIntro}
        action={dict.home.guideCta}
      />

      <ContactStrip lang={lang} dict={dict} ward={ward} />
    </div>
  );
}
