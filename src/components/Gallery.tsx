"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";

import { formatNumber, formatYear } from "@/lib/format";
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
  /** Year the photos were taken (content/credits.json → photos.year), shown in List view; null hides it. */
  year: number | null;
  /** Only the gallery strings: the whole dictionary would be sent to the browser. */
  labels: Dictionary["gallery"];
  /** Site slug from ?site=…, if any (see GalleryFromUrl). */
  requestedSite?: string | null;
}

/**
 * Photo grid (or list) with an optional site filter and a lightbox.
 *
 * Two views, switched with the Gallery / List pill and remembered for the visit (sessionStorage):
 *   grid  framed 4:5 prints in airy columns; on desktop with a mouse the caption slides up on hover
 *   list  rows with a small photo, the caption, the site and the year
 * Both open the same lightbox. Captions are the photos' alt text from content/.
 *
 * The thumbnails are the 480/640 px files (lazy-loaded). The 960/1280/1920 px
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

type View = "grid" | "list";
/** sessionStorage key: the chosen view lasts for the visit (this tab), not forever. */
const VIEW_KEY = "gallery-view";
const VIEW_EVENT = "gallery-view-change";
/** Used when storage is blocked (private windows, site data off): the switch still works on this page. */
let memoryView: View | null = null;

// The chosen view lives outside React (sessionStorage), so the component subscribes to it with
// useSyncExternalStore, React's hook for reading outside state without a render mismatch.
function readView(): View {
  if (memoryView) return memoryView;
  try {
    return window.sessionStorage.getItem(VIEW_KEY) === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

function subscribeView(onChange: () => void) {
  window.addEventListener(VIEW_EVENT, onChange);
  return () => window.removeEventListener(VIEW_EVENT, onChange);
}

function chooseView(next: View) {
  memoryView = next;
  try {
    window.sessionStorage.setItem(VIEW_KEY, next);
  } catch {
    // ignore: the choice is kept in memory only
  }
  window.dispatchEvent(new Event(VIEW_EVENT));
}

export default function Gallery({ lang, photos, sites, credit, year, labels, requestedSite = null }: GalleryProps) {
  const pathname = usePathname();
  const showFilter = sites.length > 1;

  // ?site=nanak-math preselects a tab (links from the detail pages use it).
  const preselected =
    showFilter && requestedSite && sites.some((site) => site.slug === requestedSite) ? requestedSite : "all";
  const [filter, setFilter] = useState<string>(preselected);
  const [openIndex, setOpenIndex] = useState(-1);
  const viewedIndex = useRef(0);
  const thumbButtons = useRef<(HTMLButtonElement | null)[]>([]);
  // The prerendered HTML is grid view (server snapshot); after hydration the remembered view is read.
  const view = useSyncExternalStore(subscribeView, readView, () => "grid" as const);

  const siteName = new Map(sites.map((site) => [site.slug, site.name]));

  const shown = filter === "all" ? photos : photos.filter((photo) => photo.site === filter);
  const formatCount = (n: number) =>
    (n === 1 ? labels.count.one : labels.count.other).replace("{n}", formatNumber(n, lang));

  function choose(slug: string) {
    setFilter(slug);
    // Keep the choice in the URL (shareable) without a navigation or scroll jump.
    window.history.replaceState(null, "", slug === "all" ? pathname : `${pathname}?site=${slug}`);
  }

  const tabs = [{ slug: "all", name: labels.all }, ...sites];

  function open(index: number) {
    viewedIndex.current = index;
    setOpenIndex(index);
  }

  return (
    <>
      {/* Toolbar in two steady rows, whatever the site names' length: the site filter, then the photo
          count with the Gallery / List switch at its right. */}
      {showFilter && (
        <div className="mb-5">
          <div role="group" aria-label={labels.filterLabel} className="seg-switch inline-flex max-w-full flex-wrap gap-1 rounded-3xl border border-ink p-1 text-left">
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
                      ? "min-h-11 rounded-full bg-ink px-4 py-2 font-bold text-cream"
                      : "min-h-11 rounded-full px-4 py-2 font-medium text-ink hover:bg-cream"
                  }
                >
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="label-small text-sm text-ink/80" aria-live="polite">
          {formatCount(shown.length)}
        </p>
        <div
          role="group"
          aria-label={labels.view.label}
          data-view={view}
          className="view-switch grid shrink-0 grid-cols-2 rounded-full border border-ink p-1"
        >
          <span aria-hidden="true" className="view-switch-thumb" />
          {(["grid", "list"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => chooseView(option)}
              className={`label-small min-h-11 rounded-full px-5 py-2 font-bold transition-colors duration-200 ${
                view === option ? "text-cream" : "text-ink hover:text-crimson"
              }`}
            >
              {labels.view[option]}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="border-y border-ink/20 py-16 text-center text-lg text-ink/80">{labels.empty}</p>
      ) : view === "grid" ? (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-8 md:gap-y-12">
          {shown.map((photo, index) => (
            <li key={photo.thumb.src}>
              <button
                type="button"
                ref={(element) => {
                  thumbButtons.current[index] = element;
                }}
                onClick={() => open(index)}
                className="museum-tile group block w-full text-left"
              >
                <span className="print block">
                  <span className="tile-media block">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                    <img
                      src={photo.thumb.src}
                      srcSet={photo.thumb.srcSet}
                      // Wider than the tile on purpose: a landscape photo cropped to 4:5 shows only the
                      // middle of the file, so it needs about 5/3 of the tile's width to stay sharp.
                      sizes="(min-width: 72rem) 34rem, (min-width: 48rem) 48vw, 80vw"
                      width={photo.thumb.width}
                      height={photo.thumb.height}
                      alt=""
                      // The first rows are visible right away (and the first photo is the page’s largest
                      // paint), so they load immediately; the rest load as they scroll into view.
                      loading={index < EAGER_THUMBS ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                      data-develop="dense"
                      className="aspect-4/5 w-full object-cover"
                    />
                    {/* The caption is the button's accessible name; the image itself is alt="" so it is not read twice.
                        Phones and touch: under the photo. Desktop with a mouse: slides up over it on hover or focus. */}
                    <span className="tile-caption line-clamp-3 text-sm leading-snug text-ink">{photo.alt}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <ul>
          {shown.map((photo, index) => (
            <li key={photo.thumb.src} className="museum-row">
              <button
                type="button"
                ref={(element) => {
                  thumbButtons.current[index] = element;
                }}
                onClick={() => open(index)}
                className="grid w-full grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-4 px-1 py-4 text-left sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:gap-6 sm:px-3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                <img
                  src={photo.thumb.src}
                  srcSet={photo.thumb.srcSet}
                  sizes="8rem"
                  width={photo.thumb.width}
                  height={photo.thumb.height}
                  alt=""
                  loading={index < EAGER_THUMBS * 2 ? "eager" : "lazy"}
                  decoding="async"
                  className="aspect-4/3 w-full object-cover shadow-sm"
                />
                <span className="min-w-0">
                  <span className="line-clamp-3 block leading-snug text-ink">{photo.alt}</span>
                  <span className="label-small mt-1.5 block text-sm text-ink/80">
                    {siteName.get(photo.site)}
                    {year !== null && (
                      <>
                        <span aria-hidden="true"> · </span>
                        <span className="sr-only">, </span>
                        {formatYear(year, lang)}
                      </>
                    )}
                  </span>
                </span>
                <span aria-hidden="true" className="hidden text-xl text-crimson sm:block">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

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
