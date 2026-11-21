"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";

import type { MapPlace } from "@/components/map/types";
import type { Dictionary } from "@/lib/i18n";
import type { ChatEntry } from "@/types/faq";
import type { Locale } from "@/types/locale";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sand" />,
});

interface ChatLocationMapProps {
  location: NonNullable<ChatEntry["location"]>;
  locationLabel: string;
  labels: Dictionary["map"];
  lang: Locale;
}

function noOperation() {}

/** A focused, compact map that is only loaded when a location answer is shown. */
export default function ChatLocationMap({ location, locationLabel, labels, lang }: ChatLocationMapProps) {
  const places = useMemo<MapPlace[]>(() => [location], [location]);
  const visibleIds = useMemo(() => new Set([location.id]), [location.id]);

  return (
    <div aria-label={locationLabel} className="mt-2 h-44 w-full min-w-0 overflow-hidden rounded-lg ring-1 ring-gold/50">
      <MapView
        places={places}
        focusId={location.id}
        visibleIds={visibleIds}
        route={null}
        detailOpen={false}
        onSelect={noOperation}
        onOpenDetail={noOperation}
        onResetView={noOperation}
        labels={labels}
        lang={lang}
        compact
      />
    </div>
  );
}
