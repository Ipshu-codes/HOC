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

  const galleryProps = { lang, photos, sites, credit: photoCreditText(credits, dict, lang), labels: dict.gallery };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <h1 className="text-4xl font-bold md:text-5xl">{dict.gallery.title}</h1>
      <div aria-hidden="true" className="mt-3 mb-6 h-1 w-16 rounded-full bg-gold" />
      <p className="max-w-3xl text-lg">{dict.gallery.intro.replace("{sites}", siteNameList(heritages, lang, dict))}</p>
      <PhotoCredit credits={credits} dict={dict} lang={lang} className="mt-2 mb-8" />

      {/* Reading ?site= needs a Suspense boundary in a static export. The fallback is the same
          grid without the URL filter, so the prerendered HTML is complete before JavaScript runs. */}
      <Suspense fallback={<Gallery {...galleryProps} />}>
        <GalleryFromUrl {...galleryProps} />
      </Suspense>
    </div>
  );
}
