// Screen-size breakpoints shared by client components. No server-only imports.

"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * "Mobile" for the map page: narrower than Tailwind's `lg` breakpoint (64rem = 1024 px). Below it the
 * map page stacks the map above the place list, and the detail panel opens under the map. Used for:
 * - the tap-to-load still preview on direct visits (MapExplorer),
 * - scrolling the map back into view after a choice in the list (MapExplorer),
 * - where the camera leaves room for the detail panel (MapView).
 * Keep it in step with the `lg:` classes of the map layout. Media queries in rem use the browser's
 * 16 px, not the page's larger root font size, so 63.99rem is just under 1024 px.
 */
export const MOBILE_QUERY = "(max-width: 63.99rem)";

export const isMobile = (): boolean => window.matchMedia(MOBILE_QUERY).matches;

/**
 * The 3D museum needs room in both directions: a portrait tablet or a short landscape phone has
 * too little space to look around without losing the rest of the page. There the gallery keeps the
 * original hanging line from 6bed439. This is the exact complement of the CSS media query in
 * globals.css, so the visual choice is made by CSS before hydration and this hook only decides
 * whether to mount the client-only WebGL layer.
 */
export const MUSEUM_QUERY = "(min-width: 64rem) and (min-height: 34rem)";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/** SSR-safe media query subscription: false on the server, live after hydration. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
