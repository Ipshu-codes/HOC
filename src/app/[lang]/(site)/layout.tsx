import type { ReactNode } from "react";

/**
 * Every page except the home page. MuseumShell (root layout) shows them in an information panel over
 * the museum; the page content itself is unchanged and lays itself out for the panel's width
 * (container queries). (site) is a route group: it adds no URL segment.
 */
export default function SitePageLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
