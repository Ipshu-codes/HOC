import type { Dictionary } from "@/lib/i18n";
import type { Credits } from "@/types/site";

interface PhotoCreditProps {
  credits: Credits;
  dict: Dictionary;
  className?: string;
}

/**
 * "Photos: <team>, 2026". While the team name is not confirmed
 * (content/credits.json has `team: null`), the line shows a placeholder in
 * `npm run dev` and is left out of production builds entirely.
 */
export default function PhotoCredit({ credits, dict, className = "" }: PhotoCreditProps) {
  const { team, year } = credits.photos;
  const devPreview = process.env.NODE_ENV !== "production";
  if (!team && !devPreview) return null;

  const text = dict.credits.photos
    .replace("{team}", team ?? dict.credits.teamPlaceholder)
    .replace("{year}", String(year));

  return <p className={`text-sm ${team ? "text-ink/80" : "font-bold text-crimson"} ${className}`}>{text}</p>;
}
