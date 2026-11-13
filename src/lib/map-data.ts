import "server-only";

import { getCredits, getHeritageList, getRoutes, getWard, phoneHref } from "@/lib/content";
import { photoCreditText } from "@/lib/credits";
import { haversineMeters } from "@/lib/format";
import { getDictionary, type Dictionary } from "@/lib/i18n";
import { findSiteImage } from "@/lib/images";
import type { MapPlace, MapRoute, PlaceDetails, PlacePhoto, PlaceSection, RouteLeg } from "@/components/map/types";
import type { Heritage, Locale } from "@/types/heritage";

const MAX_PANEL_PHOTOS = 8;

/** Splits the rendered page into its h2 sections; titles come from the page's own table of contents. */
function splitSections(heritage: Heritage): PlaceSection[] {
  const marks = [...heritage.html.matchAll(/<h2 id="([^"]+)">.*?<\/h2>/g)];
  return marks.map((mark, i) => {
    const start = (mark.index ?? 0) + mark[0].length;
    const end = marks[i + 1]?.index ?? heritage.html.length;
    const id = mark[1];
    const title = heritage.toc.find((entry) => entry.id === id && entry.depth === 2)?.text ?? id;
    return { id, title, html: heritage.html.slice(start, end) };
  });
}

function buildDetails(heritage: Heritage, lang: Locale, dict: Dictionary): PlaceDetails {
  const t = dict.heritage;
  const photos: PlacePhoto[] = heritage.gallery
    .slice(0, MAX_PANEL_PHOTOS)
    .flatMap((image) => {
      const found = findSiteImage(image.src, [heritage]);
      if (!found) return [];
      const smallest = found.srcSet.split(",")[0]?.trim().split(" ")[0] ?? found.src;
      return [{ src: smallest, width: found.width, height: found.height, alt: found.alt }];
    });

  const facts = [
    { label: t.location, value: heritage.location },
    { label: t.established, value: heritage.established },
    { label: t.hours, value: heritage.visiting.hours },
    ...(heritage.visiting.entry ? [{ label: t.entry, value: heritage.visiting.entry }] : []),
  ];

  return {
    facts,
    sections: splitSections(heritage),
    photos,
    sources: heritage.sources,
    galleryHref: `/${lang}/gallery/?site=${heritage.slug}`,
    credit: photoCreditText(getCredits(), dict, lang),
  };
}

/**
 * Everything the map page needs, built from the same sources as the rest of the site:
 * visible heritage sites that have coordinates (getHeritageList hides drafts in production),
 * the ward office, and the predefined walking route restricted to those visible sites.
 */
export function getMapData(lang: Locale): { places: MapPlace[]; route: MapRoute | null } {
  const dict = getDictionary(lang);
  const other: Locale = lang === "ne" ? "en" : "ne";

  const sites: MapPlace[] = getHeritageList(lang).flatMap((heritage) => {
    if (!heritage.coordinates) return []; // not on the map until coordinates are confirmed
    const cover = heritage.gallery.find((image) => image.src === heritage.cover);
    return [
      {
        id: heritage.slug,
        kind: "heritage" as const,
        name: lang === "ne" ? heritage.nameNe : heritage.name,
        nameAlt: lang === "ne" ? heritage.name : heritage.nameNe,
        coordinates: heritage.coordinates,
        summary: heritage.summary,
        href: `/${lang}/heritage/${heritage.slug}/`,
        photo: cover ? { src: cover.src.replace(/\.webp$/, "-640.webp"), alt: cover.alt } : undefined,
        approximate: heritage.coordinatesApproximate,
        details: buildDetails(heritage, lang, dict),
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
          nameAlt: getDictionary(other).map.wardOffice,
          coordinates: office.coordinates,
          summary: office.address[lang],
          approximate: office.coordinatesApproximate,
          contact: {
            address: office.address[lang],
            phone: office.phone,
            phoneHref: phoneHref(office.phone),
            email: office.email,
          },
        },
      ]
    : [];

  const places = [...sites, ...officePlace];
  return { places, route: buildRoute(lang, sites) };
}

/** The first predefined route that still has two or more published stops, or null. */
function buildRoute(lang: Locale, sites: MapPlace[]): MapRoute | null {
  const byId = new Map(sites.map((place) => [place.id, place]));
  for (const definition of getRoutes()) {
    const stops = definition.stops.filter((slug) => byId.has(slug));
    if (stops.length < 2) continue;

    const legs: RouteLeg[] = stops.slice(0, -1).map((from, i) => {
      const to = stops[i + 1];
      const forward = definition.walking?.legs.find((leg) => leg.from === from && leg.to === to);
      const backward = definition.walking?.legs.find((leg) => leg.from === to && leg.to === from);
      const walked = forward ?? backward;
      if (walked) {
        return {
          from,
          to,
          path: forward ? walked.path : [...walked.path].reverse(),
          walking: true,
          distanceMeters: walked.distanceMeters,
          durationSeconds: walked.durationSeconds,
        };
      }
      const a = byId.get(from)!.coordinates;
      const b = byId.get(to)!.coordinates;
      return { from, to, path: [a, b], walking: false, distanceMeters: haversineMeters(a, b), durationSeconds: null };
    });

    return {
      id: definition.id,
      name: definition.name[lang],
      intro: definition.intro?.[lang],
      stops,
      legs,
      walkingSource: definition.walking?.source,
    };
  }
  return null;
}
