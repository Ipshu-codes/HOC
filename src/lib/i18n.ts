import "server-only";

import en from "@/i18n/en.json";
import ne from "@/i18n/ne.json";
import { LOCALES, type Heritage, type Locale } from "@/types/heritage";

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

/** Strings that differ by number, e.g. { one: "Heritage site", other: "Heritage sites" }. */
export interface CountForms {
  one: string;
  other: string;
}

export function byCount(forms: CountForms, count: number): string {
  return count === 1 ? forms.one : forms.other;
}

/** "Nanak Math" or "Mhepi Ajima and Nanak Math", in the page language, from the sites on this build. */
export function siteNameList(heritages: Heritage[], lang: Locale, dict: Dictionary): string {
  return joinList(
    heritages.map((heritage) => (lang === "ne" ? heritage.nameNe : heritage.name)),
    dict.site.and,
  );
}

/** "01-4981653" → "०१-४९८१६५३" (for display on Nepali pages; keep Latin digits in tel: links). */
export function toDevanagariDigits(text: string): string {
  return text.replace(/[0-9]/g, (digit) => String.fromCharCode(0x0966 + Number(digit)));
}
