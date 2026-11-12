"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import type { MapPlace } from "@/components/MapView";
import type { Dictionary } from "@/lib/i18n";

// MapLibre uses window/WebGL, so it is loaded only in the browser (never prerendered),
// and only on this page: its ~800 KB of JavaScript is not part of any other page.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sand" />,
});

interface MapExplorerProps {
  places: MapPlace[];
  labels: Dictionary["map"];
  /** Place id requested in the URL (?site=…), see MapExplorerFromUrl. */
  requestedId?: string | null;
}

/** Reads ?site= from the URL. Must sit inside <Suspense> (static export requirement). */
export function MapExplorerFromUrl(props: Omit<MapExplorerProps, "requestedId">) {
  const searchParams = useSearchParams();
  return <MapExplorer {...props} requestedId={searchParams.get("site")} />;
}

/** Side panel listing the places + the map. Clicking a place flies the map to it. */
export default function MapExplorer({ places, labels, requestedId = null }: MapExplorerProps) {
  const [focusId, setFocusId] = useState<string | null>(
    places.some((place) => place.id === requestedId) ? requestedId : null,
  );

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
                aria-label={labels.showOnMap.replace("{name}", place.name)}
                onClick={() => setFocusId(place.id)}
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

      <div className="order-1 h-[65vh] min-h-80 overflow-hidden rounded-xl shadow-md ring-1 ring-gold/50 lg:order-2 lg:h-[75vh]">
        <MapView places={places} focusId={focusId} onSelect={setFocusId} labels={labels} />
      </div>
    </div>
  );
}
