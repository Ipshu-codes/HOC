import "server-only";

import type { MuseumShellProps } from "@/components/MuseumShell";
import { getCredits, getHeritageList, getWard, phoneHref } from "@/lib/content";
import { photoCreditText } from "@/lib/credits";
import { getDictionary, getNavItems } from "@/lib/i18n";
import { galleryPhotos, imageSet } from "@/lib/images";
import type { HeritageSlug } from "@/types/heritage";
import type { Locale } from "@/types/locale";

/** In the museum, Nanak Math's wing opens to the left of the junction, Mhepi Ajima's to the right. */
const WING_SIDE: Record<HeritageSlug, -1 | 1> = { "nanak-math": -1, "mhepi-ajima": 1 };

/** Spoken stories in public/audio/, one recording per language (from the raw data's narration files).
 *  The museum plays the one in the page's language; a site without one has no Listen plaque. */
const NARRATIONS: Partial<Record<HeritageSlug, Record<Locale, string>>> = {
  "nanak-math": { en: "/audio/nanak-math-narration-en.aac", ne: "/audio/nanak-math-narration-ne.aac" },
};

/**
 * Everything the museum shell needs, built at build time from content/ (visible sites only, so a
 * draft site never appears) and the page language's strings. Used once, by the root layout.
 */
export function museumShellProps(lang: Locale): Omit<MuseumShellProps, "children"> {
  const dict = getDictionary(lang);
  const ward = getWard();
  const heritages = getHeritageList(lang);
  const credits = getCredits();
  const wardMap = ward.wardMap ? imageSet(ward.wardMap.files) : null;
  const overviewLogo = ward.overviewLogo ? imageSet(ward.overviewLogo.files) : null;
  const sites = heritages.map((heritage) => ({
    slug: heritage.slug,
    name: lang === "ne" ? heritage.nameNe : heritage.name,
  }));
  const readAboutName = (name: string) => dict.home.museumReadAboutLabel.replace("{name}", name);
  // Only a visible (published) site's story: a draft site has no wing to play it in.
  const narrated = sites.flatMap((site) => {
    const files = NARRATIONS[site.slug];
    return files ? [{ site: site.slug, src: files[lang], name: site.name, listen: dict.gallery.narrationListen }] : [];
  })[0];

  return {
    lang,
    photos: galleryPhotos(heritages),
    sites,
    credit: photoCreditText(credits, dict, lang),
    year: credits.photos.year,
    galleryLabels: dict.gallery,
    labels: {
      title: dict.home.museumLandingTitle,
      start: dict.home.startExploring,
      hint: dict.home.museumHint,
      aboutWard: dict.home.aboutWard16,
      readMore: dict.home.readMore,
    },
    exhibit: {
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
      // "Read About →" plaques under the signboards (each site's page) and beside the emblem (About).
      readAbout: {
        text: dict.home.museumReadAbout,
        aboutHref: `/${lang}/about/`,
        aboutLabel: readAboutName(ward.name[lang]),
      },
      wings: sites.map((site) => ({
        slug: site.slug,
        label: dict.home.museumSigns[site.slug],
        side: WING_SIDE[site.slug],
        href: `/${lang}/heritage/${site.slug}/`,
        // The sign's line break is only for the engraving; spoken names run on.
        readLabel: readAboutName(dict.home.museumSigns[site.slug].replace(/\n/g, " ")),
      })),
      narration: narrated,
    },
    aboutHref: `/${lang}/about/`,
    topBar: {
      nav: { label: dict.nav.label, menu: dict.nav.menu, items: getNavItems(lang, dict) },
      wardLogo: { src: ward.logo.src, width: 128, height: 128, homeHref: `/${lang}/`, homeLabel: dict.a11y.homeLink },
      languageLabels: dict.language,
      contact: {
        organisation: `${ward.name[lang]}, ${ward.city[lang]}`,
        address: ward.office.address[lang],
        phone: ward.office.phone,
        phoneHref: phoneHref(ward.office.phone),
        email: ward.office.email,
        mapHref: ward.office.coordinates ? `/${lang}/map/?site=ward-office` : null,
      },
      contactLabels: {
        button: dict.nav.contact,
        heading: dict.contactPage.officeHeading,
        address: dict.footer.address,
        phone: dict.footer.phone,
        email: dict.footer.email,
        viewOnMap: dict.heritage.viewOnMap,
        close: dict.gallery.lightbox.Close,
        more: dict.contactPage.sendMessageLink,
        moreHref: `/${lang}/contact/`,
      },
      logo: { src: "/images/logo/Ratna.png", width: 922, height: 402 },
    },
  };
}
