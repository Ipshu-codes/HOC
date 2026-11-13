"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { MapPlace } from "@/components/MapView";
import type { Dictionary } from "@/lib/i18n";

/** Still picture shown on phones until the visitor asks for the 3D map (built by optimize-images). */
export interface MapPreview {
  src: string;
  srcSet: string;
  width: number;
  height: number;
}

/** Phones (under 768 px) get the tap-to-load button; larger screens always load the map. */
const PHONE_QUERY = "(max-width: 47.99rem)";

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
  labels: Dictionary["map"];
  preview: MapPreview | null;
  /** Place id requested in the URL (?site=…), see MapExplorerFromUrl. */
  requestedId?: string | null;
}

/** Reads ?site= from the URL. Must sit inside <Suspense> (static export requirement). */
export function MapExplorerFromUrl(props: Omit<MapExplorerProps, "requestedId">) {
  const searchParams = useSearchParams();
  return <MapExplorer {...props} requestedId={searchParams.get("site")} />;
}

/** Side panel listing the places + the map. Clicking a place flies the map to it (loading the map first if needed). */
export default function MapExplorer({ places, labels, preview, requestedId = null }: MapExplorerProps) {
  const [focusId, setFocusId] = useState<string | null>(
    places.some((place) => place.id === requestedId) ? requestedId : null,
  );
  // The map (~800 KB of JavaScript plus tiles) is the heaviest thing on the site. On phones a
  // direct visit first shows a still picture and a "Show 3D map" button; null = not decided yet
  // (the prerendered HTML and the first render show the picture).
  const [showMap, setShowMap] = useState<boolean | null>(null);

  // Decided once, right after the first paint (window is not available while prerendering).
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setShowMap(!window.matchMedia(PHONE_QUERY).matches || cameFromThisSite());
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function select(id: string) {
    setFocusId(id);
    setShowMap(true); // choosing a place in the list also loads the map
  }

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-6">
      <nav aria-label={labels.placesHeading} className="order-2 lg:order-1">
        <h2 className="mb-3 text-2xl font-bold">{labels.placesHeading}</h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          {places.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                aria-pressed={focusId === place.id}
                onClick={() => select(place.id)}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left shadow-sm ring-1 ${
                  focusId === place.id ? "bg-crimson text-white ring-crimson" : "bg-white text-ink ring-gold/50 hover:bg-sand"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`size-4 shrink-0 rounded-full border-2 border-white ${
                    place.kind === "office" ? "bg-brick" : "bg-crimson"
                  } ${focusId === place.id ? "ring-2 ring-white" : ""}`}
                />
                <span>
                  <span className="block font-bold">{place.name}</span>
                  {place.approximate && <span className="block text-sm opacity-80">{labels.approximate}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="relative order-1 h-[65vh] min-h-80 overflow-hidden rounded-xl bg-sand shadow-md ring-1 ring-gold/50 lg:order-2 lg:h-[75vh]">
        {showMap ? (
          <MapView places={places} focusId={focusId} onSelect={setFocusId} labels={labels} />
        ) : (
          <>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element -- static export: no image server
              <img
                src={preview.src}
                srcSet={preview.srcSet}
                sizes="(min-width: 64rem) 75vw, 100vw"
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
                onClick={() => setShowMap(true)}
                className="rounded-full bg-crimson px-6 py-3 text-lg font-bold text-white shadow-lg ring-2 ring-white hover:bg-brick"
              >
                <span aria-hidden="true">🗺 </span>
                {labels.showMap}
              </button>
              <p className="rounded-md bg-cream/90 px-2 py-1 text-sm text-ink">{labels.showMapNote}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
