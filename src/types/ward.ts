import { z } from "zod";

import { localized } from "@/types/common";

/** content/ward.json — ward office details shown in the header, footer and contact sections. */
export const wardSchema = z.object({
  name: localized,
  city: localized,
  office: z.object({
    address: localized,
    phone: z.string().min(1),
    email: z.email(),
    /** [lat, lng] of the ward office, for the map. */
    coordinates: z.tuple([z.number(), z.number()]).nullable(),
    /** true when the point is only the general area (shown as such on the map). */
    coordinatesApproximate: z.boolean().default(false),
  }),
  chairperson: localized,
  logo: z.object({
    src: z.string().startsWith("/images/"),
    alt: localized,
  }),
  /** Nani greeting with a namaste, beside the Overview text on the home page (raw-data Naninamaste.jpeg), smallest file first. */
  overviewImage: z
    .object({
      files: z.array(z.string().startsWith("/images/")).min(1),
      alt: localized,
    })
    .optional(),
  /** Ward illustration beside the About text on the home page (raw-data wardlogo1.png), smallest file first. */
  illustration: z
    .object({
      files: z.array(z.string().startsWith("/images/")).min(1),
      alt: localized,
    })
    .optional(),
});

export type Ward = z.infer<typeof wardSchema>;
