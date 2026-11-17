import { z } from "zod";

/**
 * content/home.json — which photos the home page uses. Each entry must be a
 * gallery image of some heritage site; photos of draft sites are skipped on a
 * production build, so list photos from several sites in order of preference.
 */
export const homeSchema = z.object({
  /** How long each hero photo stays, in milliseconds (the fade is 0.6 s of it). */
  heroIntervalMs: z.number().int().min(2000).max(20000),
  /**
   * The hero slideshow, in order; photos of sites not on this build are skipped. The first visible
   * one loads with the page and is the default share image. A photo is a path, or { src, position }
   * where position is its focal point as a CSS object-position (e.g. "center 30%"): which part of a
   * tall photo stays in view in the wide banner. Without it the photo is centred.
   */
  heroSlides: z
    .array(
      z.union([
        z.string().startsWith("/images/"),
        z.object({
          src: z.string().startsWith("/images/"),
          position: z.string().min(1),
        }),
      ]),
    )
    .min(1),
  /** The first 6 photos whose sites are visible fill the gallery preview. */
  galleryPreview: z.array(z.string().startsWith("/images/")).min(1),
});

export type HomeConfig = z.infer<typeof homeSchema>;
