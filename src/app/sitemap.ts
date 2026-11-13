import type { MetadataRoute } from "next";

import { getHeritageSlugs } from "@/lib/content";
import { siteUrl } from "@/lib/site-url";
import { LOCALES } from "@/types/locale";

// Generated once at build time into out/sitemap.xml (static export).
export const dynamic = "force-static";

/** Every page in both languages, each listing its other-language version (hreflang). Drafts are not included. */
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["", "gallery/", "map/", "contact/", ...getHeritageSlugs().map((slug) => `heritage/${slug}/`)];
  return paths.flatMap((path) =>
    LOCALES.map((lang) => ({
      url: siteUrl(`/${lang}/${path}`),
      alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, siteUrl(`/${l}/${path}`)])) },
    })),
  );
}
