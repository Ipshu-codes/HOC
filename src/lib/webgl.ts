"use client";

import { useSyncExternalStore } from "react";

/**
 * WebGL capability check, mirroring MapView.hasWebGL() (src/components/MapView.tsx:67-71).
 * Wrapped in try/catch as well: a browser can expose getContext and still throw when the
 * context is blocked or the GPU process is unavailable ("unreliable WebGL").
 */
export function hasWebGL(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

// Cached so the snapshot is stable (useSyncExternalStore requires getSnapshot to be pure).
let cached: boolean | null = null;
function webGLSupported(): boolean {
  if (cached === null) cached = hasWebGL();
  return cached;
}
function subscribe() {
  return () => {
    // WebGL support does not change during a visit.
  };
}

/**
 * `false` in the prerendered HTML, the real capability after hydration — the same pattern
 * Gallery.tsx uses for the remembered view. The DOM gallery is therefore always in the HTML.
 */
export function useWebGL(): boolean {
  return useSyncExternalStore(subscribe, webGLSupported, () => false);
}
