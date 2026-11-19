// Screen-size breakpoints shared by client components. No server-only imports.
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
 * Compact/touch presentation for the 3D museum. This no longer decides *whether* the museum
 * renders — only how it is tuned: narrower corridor, wider field of view, lower pixel ratio and
 * visible touch controls. The hanging line remains an explicit alternative or a WebGL fallback.
 * Kept in step with the compact museum rules in globals.css.
 */
export const MUSEUM_COMPACT_QUERY = "(max-width: 63.99rem), (hover: none), (pointer: coarse)";

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
