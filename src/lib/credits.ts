import type { Dictionary } from "@/lib/i18n";
import type { Credits } from "@/types/site";

/**
 * "Photos: Samyojan, 2026" — or, while the team name is not set, a placeholder
 * in `npm run dev` and nothing (null) in production builds.
 */
export function photoCreditText(credits: Credits, dict: Dictionary): string | null {
  const { team, year } = credits.photos;
  if (!team && process.env.NODE_ENV === "production") return null;
  return dict.credits.photos.replace("{team}", team ?? dict.credits.teamPlaceholder).replace("{year}", String(year));
}
