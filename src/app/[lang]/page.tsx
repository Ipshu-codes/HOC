import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MuseumLanding from "@/components/MuseumLanding";
import { getCredits, getHeritageList, getWard } from "@/lib/content";
import { photoCreditText } from "@/lib/credits";
import { getDictionary, isLocale } from "@/lib/i18n";
import { galleryPhotos, imageSet } from "@/lib/images";
import type { HeritageSlug } from "@/types/heritage";

/** In the home page museum, Nanak Math's wing opens to the left of the junction, Mhepi Ajima's to the right. */
const WING_SIDE: Record<HeritageSlug, -1 | 1> = { "nanak-math": -1, "mhepi-ajima": 1 };

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  // Title, description and share image come from the layout; add the language alternates.
  return { alternates: { languages: { en: "/en/", ne: "/ne/" } } };
}

/**
 * The home page is only the online museum: a fixed fullscreen layer (globals.css) with the
 * ward map and logo in the entrance and a wing per visible site. The Overview, About and
 * Heritage Sites content lives on its own pages (/about/, /heritages/) — the
 * header's Home/About/Heritages links go there, and Home itself is this landing.
 */
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const ward = getWard();

  // Everything that names the heritage sites is built from this list, so the
  // museum reads naturally with one site or two (drafts are absent in production).
  const heritages = getHeritageList(lang);
  const credits = getCredits();
  const wardMap = ward.wardMap ? imageSet(ward.wardMap.files) : null;
  const overviewLogo = ward.overviewLogo
    ? imageSet(ward.overviewLogo.files)
    : null;
  const photoCredit = photoCreditText(credits, dict, lang);
  const museumSites = heritages.map((heritage) => ({
    slug: heritage.slug,
    name: lang === "ne" ? heritage.nameNe : heritage.name,
  }));

  return (
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
        overview: dict.home.overviewTitle,
        readMore: dict.home.readMore,
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
      overviewHref={`/${lang}/about/`}
      aboutHref={`/${lang}/about/#about`}
    />
  );
}
