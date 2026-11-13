import type { PlaceKind } from "@/components/map/types";
import type { Dictionary } from "@/lib/i18n";

interface MapLegendProps {
  kinds: PlaceKind[];
  hasRoute: boolean;
  /** true when at least one leg is a straight line rather than a real walking path. */
  hasStraightLeg: boolean;
  labels: Dictionary["map"];
}

const PIN = "inline-block size-4 shrink-0 rounded-full rounded-br-none border-2 border-white shadow rotate-45";

/** Explains the marker colours, the selected state and the route line. Only lists what is on this map. */
export default function MapLegend({ kinds, hasRoute, hasStraightLeg, labels }: MapLegendProps) {
  const t = labels.legend;
  return (
    <section aria-labelledby="map-legend-title" className="rounded-xl bg-white p-3 ring-1 ring-gold/50">
      <h3 id="map-legend-title" className="font-heading text-lg font-bold text-brick">
        {t.heading}
      </h3>
      <ul className="mt-2 space-y-2 text-sm">
        {kinds.map((kind) => (
          <li key={kind} className="flex items-center gap-3">
            <span aria-hidden="true" className={`${PIN} ${kind === "office" ? "bg-brick" : "bg-crimson"}`} />
            {labels.kinds[kind]}
          </li>
        ))}
        <li className="flex items-center gap-3">
          <span aria-hidden="true" className={`${PIN} scale-125 border-gold bg-brick ring-2 ring-ink`} />
          {t.selected}
        </li>
        {hasRoute && (
          <>
            <li className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-5 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white"
              >
                1
              </span>
              {t.routeStop}
            </li>
            <li className="flex items-center gap-3">
              <svg aria-hidden="true" width="24" height="8" className="shrink-0">
                <line x1="0" y1="4" x2="24" y2="4" stroke="#8b1e1e" strokeWidth="4" strokeLinecap="round" />
              </svg>
              {t.routeLine}
            </li>
            {hasStraightLeg && (
              <li className="flex items-center gap-3">
                <svg aria-hidden="true" width="24" height="8" className="shrink-0">
                  <line x1="0" y1="4" x2="24" y2="4" stroke="#8b1e1e" strokeWidth="4" strokeDasharray="4 4" />
                </svg>
                {t.routeStraight}
              </li>
            )}
          </>
        )}
      </ul>
    </section>
  );
}
