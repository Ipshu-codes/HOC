import "server-only";

import en from "@/i18n/en.json";
import ne from "@/i18n/ne.json";
import { LOCALES, type Locale } from "@/types/heritage";

export type Dictionary = typeof en;

// `satisfies` makes TypeScript check that ne.json has exactly the same keys as en.json.
const dictionaries = { en, ne } satisfies Record<Locale, Dictionary>;

export const DEFAULT_LOCALE: Locale = "en";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getDictionary(lang: Locale): Dictionary {
  return dictionaries[lang];
}
