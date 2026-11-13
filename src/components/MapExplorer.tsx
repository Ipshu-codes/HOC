"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import MapSidebar from "@/components/map/MapSidebar";
import PlaceDetailPanel from "@/components/map/PlaceDetailPanel";
import RouteNav from "@/components/map/RouteNav";
import type { MapPlace, MapRoute, PlaceKind } from "@/components/map/types";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

// MapLibre uses window/WebGL, so it is loaded only in the browser (never prerendered),
// and only on this page: its ~800 KB of JavaScript is not part of any other page.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sand" />,
});

interface MapExplorerProps {
  places: MapPlace[];
  route: MapRoute | null;
  labels: Dictionary["map"];
  lang: Locale;
  /** Place id requested in the URL (?site=…), see MapExplorerFromUrl. */
  requestedId?: string | null;
}

/** Reads ?site= from the URL. Must sit inside <Suspense> (static export requirement). */
export function MapExplorerFromUrl(props: Omit<MapExplorerProps, "requestedId">) {
  const searchParams = useSearchParams();
  return <MapExplorer {...props} requestedId={searchParams.get("site")} />;
}

/** Lower-cases and normalises text so "Nanak Math" and "nanak math" match; Nepali is unaffected. */
const normalise = (text: string) => text.normalize("NFC").toLocaleLowerCase().trim();

const isPhone = () => window.matchMedia("(max-width: 1023px)").matches;

/**
 * The heritage map page: sidebar (search, filters, places, walking route, legend), the 3D map,
 * and a detail panel. This component owns all the state; MapView only draws it.
 *   selectedId  which place is highlighted / flown to
 *   detailOpen  whether its full story is open
 *   routeActive + routeStep  the step-by-step walk (-1 = overview)
 */
export default function MapExplorer({ places, route, labels, lang, requestedId = null }: MapExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    places.some((place) => place.id === requestedId) ? requestedId : null,
  );
  const [detailOpen, setDetailOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [kinds, setKinds] = useState<ReadonlySet<PlaceKind>>(new Set());
  const [routeActive, setRouteActive] = useState(false);
  const [routeStep, setRouteStep] = useState(-1);
  const [fitSignal, setFitSignal] = useState(0);
  const mapWrapRef = useRef<HTMLDivElement>(null);

  // ---- search + filters (work on the same place data the markers use, in both languages) ----
  const results = useMemo(() => {
    const q = normalise(query);
    return places.filter(
      (place) =>
        (kinds.size === 0 || kinds.has(place.kind)) &&
        (q === "" || normalise(place.name).includes(q) || normalise(place.nameAlt).includes(q)),
    );
  }, [places, query, kinds]);

  // Markers shown on the map: the search results, plus every route stop while walking the route.
  const visibleIds = useMemo(() => {
    const ids = new Set(results.map((place) => place.id));
    if (routeActive && route) for (const id of route.stops) ids.add(id);
    return ids;
  }, [results, routeActive, route]);

  const selectedPlace = places.find((place) => place.id === selectedId) ?? null;
  const stops = useMemo(() => route?.stops ?? [], [route]);

  /** On phones the map sits above the controls: bring it back into view after a choice. */
  const showMap = useCallback(() => {
    if (isPhone()) mapWrapRef.current?.scrollIntoView({ block: "start" });
  }, []);

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      if (routeActive) setRouteStep(stops.indexOf(id)); // -1 when it is not a stop → overview state
    },
    [routeActive, stops],
  );

  const selectFromList = useCallback(
    (id: string) => {
      select(id);
      showMap();
    },
    [select, showMap],
  );

  const openDetail = useCallback(
    (id: string) => {
      select(id);
      setDetailOpen(true);
      showMap();
    },
    [select, showMap],
  );

  // ---- walking route ----
  const goToStop = useCallback(
    (index: number) => {
      const id = stops[index];
      if (!id) return;
      setRouteActive(true);
      setRouteStep(index);
      setSelectedId(id);
      showMap();
    },
    [stops, showMap],
  );

  const routeOverview = useCallback(() => {
    setRouteStep(-1);
    setSelectedId(null);
    setDetailOpen(false);
    setFitSignal((n) => n + 1);
    showMap();
  }, [showMap]);

  const exitRoute = useCallback(() => {
    setRouteActive(false);
    setRouteStep(-1);
  }, []);

  const resetView = useCallback(() => {
    setSelectedId(null);
    setDetailOpen(false);
    setRouteStep(-1);
  }, []);

  const toggleKind = useCallback((kind: PlaceKind) => {
    setKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setKinds(new Set());
  }, []);

  // Escape closes the detail panel.
  useEffect(() => {
    if (!detailOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDetailOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [detailOpen]);

  const routeNav =
    route && routeActive ? (
      <RouteNav
        route={route}
        places={places}
        step={routeStep}
        labels={labels}
        lang={lang}
        compact
        onPrevious={() => goToStop(routeStep - 1)}
        onNext={() => goToStop(routeStep + 1)}
        onOverview={routeOverview}
      />
    ) : null;

  const showDetail = detailOpen && selectedPlace !== null;

  return (
    <>
      {route && !routeActive && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => goToStop(0)}
            className="min-h-11 w-full rounded-lg bg-crimson px-4 py-2 font-bold text-white hover:bg-brick sm:w-auto"
          >
            {labels.route.start}
          </button>
        </div>
      )}

      <div
        className={`flex flex-col gap-4 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-6 ${
          showDetail ? "2xl:grid-cols-[19rem_minmax(0,1fr)_25rem]" : ""
        }`}
      >
        <MapSidebar
          className="order-2 lg:order-1 lg:max-h-[75vh] lg:overflow-y-auto lg:pr-1"
          places={places}
          results={results}
          selectedId={selectedId}
          query={query}
          kinds={kinds}
          onQueryChange={setQuery}
          onToggleKind={toggleKind}
          onClearFilters={clearFilters}
          onSelect={selectFromList}
          route={route}
          routeActive={routeActive}
          routeStep={routeStep}
          onExitRoute={exitRoute}
          onRoutePrevious={() => goToStop(routeStep - 1)}
          onRouteNext={() => goToStop(routeStep + 1)}
          onRouteOverview={routeOverview}
          onSelectStop={goToStop}
          labels={labels}
          lang={lang}
        />

        <div
          ref={mapWrapRef}
          className="relative order-1 h-[60dvh] min-h-80 scroll-mt-20 overflow-hidden rounded-xl shadow-md ring-1 ring-gold/50 lg:order-2 lg:h-[75vh]"
        >
          <MapView
            places={places}
            focusId={selectedId}
            visibleIds={visibleIds}
            route={route}
            routeActive={routeActive}
            routeStep={routeStep}
            fitRouteSignal={fitSignal}
            detailOpen={showDetail}
            onSelect={select}
            onOpenDetail={openDetail}
            onResetView={resetView}
            labels={labels}
            lang={lang}
          />
          {/* Phones: step controls on the map while the detail sheet is closed (desktop has them in the sidebar). */}
          {routeNav && !showDetail && <div className="absolute inset-x-2 bottom-2 lg:hidden">{routeNav}</div>}
        </div>

        {showDetail && selectedPlace && (
          <div className="order-3 lg:col-start-2 2xl:col-start-3">
            <PlaceDetailPanel
              place={selectedPlace}
              labels={labels}
              lang={lang}
              onClose={() => setDetailOpen(false)}
              footer={routeNav}
            />
          </div>
        )}
      </div>
    </>
  );
}
