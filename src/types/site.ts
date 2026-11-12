import { z } from "zod";

import { localized } from "@/types/common";

/**
 * content/sources.json — plain-language names of the sources behind the content.
 * Content files cite them in comments: <!-- source: nanak-account, nanak-signboards | details -->
 */
export const sourcesSchema = z.record(z.string().regex(/^[a-z0-9-]+$/), localized);
export type SourceRegistry = z.infer<typeof sourcesSchema>;

/** content/credits.json — photo credit line. `team: null` until the team name is confirmed. */
export const creditsSchema = z.object({
  photos: z.object({
    /** The team name in each language, e.g. { en: "Samyojan", ne: "संयोजन" }. */
    team: localized.nullable(),
    year: z.number().int(),
  }),
});
export type Credits = z.infer<typeof creditsSchema>;

/**
 * content/photo-consent.json — photos that show identifiable people (see
 * docs/photos-with-people.md). "pending" and "approved" photos are shown;
 * "removed" hides the photo everywhere with this one change.
 */
export const photoConsentSchema = z.object({
  photos: z.record(
    z.string().startsWith("/images/"),
    z.object({
      status: z.enum(["pending", "approved", "removed"]),
      note: z.string().min(1),
    }),
  ),
});
export type PhotoConsent = z.infer<typeof photoConsentSchema>;
