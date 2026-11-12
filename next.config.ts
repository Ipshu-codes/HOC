import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `next build` writes plain HTML/CSS/JS to `out/` for Cloudflare Pages.
  // No server features (API routes, server actions, proxy, ISR) are available.
  output: "export",
  // `/en/gallery` is emitted as `/en/gallery/index.html`, which static hosts serve without rewrites.
  trailingSlash: true,
  // The default image optimizer needs a server. Images are pre-optimized by
  // `npm run optimize-images` (scripts/optimize-images.ts) instead.
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
