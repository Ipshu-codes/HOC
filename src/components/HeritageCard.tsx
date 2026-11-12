import Link from "next/link";

import ResponsiveImage from "@/components/ResponsiveImage";
import type { Dictionary } from "@/lib/i18n";
import type { SiteImage } from "@/lib/images";
import type { Heritage, Locale } from "@/types/heritage";

interface HeritageCardProps {
  heritage: Heritage;
  cover: SiteImage;
  lang: Locale;
  dict: Dictionary;
  /** "vertical" when cards sit side by side; "horizontal" for a single, wide card. */
  layout: "vertical" | "horizontal";
}

export default function HeritageCard({ heritage, cover, lang, dict, layout }: HeritageCardProps) {
  const name = lang === "ne" ? heritage.nameNe : heritage.name;
  const otherName = lang === "ne" ? heritage.name : heritage.nameNe;
  const showDraftBadge = heritage.draft && process.env.NODE_ENV !== "production";
  const horizontal = layout === "horizontal";

  return (
    <article
      className={`flex overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-gold/40 ${
        horizontal ? "flex-col md:flex-row" : "flex-col"
      }`}
    >
      <div className={horizontal ? "md:w-1/2" : ""}>
        <ResponsiveImage
          image={cover}
          sizes="(min-width: 768px) 50vw, 100vw"
          className={`w-full object-cover ${horizontal ? "aspect-4/3 md:h-full" : "aspect-4/3"}`}
        />
      </div>

      <div className={`flex flex-1 flex-col p-6 ${horizontal ? "md:p-8" : ""}`}>
        {showDraftBadge && (
          <p className="mb-2 self-start rounded-full bg-crimson px-3 py-0.5 text-sm font-bold text-white">
            {dict.home.draftBadge}
          </p>
        )}
        <h3 className="text-2xl font-bold md:text-3xl">{name}</h3>
        <p lang={lang === "ne" ? "en" : "ne"} className="text-lg text-crimson">
          {otherName}
        </p>
        <p className="mt-3 text-ink">{heritage.summary}</p>
        <p className="mt-3 text-sm text-ink/80">
          <span className="font-bold">{dict.home.location}:</span> {heritage.location}
        </p>
        <Link
          href={`/${lang}/heritage/${heritage.slug}/`}
          className="mt-5 self-start rounded-xl bg-crimson px-5 py-2.5 font-bold text-white hover:bg-brick"
        >
          {dict.home.readMore}
          <span className="sr-only"> — {name}</span>
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </article>
  );
}
