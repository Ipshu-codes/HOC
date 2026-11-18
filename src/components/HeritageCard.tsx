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

/**
 * A heritage site as a framed print with its name underneath.
 * Desktop with a mouse (from 1024 px): the summary and location slide up over the photo on hover or
 * keyboard focus (.card-peek, a visual copy marked aria-hidden; the real text stays in .card-details for
 * screen readers). Phones, tablets and touch screens: the details are simply shown under the name.
 */
export default function HeritageCard({ heritage, cover, lang, dict, layout }: HeritageCardProps) {
  const name = lang === "ne" ? heritage.nameNe : heritage.name;
  const otherName = lang === "ne" ? heritage.name : heritage.nameNe;
  const showDraftBadge = heritage.draft && process.env.NODE_ENV !== "production";
  const horizontal = layout === "horizontal";

  const details = (
    <>
      <p className="text-ink">{heritage.summary}</p>
      <p className="mt-3 text-sm text-ink/80">
        <span className="font-bold">{dict.home.location}:</span> {heritage.location}
      </p>
    </>
  );

  return (
    <article className={`site-card flex ${horizontal ? "flex-col md:flex-row md:items-center md:gap-10" : "flex-col"}`}>
      <div className={`print ${horizontal ? "md:w-1/2" : ""}`}>
        <div className="card-media">
          <ResponsiveImage
            image={cover}
            sizes="(min-width: 768px) 50vw, 100vw"
            className="aspect-4/3 w-full object-cover"
            develop
          />
          <div aria-hidden="true" className="card-peek">
            {details}
          </div>
        </div>
      </div>

      <div className={`flex flex-1 flex-col pt-6 ${horizontal ? "md:pt-0" : ""}`}>
        {showDraftBadge && (
          <p className="mb-2 self-start rounded-full bg-crimson px-3 py-0.5 text-sm font-bold text-white">
            {dict.home.draftBadge}
          </p>
        )}
        <h3 className="text-2xl leading-tight font-bold text-balance md:text-3xl">{name}</h3>
        <p lang={lang === "ne" ? "en" : "ne"} className="mt-1 text-lg text-crimson">
          {otherName}
        </p>
        <div className="card-details mt-3">{details}</div>
        <Link
          href={`/${lang}/heritage/${heritage.slug}/`}
          className="btn-primary mt-5 self-start rounded-xl bg-crimson px-5 py-2.5 font-bold text-white hover:bg-brick"
        >
          {dict.home.readMore}
          <span className="sr-only"> — {name}</span>
          <span aria-hidden="true"> →</span>
        </Link>
      </div>
    </article>
  );
}
