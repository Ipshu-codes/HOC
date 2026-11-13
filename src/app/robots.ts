import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site-url";

// Generated once at build time into out/robots.txt (static export).
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: siteUrl("/sitemap.xml"),
  };
}
