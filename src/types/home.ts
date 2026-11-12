import { z } from "zod";

/**
 * content/home.json — which photos the home page uses. Each entry must be a
 * gallery image of some heritage site; photos of draft sites are skipped on a
 * production build, so list photos from several sites in order of preference.
 */
export const homeSchema = z.object({
  /** First photo whose site is visible becomes the hero. */
  heroCandidates: z.array(z.string().startsWith("/images/")).min(1),
  /** The first 6 photos whose sites are visible fill the gallery preview. */
  galleryPreview: z.array(z.string().startsWith("/images/")).min(1),
});

export type HomeConfig = z.infer<typeof homeSchema>;
