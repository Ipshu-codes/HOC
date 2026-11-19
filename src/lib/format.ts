// Small helpers shared by the map components. No server-only imports: client components use this file.
import type { Locale } from "@/types/locale";

/** 2026 → "2026" / "२०२६": a year, so no thousands separator. */
export function formatYear(year: number, lang: Locale): string {
  return format(year, lang, { useGrouping: false });
}

/** Devanagari digits, independent of the browser's inconsistent "ne-NP" Intl implementation. */
function localizeDigits(value: string, lang: Locale): string {
  return lang === "ne" ? value.replace(/[0-9]/g, (digit) => String.fromCharCode(0x0966 + Number(digit))) : value;
}

/**
 * Formats a number the same way on the server and in every browser. Intl's "ne-NP" is not reliable:
 * Node writes "५३" but Chrome writes "53" (even with "-u-nu-deva"), so prerendered Nepali pages failed
 * to hydrate (gallery photo count, map place count). So: format with "en-IN" (the lakh grouping Nepali
 * uses, 1,00,000), then swap in Devanagari digits ourselves.
 */
function format(n: number, lang: Locale, options?: Intl.NumberFormatOptions): string {
  const text = new Intl.NumberFormat(lang === "ne" ? "en-IN" : "en", options).format(n);
  return localizeDigits(text, lang);
}

/** 3 → "3" on English pages, "३" on Nepali pages (Devanagari digits, as elsewhere on the site). */
export function formatNumber(n: number, lang: Locale): string {
  return format(n, lang);
}

/**
 * "Stop {n} of {total}" + { n: 2, total: 5 } → "Stop 2 of 5".
 * Pass `lang` when a value is a number, so Nepali pages show "पडाव २ / ५", not "पडाव 2 / 5".
 */
export function fill(template: string, values: Record<string, string | number>, lang?: Locale): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in values)) return match;
    const value = values[key];
    return typeof value === "number" && lang ? formatNumber(value, lang) : String(value);
  });
}

/** Great-circle distance in metres between two [lat, lng] points (haversine formula). */
export function haversineMeters([lat1, lng1]: [number, number], [lat2, lng2]: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371008.8 * Math.asin(Math.sqrt(a));
}

/** 640 m → "640 m", 1,234 m → "1.2 km". Nepali pages get Devanagari digits. */
export function formatDistance(meters: number, lang: Locale, units: { m: string; km: string }): string {
  const nf = (max: number) => new Intl.NumberFormat(lang === "ne" ? "en-IN" : "en", { maximumFractionDigits: max });
  const value = meters < 1000 ? nf(0).format(Math.round(meters)) : nf(1).format(meters / 1000);
  return `${localizeDigits(value, lang)} ${meters < 1000 ? units.m : units.km}`;
}

export function formatMinutes(seconds: number, lang: Locale): string {
  const value = new Intl.NumberFormat(lang === "ne" ? "en-IN" : "en").format(Math.max(1, Math.round(seconds / 60)));
  return localizeDigits(value, lang);
}
