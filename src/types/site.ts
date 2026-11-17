import { z } from "zod";

import { localized } from "@/types/common";

/**
 * content/sources.json — plain-language names of the sources behind the content.
 * Content files cite them in comments: <!-- source: nanak-account, nanak-signboards | details -->
 * Web sources also carry a url.
 */
export const sourcesSchema = z.record(
  z.string().regex(/^[a-z0-9-]+$/),
  // url: for published (web) sources, shown as a link in the page’s Sources section.
  localized.extend({ url: z.url().optional() }),
);
export type SourceRegistry = z.infer<typeof sourcesSchema>;

/** content/credits.json — photo credit line. `team: null` until the team name is confirmed. */
export const creditsSchema = z.object({
  photos: z.object({
    /** The team name in each language, e.g. { en: "Samyojan", ne: "संयोजन" }. */
    team: localized.nullable(),
    year: z.number().int(),
  }),
  /** The chatbot character. `creator: null` until confirmed: the About credit is then left out of builds. */
  nani: z.object({
    creator: localized.nullable(),
    /** Where the artwork came from (for the team; not shown on the site). */
    source: z.string().min(1),
  }),
  /**
   * How people who gave information are credited, in one place. Content and content/sources.json
   * write `{person:<id>}`, filled in from here at build time (an unknown id fails the build).
   * To stop naming someone, change their text here, e.g. to "the temple's chief priest".
   * `credit` is the form used in a site's "Information from …" line (see informationFrom).
   */
  people: z.record(
    z.string().regex(/^[a-z0-9-]+$/),
    localized.extend({ credit: localized.optional() }),
  ),
  /**
   * Heritage site slug → people (ids above) whose information the page is based on. The page shows
   * "Information from <credit>" under its text. An unknown person id fails the build.
   */
  informationFrom: z.record(z.string(), z.array(z.string()).min(1)).default({}),
});
export type Credits = z.infer<typeof creditsSchema>;

/**
 * content/section-photos.json — photos shown beside the items of a numbered list on a heritage page
 * (site slug → section id → list item number → gallery photo), e.g. the "यहाँ भएका सम्पदाहरू" list.
 * Each photo must be in that site's gallery; its alt text comes from the gallery in each language.
 */
const sectionPhoto = z.union([
  // Just the photo: its gallery description (alt text) is also shown under the item's title.
  z.string().startsWith("/images/"),
  // `description: false` when the photo's description doesn't clearly match the item.
  z.object({
    photo: z.string().startsWith("/images/"),
    description: z.boolean(),
  }),
]);
export const sectionPhotosSchema = z.record(
  z.string().regex(/^[a-z0-9-]+$/),
  z.record(
    z.string().regex(/^[a-z0-9-]+$/),
    z.record(z.string().regex(/^[1-9]\d*$/), sectionPhoto),
  ),
);
export type SectionPhotosConfig = z.infer<typeof sectionPhotosSchema>;

/**
 * content/photo-consent.json — photos that need someone's consent: identifiable people (see
 * docs/photos-with-people.md), or a deity shown prominently (e.g. in the home slideshow).
 * "pending" and "approved" photos are shown; "removed" hides the photo everywhere with this one change.
 */
export const photoConsentSchema = z.object({
  photos: z.record(
    z.string().startsWith("/images/"),
    z.object({
      status: z.enum(["pending", "approved", "removed"]),
      note: z.string().min(1),
      /** Who gave or refused consent, e.g. "priest". */
      givenBy: z.string().min(1).optional(),
      /** When, as YYYY-MM-DD. */
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .optional(),
    }),
  ),
});
export type PhotoConsent = z.infer<typeof photoConsentSchema>;
