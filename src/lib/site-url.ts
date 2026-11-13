/**
 * The site's public address, from the SITE_URL environment variable set in the
 * Cloudflare Pages build settings (see DEPLOY.md). Used for absolute URLs in the
 * sitemap, robots.txt and Open Graph tags. Falls back to localhost for local builds.
 */
export const SITE_URL = (process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export function siteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
