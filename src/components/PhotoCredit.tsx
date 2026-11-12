import { photoCreditText } from "@/lib/credits";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";
import type { Credits } from "@/types/site";

interface PhotoCreditProps {
  credits: Credits;
  dict: Dictionary;
  lang: Locale;
  className?: string;
}

/** The photo credit line (see photoCreditText). Renders nothing when there is no credit to show. */
export default function PhotoCredit({ credits, dict, lang, className = "" }: PhotoCreditProps) {
  const text = photoCreditText(credits, dict, lang);
  if (!text) return null;
  const isPlaceholder = !credits.photos.team;
  return <p className={`text-sm ${isPlaceholder ? "font-bold text-crimson" : "text-ink/80"} ${className}`}>{text}</p>;
}
