"use client";

import type { MapPlace, MapRoute } from "@/components/map/types";
import { fill, formatDistance, formatMinutes } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface RouteNavProps {
  route: MapRoute;
  places: MapPlace[];
  /** Index of the current stop; -1 = route overview. */
  step: number;
  labels: Dictionary["map"];
  lang: Locale;
  onPrevious: () => void;
  onNext: () => void;
  onOverview: () => void;
  /** Compact: used on the map and in the detail panel, where space is tight. */
  compact?: boolean;
}

const BUTTON =
  "min-h-11 rounded-lg px-3 py-2 font-bold disabled:cursor-not-allowed disabled:opacity-40";

/** Previous stop / Next stop / Route overview, plus "stop 2 of 5", stops remaining and the next leg. */
export default function RouteNav({ route, places, step, labels, lang, onPrevious, onNext, onOverview, compact = false }: RouteNavProps) {
  const t = labels.route;
  const total = route.stops.length;
  const current = step >= 0 ? places.find((place) => place.id === route.stops[step]) : undefined;
  const remaining = total - (step + 1);
  const leg = step >= 0 && step < route.legs.length ? route.legs[step] : undefined;
  const nextName = leg ? places.find((place) => place.id === leg.to)?.name : undefined;

  let legText: string | null = null;
  if (leg) {
    const distance = formatDistance(leg.distanceMeters, lang, labels.units);
    legText =
      leg.walking && leg.durationSeconds
        ? fill(t.walkingDistance, { distance, minutes: formatMinutes(leg.durationSeconds, lang) })
        : fill(t.straightLine, { distance });
  }

  return (
    <div className={`rounded-xl bg-white p-3 text-ink shadow-md ring-1 ring-gold/50 ${compact ? "" : "mt-3"}`}>
      <p aria-live="polite" className="text-sm">
        <span className="font-bold text-brick">
          {current ? fill(t.stopOf, { n: step + 1, total }) : t.overviewState}
        </span>
        {current && <span> · {current.name}</span>}
        <span className="block text-ink/80">
          {remaining > 0 ? fill(remaining === 1 ? t.remaining.one : t.remaining.other, { n: remaining }) : t.finished}
        </span>
        {legText && nextName && (
          <span className="block text-ink/80">
            {t.toNext} {nextName} — {legText}
          </span>
        )}
      </p>
      <div className="mt-2 grid grid-cols-[1fr_1fr] gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={step <= 0}
          className={`${BUTTON} bg-sand text-brick hover:bg-gold/30`}
        >
          <span aria-hidden="true">← </span>
          {t.previous}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={step >= total - 1}
          className={`${BUTTON} bg-crimson text-white hover:bg-brick`}
        >
          {t.next}
          <span aria-hidden="true"> →</span>
        </button>
      </div>
      <button
        type="button"
        onClick={onOverview}
        className="mt-2 min-h-11 w-full rounded-lg px-3 py-2 font-bold text-crimson underline underline-offset-4 hover:text-brick"
      >
        {t.overview}
      </button>
    </div>
  );
}
