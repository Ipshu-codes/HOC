"use client";

/**
 * The 3D map, built with MapLibre GL JS (https://maplibre.org), a free,
 * open-source WebGL map library (the community fork of Mapbox GL, no API key).
 *
 * How it fits together:
 * - The *style* (OpenFreeMap "liberty") describes the base map: which vector tiles
 *   to load and how to draw roads, labels and buildings. It already includes a
 *   "building-3d" layer that extrudes buildings by height from zoom 14.
 * - *Terrain* comes from AWS Terrain Tiles (open data). Each PNG tile encodes
 *   elevation in its colours ("terrarium" encoding); MapLibre turns that into a
 *   3D surface with map.setTerrain().
 * - *Markers* are ordinary DOM elements (here <button>s) pinned to lng/lat;
 *   *popups* are DOM boxes opened by us (see the note below).
 * - The *walking route* is a GeoJSON source drawn by two line layers (a solid one for
 *   real walking paths, a dashed one for straight lines between stops). MapLibre drapes
 *   them over the terrain.
 *
 * What this component does NOT own: which place is selected, the search/filter state and
 * the walking-route step. MapExplorer holds those and passes them in as props; this
 * component only draws them (marker highlight, numbered route stops, camera moves).
 *
 * MapLibre needs `window` and WebGL, so this component is loaded with
 * next/dynamic({ ssr: false }) from MapExplorer and never runs at build time.
 * Coordinates in content are [lat, lng]; MapLibre wants [lng, lat].
 */
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

import type { MapPlace, MapRoute } from "@/components/map/types";
import { fill } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

export type { MapPlace } from "@/components/map/types";

interface MapViewProps {
  places: MapPlace[];
  /** Selected place (from ?site=, the list, a marker or the route). Highlighted, flown to, popup shown. */
  focusId: string | null;
  /** Places that pass the current search and filters; the others are hidden. */
  visibleIds: ReadonlySet<string>;
  route: MapRoute | null;
  /** true while the visitor is walking the route step by step. */
  routeActive: boolean;
  /** Index of the current stop in route.stops; -1 = route overview. */
  routeStep: number;
  /** Increase to ask the map to zoom out to the whole route. */
  fitRouteSignal: number;
  /** While the detail panel is open the popup is hidden and the camera leaves room for the panel. */
  detailOpen: boolean;
  onSelect: (id: string) => void;
  onOpenDetail: (id: string) => void;
  /** The "reset view" button was used: the parent clears the selection. */
  onResetView: () => void;
  labels: Dictionary["map"];
  lang: Locale;
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const TERRAIN_TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const TERRAIN_ATTRIBUTION =
  'Terrain: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a> (Mapzen)';
/** Only used if no place has coordinates: OpenStreetMap's "Naya Bazar, Kathmandu-16". */
const FALLBACK_CENTER: [number, number] = [85.3075, 27.7216];
const START_VIEW = { zoom: 16, pitch: 60, bearing: -20 };
const ROUTE_SOURCE = "walking-route";
const ROUTE_COLORS = { done: "#b9a79b", active: "#c8102e", todo: "#8b1e1e" }; // sand-grey, crimson, brick

/** WebGL check, done before creating the map (MapLibre cannot draw without it). */
function hasWebGL(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
}

const toLngLat = ([lat, lng]: [number, number]): [number, number] => [lng, lat];

/** Popup content built with DOM methods (textContent), so no text from content is parsed as HTML. */
function popupContent(place: MapPlace, labels: Dictionary["map"], lang: Locale, onOpen: () => void): HTMLElement {
  const root = document.createElement("div");
  root.className = "map-popup";
  if (place.photo) {
    const img = document.createElement("img");
    img.src = place.photo.src;
    img.alt = place.photo.alt;
    img.width = 640;
    img.height = 480;
    root.append(img);
  }
  const names = document.createElement("div");
  names.className = "map-popup-names";
  const title = document.createElement("p");
  title.className = "map-popup-title";
  title.textContent = place.name;
  const alt = document.createElement("p");
  alt.lang = lang === "ne" ? "en" : "ne";
  alt.className = "text-sm";
  alt.textContent = place.nameAlt;
  names.append(title, alt);
  root.append(names);

  const kind = document.createElement("span");
  kind.className = "map-popup-kind";
  kind.textContent = labels.kinds[place.kind];
  root.append(kind);
  if (place.approximate) {
    const note = document.createElement("p");
    note.className = "map-popup-note";
    note.textContent = labels.approximate;
    root.append(note);
  }
  if (place.summary) {
    const summary = document.createElement("p");
    summary.className = "map-popup-summary";
    summary.textContent = place.summary;
    root.append(summary);
  }
  // Places with a story (heritage sites) open the detail panel; the ward office has no story.
  if (place.details) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-popup-btn";
    button.textContent = labels.detail.viewStory;
    button.addEventListener("click", onOpen);
    root.append(button);
  }
  return root;
}

/** A button in MapLibre's control stack that returns the camera to where the map started. */
class ResetViewControl implements maplibregl.IControl {
  private container: HTMLDivElement | null = null;
  private readonly label: string;
  private readonly onClick: () => void;

  constructor(label: string, onClick: () => void) {
    this.label = label;
    this.onClick = onClick;
  }

  onAdd(): HTMLElement {
    const container = document.createElement("div");
    container.className = "maplibregl-ctrl maplibregl-ctrl-group";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "map-ctrl-btn";
    button.title = this.label;
    button.setAttribute("aria-label", this.label);
    // A small "home" icon.
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("aria-hidden", "true");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M12 3 2 12h3v8h5v-6h4v6h5v-8h3z");
    path.setAttribute("fill", "currentColor");
    svg.append(path);
    button.append(svg);
    button.addEventListener("click", this.onClick);
    container.append(button);
    this.container = container;
    return container;
  }

  onRemove(): void {
    this.container?.remove();
    this.container = null;
  }
}

interface MarkerEntry {
  element: HTMLButtonElement;
}

export default function MapView({
  places,
  focusId,
  visibleIds,
  route,
  routeActive,
  routeStep,
  fitRouteSignal,
  detailOpen,
  onSelect,
  onOpenDetail,
  onResetView,
  labels,
  lang,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupsRef = useRef(new Map<string, maplibregl.Popup>());
  const markersRef = useRef(new Map<string, MarkerEntry>());
  const prevFocusRef = useRef<string | null>(null);
  const readyRef = useRef(false);
  // Latest callbacks, read by handlers that were created once with the map.
  const onSelectRef = useRef(onSelect);
  const onOpenDetailRef = useRef(onOpenDetail);
  const onResetViewRef = useRef(onResetView);
  useEffect(() => {
    onSelectRef.current = onSelect;
    onOpenDetailRef.current = onOpenDetail;
    onResetViewRef.current = onResetView;
  }, [onSelect, onOpenDetail, onResetView]);
  // This component only ever runs in the browser (ssr: false), so document is available here.
  const [supported] = useState(hasWebGL);
  /** true once the style and terrain have loaded; camera animations wait for it. */
  const [ready, setReady] = useState(false);
  /** true once the route source and layers exist. */
  const [styleReady, setStyleReady] = useState(false);

  // Create the map once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const popups = popupsRef.current;
    const markers = markersRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const focusPlace = places.find((place) => place.id === focusId);
    const start = focusPlace ?? places.find((place) => place.kind === "office") ?? places[0];
    const startCenter = start ? toLngLat(start.coordinates) : FALLBACK_CENTER;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container,
        style: STYLE_URL,
        center: startCenter,
        ...START_VIEW, // tilted so terrain and 3D buildings are visible
        maxPitch: 75,
        attributionControl: { compact: false, customAttribution: TERRAIN_ATTRIBUTION },
        // Translated labels for the canvas and the built-in buttons (screen readers read these).
        locale: {
          "Map.Title": labels.mapLabel,
          "NavigationControl.ZoomIn": labels.controls.zoomIn,
          "NavigationControl.ZoomOut": labels.controls.zoomOut,
          "NavigationControl.ResetBearing": labels.controls.resetBearing,
          "FullscreenControl.Enter": labels.controls.fullscreenEnter,
          "FullscreenControl.Exit": labels.controls.fullscreenExit,
          "GeolocateControl.FindMyLocation": labels.controls.locate,
          "GeolocateControl.LocationNotAvailable": labels.controls.locateUnavailable,
          "Popup.Close": labels.controls.closePopup,
        },
      });
    } catch {
      container.textContent = labels.noWebGL; // e.g. WebGL blocked or out of memory
      return;
    }
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    // Asks the browser for permission only when the visitor presses the button.
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: false,
        showUserLocation: true,
      }),
      "top-right",
    );
    map.addControl(
      new ResetViewControl(labels.controls.resetView, () => {
        if (!readyRef.current) return;
        for (const popup of popups.values()) popup.remove();
        onResetViewRef.current();
        const target = { center: startCenter, ...START_VIEW };
        if (reduceMotion) map.jumpTo(target);
        else map.flyTo({ ...target, duration: 2000, essential: true });
      }),
      "top-right",
    );
    map.addControl(new maplibregl.FullscreenControl(), "top-right");

    // The map container changes size when the detail panel opens or the window rotates.
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);

    map.on("load", () => {
      // Elevation tiles → 3D terrain. Exaggerate a little; the valley floor is fairly flat.
      map.addSource("terrain", {
        type: "raster-dem",
        tiles: [TERRAIN_TILES],
        encoding: "terrarium",
        tileSize: 256,
        maxzoom: 15,
      });
      map.setTerrain({ source: "terrain", exaggeration: 1.3 });

      // Walking route: empty until the effect below fills it. "state" (done/active/todo) and
      // "walking" (real path vs straight line) are properties of each leg.
      map.addSource(ROUTE_SOURCE, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
      const color = ["match", ["get", "state"], "active", ROUTE_COLORS.active, "done", ROUTE_COLORS.done, ROUTE_COLORS.todo];
      const width = ["match", ["get", "state"], "active", 6, 4];
      map.addLayer({
        id: "route-casing",
        type: "line",
        source: ROUTE_SOURCE,
        filter: ["==", ["get", "walking"], true],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#ffffff", "line-width": 9, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: "route-walking",
        type: "line",
        source: ROUTE_SOURCE,
        filter: ["==", ["get", "walking"], true],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": color as never, "line-width": width as never },
      });
      map.addLayer({
        id: "route-straight",
        type: "line",
        source: ROUTE_SOURCE,
        filter: ["==", ["get", "walking"], false],
        layout: { "line-join": "round" },
        paint: { "line-color": color as never, "line-width": width as never, "line-dasharray": [1.5, 1.5] },
      });
      setStyleReady(true);

      // Camera animations must wait until the terrain has loaded ("idle"): animating while
      // the elevation is still unknown makes MapLibre recompute the camera against flat
      // ground, and at ~1,300 m in the Kathmandu valley it ends up inside the terrain
      // (blank map). "ready" also releases a pending fly-to from ?site= (effect below).
      map.once("idle", () => {
        readyRef.current = true;
        setReady(true);
        // Slow turn on arrival (skipped for reduced-motion users or when jumping to a place).
        // Zoom and pitch are held explicitly; any drag, zoom or click stops the turn.
        if (!reduceMotion && !focusPlace) {
          map.easeTo({
            bearing: map.getBearing() + 60,
            zoom: map.getZoom(),
            pitch: map.getPitch(),
            duration: 20000,
            easing: (t) => t,
          });
        }
      });
    });

    for (const place of places) {
      // A real <button>, so markers can be reached with Tab and opened with Enter.
      const element = document.createElement("button");
      element.type = "button";
      element.className = place.kind === "office" ? "map-marker map-marker-office" : "map-marker";
      element.setAttribute("aria-label", place.name);
      markers.set(place.id, { element });

      // The popup is deliberately NOT bound with marker.setPopup(): MapLibre closes a bound popup
      // whenever its terrain-depth test decides the marker is hidden behind terrain, and that
      // test misfires on this valley terrain. We open popups ourselves instead.
      // anchor "bottom": the popup always opens above the pin (the camera leaves room for it).
      const popup = new maplibregl.Popup({ offset: 34, maxWidth: "17rem", anchor: "bottom" })
        .setLngLat(toLngLat(place.coordinates))
        .setDOMContent(popupContent(place, labels, lang, () => onOpenDetailRef.current(place.id)));
      popups.set(place.id, popup);
      element.addEventListener("click", (event) => {
        event.stopPropagation(); // a click on the map itself would close the popup again
        for (const other of popups.values()) other.remove();
        popup.addTo(map);
        onSelectRef.current(place.id);
      });

      new maplibregl.Marker({ element, anchor: "bottom", opacityWhenCovered: "1" })
        .setLngLat(toLngLat(place.coordinates))
        .addTo(map);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapRef.current = null;
      readyRef.current = false;
      popups.clear();
      markers.clear();
    };
    // The map is created once; everything that changes later is handled by the effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marker look: selected highlight, hidden by search/filter, route step number.
  useEffect(() => {
    for (const [id, { element }] of markersRef.current) {
      const place = places.find((p) => p.id === id);
      const selected = id === focusId;
      element.classList.toggle("map-marker-selected", selected);
      element.setAttribute("aria-pressed", String(selected));
      element.classList.toggle("map-marker-hidden", !visibleIds.has(id));
      const index = route ? route.stops.indexOf(id) : -1;
      if (index >= 0 && route) {
        element.setAttribute("data-step", String(index + 1));
        element.setAttribute(
          "aria-label",
          `${place?.name ?? ""} — ${fill(labels.route.stopOf, { n: index + 1, total: route.stops.length })}`,
        );
      } else {
        element.removeAttribute("data-step");
        element.setAttribute("aria-label", place?.name ?? "");
      }
    }
  }, [focusId, visibleIds, route, places, labels]);

  // Draw the route line; the leg to walk next is highlighted, finished legs are greyed.
  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;
    if (!map || !source || !styleReady) return;
    source.setData({
      type: "FeatureCollection",
      features: (route?.legs ?? []).map((leg, i) => ({
        type: "Feature" as const,
        properties: {
          walking: leg.walking,
          state: routeActive ? (i === routeStep ? "active" : i < routeStep ? "done" : "todo") : "todo",
        },
        geometry: { type: "LineString" as const, coordinates: leg.path.map(toLngLat) },
      })),
    });
  }, [route, routeActive, routeStep, styleReady]);

  // Fly to the focused place. With the detail panel closed, open its popup; with it open, no popup.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    for (const popup of popupsRef.current.values()) popup.remove();
    const place = places.find((p) => p.id === focusId);
    if (!place) {
      prevFocusRef.current = null;
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mobile = window.matchMedia("(max-width: 1023px)").matches;
    // offset: where the place sits relative to the centre of the view.
    //  - popup open: below centre, leaving room for the popup above the pin;
    //  - panel open on a phone: above centre, because the panel covers the bottom of the screen;
    //  - panel open on a desktop: centre the place in the available map area.
    const offset: [number, number] = detailOpen
      ? mobile
        ? [0, -Math.round(map.getContainer().clientHeight * 0.22)]
        : [0, 0]
      : [0, 140];
    const target = { center: toLngLat(place.coordinates), zoom: 17.5, pitch: 60, offset };
    const changed = prevFocusRef.current !== place.id;
    prevFocusRef.current = place.id;
    if (reduceMotion) map.jumpTo(target);
    else map.flyTo({ ...target, duration: changed ? 2500 : 900, essential: true });
    if (!detailOpen) popupsRef.current.get(place.id)?.addTo(map);
  }, [focusId, places, ready, detailOpen]);

  // "Route overview": zoom out so every stop is in view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !route || fitRouteSignal === 0) return;
    const bounds = new maplibregl.LngLatBounds();
    for (const id of route.stops) {
      const place = places.find((p) => p.id === id);
      if (place) bounds.extend(toLngLat(place.coordinates));
    }
    for (const popup of popupsRef.current.values()) popup.remove();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.fitBounds(bounds, { padding: 90, maxZoom: 17, pitch: 45, bearing: 0, duration: reduceMotion ? 0 : 1800, essential: true });
    // Only when the overview is requested (or the map becomes ready after a request).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitRouteSignal, ready]);

  if (!supported) {
    return <p className="flex h-full items-center justify-center bg-sand p-6 text-center text-lg">{labels.noWebGL}</p>;
  }
  // MapLibre gives its own canvas role="region" with labels.mapLabel (see locale above).
  return <div ref={containerRef} className="h-full w-full" />;
}
