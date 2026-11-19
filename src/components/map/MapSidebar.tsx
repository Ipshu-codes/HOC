"use client";

import type { MapPlace } from "@/components/map/types";
import { fill } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface MapSidebarProps {
  places: MapPlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  labels: Dictionary["map"];
  lang: Locale;
  className?: string;
}

/** The map's place list. Search and category filter controls are intentionally omitted. */
export default function MapSidebar(props: MapSidebarProps) {
  const { places, selectedId, labels, lang } = props;
  const t = labels;
  const countText = fill(places.length === 1 ? t.search.count.one : t.search.count.other, { n: places.length }, lang);

  return (
    <div className={`map-sidebar space-y-5 ${props.className ?? ""}`}>
      {/* ---- Places ---- */}
      <section className="map-sidebar__places" aria-labelledby="map-places-title">
        <h2 id="map-places-title" className="mb-1 text-2xl font-bold">
          {t.placesHeading}
        </h2>
        <p className="mb-2 text-sm text-ink/80">{countText}</p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {places.map((place) => {
            const selected = selectedId === place.id;
            return (
              <li key={place.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={fill(t.showOnMap, { name: place.name })}
                  onClick={() => props.onSelect(place.id)}
                  className={`map-place-row flex min-h-11 w-full items-center gap-3 p-3 text-left transition-colors ${selected ? "map-place-row--selected" : ""}`}
                >
                  {place.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- prebuilt site photo assets
                    <img src={place.photo.src} alt="" width={96} height={72} loading="lazy" decoding="async" className="map-place-photo" />
                  ) : (
                    <span aria-hidden="true" className={`map-place-marker ${place.kind === "office" ? "map-place-marker--office" : ""}`} />
                  )}
                  <span>
                    <span className="block font-bold">{place.name}</span>
                    <span lang={lang === "ne" ? "en" : "ne"} className="block text-sm opacity-90">
                      {place.nameAlt}
                    </span>
                    <span className="block text-sm opacity-80">
                      {t.kinds[place.kind]}
                      {place.approximate && ` · ${t.approximate}`}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

    </div>
  );
}
