// Small helpers shared by the map components. No server-only imports: client components use this file.
import type { Locale } from "@/types/locale";

/** "Stop {n} of {total}" + { n: 2, total: 5 } → "Stop 2 of 5". */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
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
  const nf = (max: number) => new Intl.NumberFormat(lang === "ne" ? "ne-NP" : "en", { maximumFractionDigits: max });
  return meters < 1000 ? `${nf(0).format(Math.round(meters))} ${units.m}` : `${nf(1).format(meters / 1000)} ${units.km}`;
}

export function formatMinutes(seconds: number, lang: Locale): string {
  return new Intl.NumberFormat(lang === "ne" ? "ne-NP" : "en").format(Math.max(1, Math.round(seconds / 60)));
}
