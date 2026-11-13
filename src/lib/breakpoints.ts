// Screen-size breakpoints shared by client components. No server-only imports.

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
