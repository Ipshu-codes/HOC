import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import MapExplorer, { MapExplorerFromUrl } from "@/components/MapExplorer";
import { getDictionary, isLocale } from "@/lib/i18n";
import { plainImage } from "@/lib/images";
import { getMapData } from "@/lib/map-data";

const MAP_PREVIEW = "/images/map/preview.webp";

export async function generateMetadata({ params }: PageProps<"/[lang]/map">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.map.title,
    description: dict.map.intro,
    alternates: { languages: { en: "/en/map/", ne: "/ne/map/" } },
  };
}

export default async function MapPage({ params }: PageProps<"/[lang]/map">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const { places, route } = getMapData(lang);
  // Still picture for phones until the map is loaded: a screenshot of this map without draft
  // sites (scripts/image-manifest.json, "map/preview").
  const props = { places, route, labels: dict.map, lang, preview: plainImage(MAP_PREVIEW) };

  return (
    // Biegajaca's page top (giant italic title, a short paragraph), then the map across the full width.
    <div className="map-page wrap pt-8 pb-10 md:pt-10">
      <h1 className="d-1 max-w-[14ch]">{dict.map.title}</h1>
      <p className="lede mt-5 mb-8 max-w-2xl">{dict.map.intro}</p>

      {/* Reading ?site= needs a Suspense boundary in a static export. */}
      <Suspense fallback={<MapExplorer {...props} />}>
        <MapExplorerFromUrl {...props} />
      </Suspense>
    </div>
  );
}
