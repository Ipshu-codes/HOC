"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import MapSidebar from "@/components/map/MapSidebar";
import PlaceDetailPanel from "@/components/map/PlaceDetailPanel";
import type { MapPlace, MapRoute } from "@/components/map/types";
import { isMobile } from "@/lib/breakpoints";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

/** Still picture shown on phones until the visitor asks for the 3D map (built by optimize-images). */
export interface MapPreview {
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

/**
 * True when the visitor came here from another page of this site: a client-side
 * navigation (the document was first loaded at another path, e.g. the floating
 * 3D Map button, "View on 3D Map" or a chatbot link) or a full page load from one of
 * our pages (same-origin referrer). Then they asked for the map, so it loads at once.
 */
function cameFromThisSite(): boolean {
  const [entry] = performance.getEntriesByType("navigation");
  if (entry && new URL(entry.name).pathname !== window.location.pathname) return true;
  try {
    return document.referrer !== "" && new URL(document.referrer).origin === window.location.origin;
  } catch {
    return false;
  }
}

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
  preview: MapPreview | null;
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

/**
 * The heritage map page: sidebar (search and places), the 3D map, and a detail panel.
 * This component owns all the state; MapView only draws it.
 *   selectedId  which place is highlighted / flown to
 *   detailOpen  whether its full story is open
 */
export default function MapExplorer({ places, route, labels, lang, preview, requestedId = null }: MapExplorerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    places.some((place) => place.id === requestedId) ? requestedId : null,
  );
  // The map (~800 KB of JavaScript plus ~3.5 MB of tiles) is the heaviest thing on the site. On mobile
  // screens (MOBILE_QUERY: under 1024 px, where the map sits above the list) a direct visit first shows
  // a still picture and a "Show 3D map" button; null = not decided yet (the prerendered HTML and the
  // first render show the picture). Choosing a place loads it too.
  const [mapOn, setMapOn] = useState<boolean | null>(null);

  // Decided once, right after the first paint (window is not available while prerendering).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMapOn(!isMobile() || cameFromThisSite());
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  const [detailOpen, setDetailOpen] = useState(false);
  const [query, setQuery] = useState("");
  const mapWrapRef = useRef<HTMLDivElement>(null);

  // ---- search (works on the same place data the markers use, in both languages) ----
  const results = useMemo(() => {
    const q = normalise(query);
    return places.filter(
      (place) =>
        q === "" || normalise(place.name).includes(q) || normalise(place.nameAlt).includes(q),
    );
  }, [places, query]);

  // Markers shown on the map are the places that pass the current search.
  const visibleIds = useMemo(() => {
    return new Set(results.map((place) => place.id));
  }, [results]);

  const selectedPlace = places.find((place) => place.id === selectedId) ?? null;

  /** On phones the map sits above the controls: bring it back into view after a choice. */
  const showMap = useCallback(() => {
    if (isMobile()) mapWrapRef.current?.scrollIntoView({ block: "start" });
  }, []);

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
      setMapOn(true);
    },
    [],
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

  const resetView = useCallback(() => {
    setSelectedId(null);
    setDetailOpen(false);
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

  const showDetail = detailOpen && selectedPlace !== null;

  return (
    <div
      className={`flex flex-col gap-4 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6 ${
        showDetail ? "2xl:grid-cols-[15rem_minmax(0,1fr)_25rem]" : ""
      }`}
    >
      <MapSidebar
        // lg:px-1 keeps focus rings visible inside the scrolling list; -mx-1 keeps its text on the content edge.
        className="order-2 lg:order-1 lg:-mx-1 lg:max-h-[80vh] lg:overflow-y-auto lg:px-1"
        results={results}
        selectedId={selectedId}
        query={query}
        onQueryChange={setQuery}
        onSelect={selectFromList}
        labels={labels}
        lang={lang}
      />

      <div
        ref={mapWrapRef}
        className="relative order-1 h-[70dvh] min-h-80 scroll-mt-20 overflow-hidden rounded-xl shadow-md ring-1 ring-gold/50 lg:order-2 lg:h-[80vh]"
      >
        {mapOn ? (
          <MapView
            places={places}
            focusId={selectedId}
            visibleIds={visibleIds}
            route={route}
            detailOpen={showDetail}
            onSelect={select}
            onOpenDetail={openDetail}
            onResetView={resetView}
            labels={labels}
            lang={lang}
          />
        ) : (
          <div className="relative size-full bg-sand">
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element -- static export: no image server
              <img
                src={preview.src}
                srcSet={preview.srcSet}
                sizes="(min-width: 64rem) 80vw, 100vw"
                width={preview.width}
                height={preview.height}
                alt={labels.previewAlt}
                fetchPriority="high"
                className="size-full object-cover"
              />
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/30 p-4 text-center">
              <button
                type="button"
                onClick={() => setMapOn(true)}
                className="rounded-full bg-crimson px-6 py-3 text-lg font-bold text-white shadow-lg ring-2 ring-white hover:bg-brick"
              >
                <span aria-hidden="true">🗺 </span>
                {labels.showMap}
              </button>
              <p className="rounded-md bg-cream/90 px-2 py-1 text-sm text-ink">{labels.showMapNote}</p>
            </div>
          </div>
        )}
      </div>

      {showDetail && selectedPlace && (
        <div className="order-3 lg:col-start-2 2xl:col-start-3">
          <PlaceDetailPanel
            place={selectedPlace}
            labels={labels}
            lang={lang}
            onClose={() => setDetailOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
