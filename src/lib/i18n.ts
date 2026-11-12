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

/** ["A", "B", "C"] → "A, B and C" (or "A, B र C"). */
export function joinList(items: string[], and: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${and} ${items.at(-1)}`;
}

/** Section links shared by the header nav and the footer. They point at sections of the home page. */
export function getNavItems(lang: Locale, dict: Dictionary) {
  const sections = ["overview", "about", "heritages", "gallery", "contact"] as const;
  return sections.map((id) => ({ href: `/${lang}/#${id}`, label: dict.nav[id] }));
}

export type NavItem = ReturnType<typeof getNavItems>[number];
