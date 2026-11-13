"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import type { Dictionary } from "@/lib/i18n";
import type { GalleryPhoto } from "@/lib/images";
import type { Locale } from "@/types/locale";

interface GalleryProps {
  lang: Locale;
  photos: GalleryPhoto[];
  /** Sites with photos on this build, in display order. Filter tabs appear only when there are 2+. */
  sites: { slug: string; name: string }[];
  /** "Photos: Samyojan, 2026", shown inside the lightbox; null when there is no credit to show. */
  credit: string | null;
  /** Only the gallery strings: the whole dictionary would be sent to the browser. */
  labels: Dictionary["gallery"];
  /** Site slug from ?site=…, if any (see GalleryFromUrl). */
  requestedSite?: string | null;
}

/**
 * Photo grid with an optional site filter and a lightbox.
 *
 * The grid shows only the 480/640 px thumbnails (lazy-loaded). The 960/1280/1920 px
 * files are listed in the lightbox slides, so the browser fetches them only
 * when a photo is opened. The lightbox library (yet-another-react-lightbox)
 * handles arrow keys, Escape and swipe gestures.
 */
/** Reads ?site= from the URL. Must sit inside <Suspense> (static export requirement). */
export function GalleryFromUrl(props: Omit<GalleryProps, "requestedSite">) {
  const searchParams = useSearchParams();
  return <Gallery {...props} requestedSite={searchParams.get("site")} />;
}

/** Thumbnails in the first rows (2 columns × 2 rows on phones) are not lazy-loaded; more would compete with the first photo on slow connections. */
const EAGER_THUMBS = 4;

export default function Gallery({ lang, photos, sites, credit, labels, requestedSite = null }: GalleryProps) {
  const pathname = usePathname();
  const showFilter = sites.length > 1;

  // ?site=nanak-math preselects a tab (links from the detail pages use it).
  const preselected =
    showFilter && requestedSite && sites.some((site) => site.slug === requestedSite) ? requestedSite : "all";
  const [filter, setFilter] = useState<string>(preselected);
  const [openIndex, setOpenIndex] = useState(-1);
  const viewedIndex = useRef(0);
  const thumbButtons = useRef<(HTMLButtonElement | null)[]>([]);

  const shown = filter === "all" ? photos : photos.filter((photo) => photo.site === filter);
  const formatCount = (n: number) =>
    (n === 1 ? labels.count.one : labels.count.other).replace("{n}", n.toLocaleString(lang === "ne" ? "ne-NP" : "en"));

  function choose(slug: string) {
    setFilter(slug);
    // Keep the choice in the URL (shareable) without a navigation or scroll jump.
    window.history.replaceState(null, "", slug === "all" ? pathname : `${pathname}?site=${slug}`);
  }

  const tabs = [{ slug: "all", name: labels.all }, ...sites];

  return (
    <>
      {showFilter && (
        <div role="group" aria-label={labels.filterLabel} className="mb-6 flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = filter === tab.slug;
            return (
              <button
                key={tab.slug}
                type="button"
                aria-pressed={active}
                onClick={() => choose(tab.slug)}
                className={
                  active
                    ? "rounded-full bg-crimson px-4 py-2 font-bold text-white"
                    : "rounded-full bg-white px-4 py-2 font-medium text-brick ring-1 ring-gold/60 hover:bg-sand"
                }
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      )}

      <p className="mb-4 text-sm text-ink/80" aria-live="polite">
        {formatCount(shown.length)}
      </p>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {shown.map((photo, index) => (
          <li key={photo.thumb.src}>
            <button
              type="button"
              ref={(element) => {
                thumbButtons.current[index] = element;
              }}
              onClick={() => {
                viewedIndex.current = index;
                setOpenIndex(index);
              }}
              className="group block w-full text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
              <img
                src={photo.thumb.src}
                srcSet={photo.thumb.srcSet}
                sizes="(min-width: 64rem) 25vw, (min-width: 40rem) 33vw, 50vw"
                width={photo.thumb.width}
                height={photo.thumb.height}
                alt=""
                // The first rows are visible right away (and the first photo is the page’s largest
                // paint), so they load immediately; the rest load as they scroll into view.
                loading={index < EAGER_THUMBS ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                decoding="async"
                className="aspect-square w-full rounded-xl object-cover shadow-sm transition group-hover:opacity-90"
              />
              {/* The caption is the button's accessible name; the image itself is alt="" so it is not read twice. */}
              <span className="mt-1.5 line-clamp-2 block text-sm leading-snug text-ink">{photo.alt}</span>
            </button>
          </li>
        ))}
      </ul>

      <Lightbox
        open={openIndex >= 0}
        index={Math.max(openIndex, 0)}
        close={() => setOpenIndex(-1)}
        on={{
          view: ({ index }) => {
            viewedIndex.current = index;
          },
          // Give focus back to the thumbnail of the photo that was showing when the lightbox closed.
          exited: () => thumbButtons.current[viewedIndex.current]?.focus(),
        }}
        slides={shown.map((photo) => {
          const largest = photo.full.at(-1) ?? photo.thumb;
          return {
            src: largest.src,
            width: largest.width,
            height: largest.height,
            srcSet: photo.full,
            alt: photo.alt,
            description: (
              <>
                {photo.alt}
                {credit && <span className="mt-1 block text-sm opacity-80">{credit}</span>}
              </>
            ),
          };
        })}
        plugins={[Captions]}
        captions={{ descriptionTextAlign: "center", descriptionMaxLines: 4 }}
        carousel={{ preload: 1 }}
        labels={labels.lightbox}
        styles={{ container: { backgroundColor: "rgba(43, 26, 26, 0.96)" } }}
      />
    </>
  );
}
