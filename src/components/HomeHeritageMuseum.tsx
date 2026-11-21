"use client";

import { Suspense } from "react";

import Gallery, { GalleryFromUrl } from "@/components/Gallery";
import HomeSection from "@/components/HomeSection";
import type { Dictionary } from "@/lib/i18n";
import type { GalleryPhoto } from "@/lib/images";
import type { Locale } from "@/types/locale";

interface HomeHeritageMuseumProps {
  lang: Locale;
  photos: GalleryPhoto[];
  sites: { slug: string; name: string }[];
  credit: string | null;
  year: number | null;
  labels: Dictionary["gallery"];
  dictHome: Dictionary["home"];
}

export default function HomeHeritageMuseum({
  lang,
  photos,
  sites,
  credit,
  year,
  labels,
  dictHome,
}: HomeHeritageMuseumProps) {
  const galleryProps = {
    lang,
    photos,
    sites,
    credit,
    year,
    labels,
  };

  return (
    <HomeSection id="heritage-museum" title={dictHome.museumTitle}>
      <p className="mb-6 text-lg">{dictHome.museumIntro}</p>
      <div className="gallery-page">
        {/* Reading ?site= needs a Suspense boundary in a static export. The fallback is the same
            view without the URL filter, so the prerendered HTML is complete before JavaScript runs. */}
        <Suspense fallback={<Gallery {...galleryProps} />}>
          <GalleryFromUrl {...galleryProps} />
        </Suspense>
      </div>
    </HomeSection>
  );
}
