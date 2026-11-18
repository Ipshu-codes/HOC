"use client";

import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";

import { formatNumber } from "@/lib/format";
import type { GalleryPhoto } from "@/lib/images";
import { buildMuseumLayout, MUSEUM, type MuseumRoomInput } from "@/lib/museum-layout";
import type { Locale } from "@/types/locale";
import MuseumScene from "./MuseumScene";

interface MuseumCanvasProps {
  /** All photos for this build; `filter` picks the flat, shown subset (indices match PhotoView). */
  photos: GalleryPhoto[];
  sites: { slug: string; name: string }[];
  filter: string;
  lang: Locale;
}

function twoDigits(n: number, lang: Locale): string {
  const text = formatNumber(n, lang);
  return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
}

/**
 * Client-only entry for the 3D museum. The DOM walk (Gallery.tsx) stays in the page as the
 * accessibility tree and the no-WebGL fallback; this layer is the visual implementation of
 * the same view. Rendered with `dynamic(..., { ssr: false })`, so nothing here is prerendered.
 */
export default function MuseumCanvas({ photos, sites, filter, lang }: MuseumCanvasProps) {
  const shown = useMemo(
    () => (filter === "all" ? photos : photos.filter((photo) => photo.site === filter)),
    [photos, filter],
  );
  const rooms = useMemo<MuseumRoomInput[]>(
    () =>
      sites.map((site, index) => ({
        slug: site.slug,
        name: site.name,
        number: twoDigits(index + 1, lang),
        visible: filter === "all" || filter === site.slug,
      })),
    [sites, filter, lang],
  );
  const halls = useMemo(() => buildMuseumLayout(rooms, shown, lang), [rooms, shown, lang]);

  // Progressive loading: the nearest hall is lit immediately, later halls one per idle period.
  // Phase 3 swaps this for camera-driven activation; the texture hook is already ref-counted.
  const [activeHalls, setActiveHalls] = useState(1);
  useEffect(() => {
    if (activeHalls >= halls.length) return;
    let id = 0;
    const advance = () => setActiveHalls((count) => Math.min(count + 1, halls.length));
    if (typeof window.requestIdleCallback === "function") id = window.requestIdleCallback(advance);
    else id = window.setTimeout(advance, 250);
    return () => {
      if (typeof window.cancelIdleCallback === "function") window.cancelIdleCallback(id);
      else window.clearTimeout(id);
    };
  }, [activeHalls, halls.length]);

  return (
    <div className="museum-canvas gallery-museum" aria-hidden="true">
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        // R3F auto-lookAt(0,0,0) unless a rotation is supplied; without this the camera faces
        // back through the entrance wall. [0,0,0] looks straight down the hall (-Z).
        camera={{ position: [-0.8, MUSEUM.eyeHeight, -0.5], rotation: [0, 0, 0], fov: 68, near: 0.1, far: 220 }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
        }}
      >
        <MuseumScene halls={halls} activeHalls={activeHalls} lang={lang} />
      </Canvas>
    </div>
  );
}
