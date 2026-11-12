import { z } from "zod";

/** A string given in both languages. */
const localized = z.object({ en: z.string().min(1), ne: z.string().min(1) });

/** content/ward.json — ward office details shown in the header, footer and contact sections. */
export const wardSchema = z.object({
  name: localized,
  city: localized,
  office: z.object({
    address: localized,
    phone: z.string().min(1),
    email: z.email(),
  }),
  chairperson: localized,
  logo: z.object({
    src: z.string().startsWith("/images/"),
    alt: localized,
  }),
});

export type Ward = z.infer<typeof wardSchema>;
