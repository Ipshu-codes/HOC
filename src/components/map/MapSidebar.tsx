"use client";

import MapLegend from "@/components/map/MapLegend";
import RouteNav from "@/components/map/RouteNav";
import type { MapPlace, MapRoute, PlaceKind } from "@/components/map/types";
import { fill, formatNumber } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface MapSidebarProps {
  places: MapPlace[];
  /** Places that pass the current search and filters. */
  results: MapPlace[];
  selectedId: string | null;
  query: string;
  kinds: ReadonlySet<PlaceKind>;
  onQueryChange: (query: string) => void;
  onToggleKind: (kind: PlaceKind) => void;
  onClearFilters: () => void;
  onSelect: (id: string) => void;
  route: MapRoute | null;
  routeActive: boolean;
  routeStep: number;
  onExitRoute: () => void;
  onRoutePrevious: () => void;
  onRouteNext: () => void;
  onRouteOverview: () => void;
  onSelectStop: (index: number) => void;
  labels: Dictionary["map"];
  lang: Locale;
  className?: string;
}

const CHIP = "min-h-11 rounded-full px-4 py-2 text-sm font-bold ring-1";

/** Search, category filters, the list of places, the walking route and the legend. */
export default function MapSidebar(props: MapSidebarProps) {
  const { places, results, selectedId, query, kinds, labels, lang, route, routeActive, routeStep } = props;
  const t = labels;
  const allKinds = [...new Set(places.map((place) => place.kind))];
  const filtersActive = query.trim() !== "" || kinds.size > 0;
  const countText = fill(results.length === 1 ? t.search.count.one : t.search.count.other, { n: results.length }, lang);

  return (
    <div className={`space-y-5 ${props.className ?? ""}`}>
      {/* ---- Search + filters ---- */}
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
            className="min-h-11 w-full rounded-lg border border-gold/60 bg-white px-3 py-2 pr-11 text-base text-ink placeholder:text-ink/60"
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

        {allKinds.length > 1 && (
          <div role="group" aria-label={t.filters.label} className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={kinds.size === 0}
              onClick={props.onClearFilters}
              className={`${CHIP} ${kinds.size === 0 ? "bg-crimson text-white ring-crimson" : "bg-white text-ink ring-gold/50 hover:bg-sand"}`}
            >
              {t.filters.all}
            </button>
            {allKinds.map((kind) => (
              <button
                key={kind}
                type="button"
                aria-pressed={kinds.has(kind)}
                onClick={() => props.onToggleKind(kind)}
                className={`${CHIP} ${kinds.has(kind) ? "bg-crimson text-white ring-crimson" : "bg-white text-ink ring-gold/50 hover:bg-sand"}`}
              >
                {t.kinds[kind]}
              </button>
            ))}
          </div>
        )}
        {filtersActive && (
          <button
            type="button"
            onClick={props.onClearFilters}
            className="mt-2 min-h-11 font-bold text-crimson underline underline-offset-4 hover:text-brick"
          >
            {t.filters.clear}
          </button>
        )}
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

      {/* ---- Walking route ---- */}
      {route && (
        <section aria-labelledby="map-route-title" className="rounded-xl bg-sand p-3 ring-1 ring-gold/50">
          <h2 id="map-route-title" className="text-2xl font-bold">
            {route.name}
          </h2>
          {route.intro && <p className="mt-1 text-sm">{route.intro}</p>}
          <h3 className="mt-3 text-sm font-bold text-brick">{t.route.stops}</h3>
          <ol className="mt-1 space-y-1">
            {route.stops.map((id, index) => {
              const place = places.find((p) => p.id === id);
              if (!place) return null;
              const current = routeActive && index === routeStep;
              const done = routeActive && index < routeStep;
              const status =
                index === 0 ? t.route.startPoint : index === route.stops.length - 1 ? t.route.lastStop : null;
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-current={current ? "step" : undefined}
                    onClick={() => props.onSelectStop(index)}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-1 text-left ${
                      current ? "bg-crimson text-white" : done ? "bg-white/60 text-ink/70" : "bg-white text-ink hover:bg-cream"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        current ? "bg-white text-crimson" : "bg-ink text-white"
                      }`}
                    >
                      {done ? "✓" : formatNumber(index + 1, lang)}
                    </span>
                    <span>
                      <span className="block font-bold">{place.name}</span>
                      {status && <span className="block text-xs opacity-80">{status}</span>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          {route.legs.some((leg) => !leg.walking) && <p className="mt-3 text-sm">{t.route.note}</p>}
          {route.walkingSource && <p className="mt-1 text-xs">{fill(t.route.source, { source: route.walkingSource })}</p>}

          {routeActive && (
            <>
              <RouteNav
                route={route}
                places={places}
                step={routeStep}
                labels={labels}
                lang={lang}
                onPrevious={props.onRoutePrevious}
                onNext={props.onRouteNext}
                onOverview={props.onRouteOverview}
              />
              <button
                type="button"
                onClick={props.onExitRoute}
                className="mt-2 min-h-11 w-full rounded-lg px-3 py-2 font-bold text-brick underline underline-offset-4 hover:text-crimson"
              >
                {t.route.exit}
              </button>
            </>
          )}
        </section>
      )}

      <MapLegend
        kinds={allKinds}
        hasRoute={route !== null}
        hasStraightLeg={route?.legs.some((leg) => !leg.walking) ?? false}
        labels={labels}
      />
    </div>
  );
}
