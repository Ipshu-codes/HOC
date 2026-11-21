import type { Metadata } from "next";
import { notFound } from "next/navigation";

import HomeSection from "@/components/HomeSection";
import SectionDivider from "@/components/SectionDivider";
import { getCredits, getHeritageList, getWard } from "@/lib/content";
import { naniCreditText } from "@/lib/credits";
import { byCount, getDictionary, isLocale, siteNameList } from "@/lib/i18n";
import { imageSet } from "@/lib/images";

export async function generateMetadata({ params }: PageProps<"/[lang]/about">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.home.aboutTitle,
    alternates: { languages: { en: "/en/about/", ne: "/ne/about/" } },
  };
}

/**
 * The About page opens with the Overview content, then the About Ward No. 16 content —
 * the same sections that used to sit below the museum on the home page. The standalone
 * /overview route was folded in here so the content lives in exactly one place.
 */
export default async function AboutPage({ params }: PageProps<"/[lang]/about">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const ward = getWard();
  const heritages = getHeritageList(lang);
  const count = heritages.length;
  const sites = siteNameList(heritages, lang, dict);
  const credits = getCredits();

  const illustration = ward.illustration ? imageSet(ward.illustration.files) : null;
  const wardMap = ward.wardMap ? imageSet(ward.wardMap.files) : null;
  const overviewImage = ward.overviewImage ? imageSet(ward.overviewImage.files) : null;
  const overviewLogo = ward.overviewLogo ? imageSet(ward.overviewLogo.files) : null;
  // "Nani character by …"; null in production builds until the creator is set in content/credits.json.
  const naniCredit = naniCreditText(credits, dict, lang);

  return (
    <>
      <HomeSection id="overview" title={dict.home.overviewTitle} headingLevel="h2">
        {/* Same grid as the About section below: text column + 15rem/18rem image column from 768 px.
            Nani's namaste sits beside the text there, raised to the heading (md:-mt-16), and below the text on phones. */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_15rem] md:items-start lg:grid-cols-[minmax(0,48rem)_18rem] lg:justify-between">
          <div className="space-y-4 text-lg">
            <p className="justified">
              {byCount(dict.home.overviewIntro, count).replace("{sites}", sites)}
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
          <p className="justified text-lg">{dict.home.aboutIntro.replace("{sites}", sites)}</p>
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
    </>
  );
}
