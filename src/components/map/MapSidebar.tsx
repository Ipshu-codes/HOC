"use client";

import type { MapPlace } from "@/components/map/types";
import { fill } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface MapSidebarProps {
  /** Places that pass the current search. */
  results: MapPlace[];
  selectedId: string | null;
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (id: string) => void;
  labels: Dictionary["map"];
  lang: Locale;
  className?: string;
}

/** Search and the list of places. */
export default function MapSidebar(props: MapSidebarProps) {
  const { results, selectedId, query, labels, lang } = props;
  const t = labels;
  const countText = fill(results.length === 1 ? t.search.count.one : t.search.count.other, { n: results.length }, lang);

  return (
    <div className={`space-y-5 ${props.className ?? ""}`}>
      {/* ---- Search ---- */}
      <section aria-label={t.search.label}>
        <label htmlFor="map-search" className="mb-1 block font-bold">
          {t.search.label}
        </label>
        <div className="relative">
          <input
            id="map-search"
            type="search"
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            placeholder={t.search.placeholder}
            autoComplete="off"
            className={`min-h-11 w-full rounded-lg border border-gold/60 bg-white px-3 py-2 text-base text-ink placeholder:text-sm placeholder:text-ink/60 ${query !== "" ? "pr-11" : ""}`}
          />
          {query !== "" && (
            <button
              type="button"
              onClick={() => props.onQueryChange("")}
              aria-label={t.search.clear}
              className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink hover:text-crimson"
            >
              <span aria-hidden="true">✕</span>
            </button>
          )}
        </div>
      </section>

      {/* ---- Places ---- */}
      <section aria-labelledby="map-places-title">
        <h2 id="map-places-title" className="mb-1 text-2xl font-bold">
          {t.placesHeading}
        </h2>
        <p aria-live="polite" className="mb-2 text-sm text-ink/80">
          {results.length === 0 ? t.search.noResults : countText}
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {results.map((place) => {
            const selected = selectedId === place.id;
            return (
              <li key={place.id}>
                <button
                  type="button"
                  aria-pressed={selected}
                  aria-label={fill(t.showOnMap, { name: place.name })}
                  onClick={() => props.onSelect(place.id)}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl p-3 text-left shadow-sm ring-1 transition-colors ${
                    selected ? "bg-crimson text-white ring-crimson" : "bg-white text-ink ring-gold/50 hover:bg-sand"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-4 shrink-0 rounded-full border-2 border-white ${
                      place.kind === "office" ? "bg-brick" : "bg-crimson"
                    } ${selected ? "ring-2 ring-white" : ""}`}
                  />
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
