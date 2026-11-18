"use client";

import Link from "next/link";
import { useState } from "react";

import type { SiteImage } from "@/lib/images";
import type { Locale } from "@/types/locale";

export interface HeritageRow {
  slug: string;
  href: string;
  name: string;
  otherName: string;
  otherLang: Locale;
  summary: string;
  location: string;
  cover: SiteImage;
  /** A second photo of the site, shown beside the cover (decorative: alt=""). */
  second: { src: string; srcSet: string; width: number; height: number } | null;
  /** Dev builds only: the "draft" badge. */
  draftBadge: string | null;
}

interface HeritageRowsProps {
  rows: HeritageRow[];
  labels: { readMore: string; location: string };
}

/**
 * The heritage sites as big rows (Biegajaca's "materials" block). From 1024 px: rows on the left, and the
 * row you point at or tab to shows its photos and summary on the right (the first row to begin with).
 * Phones and tablets: each row's photos and summary sit under its name, nothing hidden.
 */
export default function HeritageRows({ rows, labels }: HeritageRowsProps) {
  const [active, setActive] = useState(0);

  return (
    <ul className="site-rows-list">
      {rows.map((row, index) => (
        <li
          key={row.slug}
          className="site-row"
          data-active={index === active ? "" : undefined}
          onPointerEnter={(event) => {
            if (event.pointerType === "mouse") setActive(index);
          }}
          onFocus={() => setActive(index)}
        >
          {row.draftBadge && <p className="mono mt-3 inline-block bg-accent px-2 py-0.5 text-accent-fg">{row.draftBadge}</p>}
          <h3>
            <Link href={row.href} className="site-row-name">
              {row.name}
              <span lang={row.otherLang} className="mono muted mt-2 block">
                {row.otherName}
              </span>
            </Link>
          </h3>

          <div className="site-row-media">
            <div className="site-row-photos">
              {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
              <img
                src={row.cover.src}
                srcSet={row.cover.srcSet}
                sizes="(min-width: 64rem) 30vw, 60vw"
                width={row.cover.width}
                height={row.cover.height}
                alt={row.cover.alt}
                loading="lazy"
                decoding="async"
                data-develop=""
              />
              {row.second && (
                // eslint-disable-next-line @next/next/no-img-element -- static export: no image server
                <img
                  src={row.second.src}
                  srcSet={row.second.srcSet}
                  sizes="(min-width: 64rem) 19vw, 38vw"
                  width={row.second.width}
                  height={row.second.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              )}
            </div>
            <p className="justified mt-4 max-w-xl">{row.summary}</p>
            <p className="muted mt-2 max-w-xl text-sm">
              <span className="font-bold">{labels.location}:</span> {row.location}
            </p>
            <Link href={row.href} className="btn btn-outline mt-4">
              {labels.readMore}
              <span className="sr-only"> — {row.name}</span>
              <span aria-hidden="true"> →</span>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
