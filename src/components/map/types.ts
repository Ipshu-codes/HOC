// Types shared by the map components. Plain data only (no zod, no server code), so the browser bundle stays small.

export type PlaceKind = "heritage" | "office";

/** One h2 section of a heritage page (History, Legends & Beliefs, …), as HTML rendered from our own markdown. */
export interface PlaceSection {
  id: string;
  title: string;
  html: string;
}

export interface PlacePhoto {
  /** Small (640 px) file for the strip. */
  src: string;
  width: number;
  height: number;
  alt: string;
}

export interface PlaceDetails {
  facts: { label: string; value: string }[];
  sections: PlaceSection[];
  photos: PlacePhoto[];
  sources: { key: string; label: string; url?: string }[];
  galleryHref: string;
  credit: string | null;
}

export interface MapPlace {
  id: string;
  kind: PlaceKind;
  /** Name in the page language. */
  name: string;
  /** Name in the other language, so every place is shown in Nepali and English. */
  nameAlt: string;
  /** [lat, lng] as stored in content. */
  coordinates: [number, number];
  summary?: string;
  href?: string;
  photo?: { src: string; alt: string };
  approximate?: boolean;
  details?: PlaceDetails;
  contact?: { address: string; phone: string; phoneHref: string; email: string };
}

export interface RouteLeg {
  from: string;
  to: string;
  /** [lat, lng] points. A straight two-point line when no walking path has been fetched. */
  path: [number, number][];
  /** true only when the path and numbers come from pedestrian-routing data. */
  walking: boolean;
  /** Walking distance, or the straight-line distance when `walking` is false. */
  distanceMeters: number;
  /** Only present for walking legs; never estimated. */
  durationSeconds: number | null;
}

export interface MapRoute {
  id: string;
  name: string;
  intro?: string;
  /** Visible stops in suggested order (place ids). Always at least two. */
  stops: string[];
  /** legs[i] joins stops[i] and stops[i + 1]. */
  legs: RouteLeg[];
  walkingSource?: string;
}
