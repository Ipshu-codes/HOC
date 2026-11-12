import { z } from "zod";

/** A string given in both languages. */
export const localized = z.object({ en: z.string().min(1), ne: z.string().min(1) });
