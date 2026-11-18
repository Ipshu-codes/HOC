"use client";

import type { MapPlace, PlaceKind } from "@/components/map/types";
import { fill } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface MapControlsProps {
  places: MapPlace[];
  /** Places that pass the selected category filters. */
  results: MapPlace[];
  selectedId: string | null;
  kinds: ReadonlySet<PlaceKind>;
  onToggleKind: (kind: PlaceKind) => void;
  onClearFilters: () => void;
  onSelect: (id: string) => void;
  labels: Dictionary["map"];
  lang: Locale;
}

const CHIP = "min-h-11 rounded-full px-4 py-2 text-sm font-bold ring-1";

/** Category filters and place selectors above the full-width map. */
export default function MapControls(props: MapControlsProps) {
  const { places, results, selectedId, kinds, labels, lang } = props;
  const t = labels;
  const allKinds = [...new Set(places.map((place) => place.kind))];
  const countText = fill(
    results.length === 1 ? t.search.count.one : t.search.count.other,
    { n: results.length },
    lang,
  );

  return (
    <div className="w-full rounded-xl bg-sand/70 p-3 ring-1 ring-gold/40 sm:p-4">
      <div className="flex flex-col gap-4">
        {allKinds.length > 1 && (
          <section aria-label={t.filters.label}>
            <div role="group" aria-label={t.filters.label} className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={kinds.size === 0}
                onClick={props.onClearFilters}
                className={`${CHIP} ${
                  kinds.size === 0
                    ? "bg-crimson text-white ring-crimson"
                    : "bg-white text-ink ring-gold/50 hover:bg-sand"
                }`}
              >
                {t.filters.all}
              </button>
              {allKinds.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={kinds.has(kind)}
                  onClick={() => props.onToggleKind(kind)}
                  className={`${CHIP} ${
                    kinds.has(kind)
                      ? "bg-crimson text-white ring-crimson"
                      : "bg-white text-ink ring-gold/50 hover:bg-sand"
                  }`}
                >
                  {t.kinds[kind]}
                </button>
              ))}
            </div>
          </section>
        )}

        <section aria-labelledby="map-places-title" className="min-w-0">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="map-places-title" className="text-xl font-bold text-brick">
              {t.placesHeading}
            </h2>
            <p aria-live="polite" className="text-sm text-ink/80">
              {countText}
            </p>
          </div>
          <ul className="flex snap-x gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible xl:grid-cols-3">
            {results.map((place) => {
              const selected = selectedId === place.id;
              return (
                <li key={place.id} className="w-56 shrink-0 snap-start sm:w-auto sm:shrink">
                  <button
                    type="button"
                    aria-pressed={selected}
                    aria-label={fill(t.showOnMap, { name: place.name })}
                    onClick={() => props.onSelect(place.id)}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-xl p-2.5 text-left shadow-sm ring-1 transition-colors ${
                      selected
                        ? "bg-crimson text-white ring-crimson"
                        : "bg-white text-ink ring-gold/50 hover:bg-sand"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-4 shrink-0 rounded-full border-2 border-white ${
                        place.kind === "office" ? "bg-brick" : "bg-crimson"
                      } ${selected ? "ring-2 ring-white" : ""}`}
                    />
                    <span className="min-w-0">
                      <span title={place.name} className="block truncate font-bold">
                        {place.name}
                      </span>
                      <span
                        lang={lang === "ne" ? "en" : "ne"}
                        title={place.nameAlt}
                        className="block truncate text-sm opacity-90"
                      >
                        {place.nameAlt}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
