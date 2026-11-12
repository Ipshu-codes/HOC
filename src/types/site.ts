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
    team: z.string().min(1).nullable(),
    year: z.number().int(),
  }),
});
export type Credits = z.infer<typeof creditsSchema>;
