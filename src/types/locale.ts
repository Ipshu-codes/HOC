// Kept separate from types/heritage.ts on purpose: client components import
// this file, and it must not pull the content schema (zod, site slugs) into
// the browser bundle.

export const LOCALES = ["en", "ne"] as const;
export type Locale = (typeof LOCALES)[number];
