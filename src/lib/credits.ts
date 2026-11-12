import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";
import type { Credits } from "@/types/site";

/**
 * "Photos: Samyojan, 2026" / "तस्बिर: संयोजन, २०२६" (Devanagari digits on Nepali pages) — or, while the team name is not set, a placeholder
 * in `npm run dev` and nothing (null) in production builds.
 */
export function photoCreditText(credits: Credits, dict: Dictionary, lang: Locale): string | null {
  const { team, year } = credits.photos;
  if (!team && process.env.NODE_ENV === "production") return null;
  // ne-NP formats numbers with Devanagari digits; useGrouping off so 2026 is not written "२,०२६".
  const yearText = year.toLocaleString(lang === "ne" ? "ne-NP" : "en", { useGrouping: false });
  return dict.credits.photos.replace("{team}", team?.[lang] ?? dict.credits.teamPlaceholder).replace("{year}", yearText);
}
