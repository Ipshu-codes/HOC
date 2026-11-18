import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import Gallery, { GalleryFromUrl } from "@/components/Gallery";
import PhotoCredit from "@/components/PhotoCredit";
import { photoCreditText } from "@/lib/credits";
import { getCredits, getHeritageList } from "@/lib/content";
import { getDictionary, isLocale, siteNameList } from "@/lib/i18n";
import { galleryPhotos } from "@/lib/images";

export async function generateMetadata({ params }: PageProps<"/[lang]/gallery">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.gallery.title,
    description: dict.gallery.intro.replace("{sites}", siteNameList(getHeritageList(lang), lang, dict)),
    alternates: { languages: { en: "/en/gallery/", ne: "/ne/gallery/" } },
  };
}

export default async function GalleryPage({ params }: PageProps<"/[lang]/gallery">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const credits = getCredits();
  // Visible sites only: draft sites contribute no photos to a production build.
  const heritages = getHeritageList(lang);
  const photos = galleryPhotos(heritages);
  const sites = heritages.map((heritage) => ({
    slug: heritage.slug,
    name: lang === "ne" ? heritage.nameNe : heritage.name,
  }));

  const galleryProps = {
    lang,
    photos,
    sites,
    credit: photoCreditText(credits, dict, lang),
    year: credits.photos.year,
    labels: dict.gallery,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
      {/* Centred page heading, the same family as the home sections (globals.css: .page-title). */}
      <header className="mb-12 text-center md:mb-16">
        <h1 className="page-title font-bold">{dict.gallery.title}</h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg">{dict.gallery.intro.replace("{sites}", siteNameList(heritages, lang, dict))}</p>
        <PhotoCredit credits={credits} dict={dict} lang={lang} className="mt-2" />
      </header>

      {/* Reading ?site= needs a Suspense boundary in a static export. The fallback is the same
          grid without the URL filter, so the prerendered HTML is complete before JavaScript runs. */}
      <Suspense fallback={<Gallery {...galleryProps} />}>
        <GalleryFromUrl {...galleryProps} />
      </Suspense>
    </div>
  );
}
