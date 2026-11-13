import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import MapExplorer, { MapExplorerFromUrl } from "@/components/MapExplorer";
import type { MapPlace } from "@/components/MapView";
import { getHeritageList, getWard } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";
import { plainImage } from "@/lib/images";
import type { Locale } from "@/types/locale";

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

/** Places for the map: visible heritage sites that have coordinates, plus the ward office. */
function mapPlaces(lang: Locale): MapPlace[] {
  const dict = getDictionary(lang);
  const sites: MapPlace[] = getHeritageList(lang).flatMap((heritage) => {
    if (!heritage.coordinates) return []; // not placed on the map until coordinates are confirmed
    const cover = heritage.gallery.find((image) => image.src === heritage.cover);
    return [
      {
        id: heritage.slug,
        kind: "heritage" as const,
        name: lang === "ne" ? heritage.nameNe : heritage.name,
        coordinates: heritage.coordinates,
        summary: heritage.summary,
        href: `/${lang}/heritage/${heritage.slug}/`,
        photo: cover ? { src: cover.src.replace(/\.webp$/, "-640.webp"), alt: cover.alt } : undefined,
        approximate: heritage.coordinatesApproximate,
      },
    ];
  });

  const { office } = getWard();
  const officePlace: MapPlace[] = office.coordinates
    ? [
        {
          id: "ward-office",
          kind: "office",
          name: dict.map.wardOffice,
          coordinates: office.coordinates,
          summary: office.address[lang],
          approximate: office.coordinatesApproximate,
        },
      ]
    : [];

  return [...sites, ...officePlace];
}

export default async function MapPage({ params }: PageProps<"/[lang]/map">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  // Still picture for phones until the map is loaded: a screenshot of this map without draft
  // sites (scripts/image-manifest.json, "map/preview").
  const props = { places: mapPlaces(lang), labels: dict.map, preview: plainImage(MAP_PREVIEW) };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-10">
      <h1 className="text-4xl font-bold md:text-5xl">{dict.map.title}</h1>
      <div aria-hidden="true" className="mt-3 mb-4 h-1 w-16 rounded-full bg-gold" />
      <p className="mb-6 max-w-3xl text-lg">{dict.map.intro}</p>

      {/* Reading ?site= needs a Suspense boundary in a static export. */}
      <Suspense fallback={<MapExplorer {...props} />}>
        <MapExplorerFromUrl {...props} />
      </Suspense>
    </div>
  );
}
