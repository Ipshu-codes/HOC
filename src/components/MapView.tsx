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
 *   *popups* are DOM boxes attached to them.
 *
 * MapLibre needs `window` and WebGL, so this component is loaded with
 * next/dynamic({ ssr: false }) from MapExplorer and never runs at build time.
 * Coordinates in content are [lat, lng]; MapLibre wants [lng, lat].
 */
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";

import type { Dictionary } from "@/lib/i18n";

export interface MapPlace {
  id: string;
  kind: "heritage" | "office";
  name: string;
  /** [lat, lng] as stored in content. */
  coordinates: [number, number];
  summary?: string;
  href?: string;
  photo?: { src: string; alt: string };
  approximate?: boolean;
}

interface MapViewProps {
  places: MapPlace[];
  /** id of the place to fly to (from ?site= or the side panel). */
  focusId: string | null;
  /** Called when a marker is clicked, so the side panel can show it as selected. */
  onSelect: (id: string) => void;
  labels: Dictionary["map"];
}

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const TERRAIN_TILES = "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png";
const TERRAIN_ATTRIBUTION =
  'Terrain: <a href="https://registry.opendata.aws/terrain-tiles/" target="_blank" rel="noopener">AWS Terrain Tiles</a> (Mapzen)';
/** Only used if no place has coordinates: OpenStreetMap's "Naya Bazar, Kathmandu-16". */
const FALLBACK_CENTER: [number, number] = [85.3075, 27.7216];

/** WebGL check, done before creating the map (MapLibre cannot draw without it). */
function hasWebGL(): boolean {
  const canvas = document.createElement("canvas");
  return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
}

const toLngLat = ([lat, lng]: [number, number]): [number, number] => [lng, lat];

/** Centre of the box around the given [lng, lat] points. */
function midpoint(points: [number, number][]): [number, number] {
  const lngs = points.map(([lng]) => lng);
  const lats = points.map(([, lat]) => lat);
  return [(Math.min(...lngs) + Math.max(...lngs)) / 2, (Math.min(...lats) + Math.max(...lats)) / 2];
}

/** Popup content built with DOM methods (textContent), so no text from content is parsed as HTML. */
function popupContent(place: MapPlace, labels: Dictionary["map"]): HTMLElement {
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
  const title = document.createElement("p");
  title.className = "map-popup-title";
  title.textContent = place.name;
  root.append(title);
  if (place.approximate) {
    const note = document.createElement("p");
    note.className = "map-popup-note";
    note.textContent = labels.approximate;
    root.append(note);
  }
  if (place.summary) {
    const summary = document.createElement("p");
    summary.textContent = place.summary;
    root.append(summary);
  }
  if (place.href) {
    const link = document.createElement("a");
    link.href = place.href;
    link.className = "map-popup-link";
    link.textContent = `${labels.readMore} →`;
    root.append(link);
  }
  return root;
}

export default function MapView({ places, focusId, onSelect, labels }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupsRef = useRef(new Map<string, maplibregl.Popup>());
  // Latest onSelect, read by marker click handlers that were created once with the map.
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  // This component only ever runs in the browser (ssr: false), so document is available here.
  const [supported] = useState(hasWebGL);
  /** true once the style and terrain have loaded; camera animations wait for it. */
  const [ready, setReady] = useState(false);

  // Create the map once.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const popups = popupsRef.current;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const focusPlace = places.find((place) => place.id === focusId);
    // Start on the requested place, or midway between all places (zoomed out a little when there
    // are several) so every marker is in view, also on phones and during the slow turn.
    const start: [number, number] = focusPlace
      ? toLngLat(focusPlace.coordinates)
      : places.length > 0
        ? midpoint(places.map((place) => toLngLat(place.coordinates)))
        : FALLBACK_CENTER;

    let map: maplibregl.Map;
    try {
      map = new maplibregl.Map({
        container,
        style: STYLE_URL,
        center: start,
        zoom: focusPlace || places.length < 2 ? 16 : 15.4,
        pitch: 60, // tilt so terrain and 3D buildings are visible
        bearing: -20,
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
          "Popup.Close": labels.controls.closePopup,
        },
      });
    } catch {
      container.textContent = labels.noWebGL; // e.g. WebGL blocked or out of memory
      return;
    }
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.FullscreenControl(), "top-right");

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

      // Camera animations must wait until the terrain has loaded ("idle"): animating while
      // the elevation is still unknown makes MapLibre recompute the camera against flat
      // ground, and at ~1,300 m in the Kathmandu valley it ends up inside the terrain
      // (blank map). "ready" also releases a pending fly-to from ?site= (effect below).
      map.once("idle", () => {
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

      // The popup is deliberately NOT bound with marker.setPopup(): MapLibre closes a bound popup
      // whenever its terrain-depth test decides the marker is hidden behind terrain, and that
      // test misfires on this valley terrain. We open popups ourselves instead.
      // anchor "bottom": the popup always opens above the pin (the camera leaves room for it).
      const popup = new maplibregl.Popup({ offset: 34, maxWidth: "17rem", anchor: "bottom" })
        .setLngLat(toLngLat(place.coordinates))
        .setDOMContent(popupContent(place, labels));
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
      map.remove();
      mapRef.current = null;
      popups.clear();
    };
    // The map is created once; focus changes are handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to the focused place and open its popup.
  useEffect(() => {
    const map = mapRef.current;
    const place = places.find((p) => p.id === focusId);
    if (!map || !place || !ready) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // offset: put the place below the centre of the view, leaving room for the popup above it.
    const target = { center: toLngLat(place.coordinates), zoom: 17.5, pitch: 60, offset: [0, 140] as [number, number] };
    if (reduceMotion) map.jumpTo(target);
    else map.flyTo({ ...target, duration: 2500, essential: true });

    for (const popup of popupsRef.current.values()) popup.remove();
    popupsRef.current.get(place.id)?.addTo(map);
  }, [focusId, places, ready]);

  if (!supported) {
    return <p className="flex h-full items-center justify-center bg-sand p-6 text-center text-lg">{labels.noWebGL}</p>;
  }
  // MapLibre gives its own canvas role="region" with labels.mapLabel (see locale above).
  return <div ref={containerRef} className="h-full w-full" />;
}
