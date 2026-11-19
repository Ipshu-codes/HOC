import Link from "next/link";

import ResponsiveImage from "@/components/ResponsiveImage";
import type { Dictionary } from "@/lib/i18n";
import type { SiteImage } from "@/lib/images";
import type { Heritage, Locale } from "@/types/heritage";

interface HeritageCardProps {
  heritage: Heritage;
  cover: SiteImage;
  lang: Locale;
  labels: HeritageCardLabels;
  /** "vertical" when cards sit side by side; "horizontal" for a single, wide card. */
  layout: "vertical" | "horizontal";
  index: number;
}

export type HeritageCardLabels = Pick<
  Dictionary["home"],
  "heritageLabel" | "draftBadge" | "location" | "readMore"
>;

export default function HeritageCard({ heritage, cover, lang, labels, layout, index }: HeritageCardProps) {
  const name = lang === "ne" ? heritage.nameNe : heritage.name;
  const otherName = lang === "ne" ? heritage.name : heritage.nameNe;
  const showDraftBadge = heritage.draft && process.env.NODE_ENV !== "production";
  const horizontal = layout === "horizontal";

  return (
    <article className={`heritage-card ${horizontal ? "heritage-card--horizontal" : ""}`}>
      <ResponsiveImage
        image={cover}
        sizes="(min-width: 900px) 50vw, 100vw"
        className="heritage-card__image"
      />
      <div className="heritage-card__shade" aria-hidden="true" />
      <div className="heritage-card__copy">
        <p className="heritage-card__index">0{index} / {labels.heritageLabel}</p>
        {showDraftBadge && (
          <p className="mb-2 self-start rounded-full bg-crimson px-3 py-0.5 text-sm font-bold text-white">
            {labels.draftBadge}
          </p>
        )}
        <h3 className="heritage-card__title">{name}</h3>
        <p lang={lang === "ne" ? "en" : "ne"} className="heritage-card__other">
          {otherName}
        </p>
        <p className="heritage-card__summary justified">{heritage.summary}</p>
        <p className="heritage-card__location">
          <span className="font-bold">{labels.location}:</span> {heritage.location}
        </p>
        <Link
          href={`/${lang}/heritage/${heritage.slug}/`}
          className="heritage-card__action"
        >
          {labels.readMore}
          <span className="sr-only"> — {name}</span>
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </article>
  );
}
