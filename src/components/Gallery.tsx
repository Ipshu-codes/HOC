"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useId, useState, useSyncExternalStore } from "react";

import PhotoView from "@/components/PhotoView";
import { formatNumber, formatYear } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { GalleryPhoto } from "@/lib/images";
import type { Locale } from "@/types/locale";

interface GalleryProps {
  lang: Locale;
  photos: GalleryPhoto[];
  /** Sites with photos on this build, in display order. Filter tabs appear only when there are 2+. */
  sites: { slug: string; name: string }[];
  /** "Photos: Samyojan, 2026", shown in the photo view and on the wall; null when there is no credit to show. */
  credit: string | null;
  /** Year the photos were taken (content/credits.json → photos.year), shown in List view; null hides it. */
  year: number | null;
  /** Only the gallery strings: the whole dictionary would be sent to the browser. */
  labels: Dictionary["gallery"];
  /** Site slug from ?site=…, if any (see GalleryFromUrl). */
  requestedSite?: string | null;
}

/** Reads ?site= from the URL. Must sit inside <Suspense> (static export requirement). */
export function GalleryFromUrl(props: Omit<GalleryProps, "requestedSite">) {
  const searchParams = useSearchParams();
  return <Gallery {...props} requestedSite={searchParams.get("site")} />;
}

type View = "grid" | "list";
/** sessionStorage key: the chosen view lasts for the visit (this tab), not forever. "grid" = the wall. */
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
    // ignore: the choice in memory only
  }
  window.dispatchEvent(new Event(VIEW_EVENT));
}

/**
 * The gallery (Shutabug's collection page, docs/ui-match/reference-notes.md §2).
 *
 * Gallery view: a deep-red museum wall with CSS spotlight pools. Every photo hangs in a dark frame
 * with a cream mat and a deep shadow; the grid gives the frames several sizes and aspect ratios. Each
 * cream placard is the photo's existing alt text, and the single wall credit is the page's existing
 * photo credit — no new words are introduced (the text lock compares word counts on every page).
 * Click a frame to open the photo view.
 *
 * List view: rows with a photo, the caption, the site and the year; a row opens the same photo view.
 * The chosen view is remembered for the visit.
 */
export default function Gallery({ lang, photos, sites, credit, year, labels, requestedSite = null }: GalleryProps) {
  const pathname = usePathname();
  const showFilter = sites.length > 1;

  // ?site=nanak-math preselects a tab (links from the detail pages use it).
  const preselected = showFilter && requestedSite && sites.some((site) => site.slug === requestedSite) ? requestedSite : "all";
  const [filter, setFilter] = useState<string>(preselected);
  const [open, setOpen] = useState<{ index: number; from: HTMLElement | null } | null>(null);
  const captionId = useId();
  // The prerendered HTML is the gallery view (server snapshot); after hydration the remembered view is read.
  const view = useSyncExternalStore(subscribeView, readView, () => "grid" as const);

  const siteName = new Map(sites.map((site) => [site.slug, site.name]));
  const shown = filter === "all" ? photos : photos.filter((photo) => photo.site === filter);
  const formatCount = (n: number) => (n === 1 ? labels.count.one : labels.count.other).replace("{n}", formatNumber(n, lang));

  function choose(slug: string) {
    setFilter(slug);
    // Keep the choice in the URL (shareable) without a navigation or scroll jump.
    window.history.replaceState(null, "", slug === "all" ? pathname : `${pathname}?site=${slug}`);
  }

  const openPhoto = (index: number, from: HTMLElement | null) => {
    setOpen({ index, from });
  };

  const tabs = [{ slug: "all", name: labels.all }, ...sites];

  return (
    <>
      {/* One toolbar row: the photo count, the site filter (their collections line), the Gallery/List pill.
          Phones: the filter on its own row above. */}
      <div className="wrap mb-1 grid grid-cols-[1fr_auto] items-center gap-x-4 md:grid-cols-[1fr_auto_1fr]">
        {showFilter && (
          <div role="group" aria-label={labels.filterLabel} className="filter-tabs col-span-2 flex flex-wrap justify-center gap-x-2 md:col-span-1 md:col-start-2 md:row-start-1">
            {tabs.map((tab) => (
              <button key={tab.slug} type="button" aria-pressed={filter === tab.slug} onClick={() => choose(tab.slug)}>
                {tab.name}
              </button>
            ))}
          </div>
        )}
        <p className="mono muted md:col-start-1 md:row-start-1" aria-live="polite">
          {formatCount(shown.length)}
        </p>
        <div className="md:col-start-3 md:row-start-1 md:justify-self-end">
          <div role="group" aria-label={labels.view.label} className="view-pill">
            {(["grid", "list"] as const).map((option) => (
              <button key={option} type="button" aria-pressed={view === option} onClick={() => chooseView(option)}>
                {labels.view[option]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="wrap rule py-16 text-center text-lg">{labels.empty}</p>
      ) : view === "grid" ? (
        <div className="wall-stage">
          <ul className="wall-grid">
            {shown.map((photo, index) => (
              <li key={photo.thumb.src} className="wall-item">
                <button
                  type="button"
                  className="wall-frame"
                  aria-labelledby={`${captionId}-${index}`}
                  onClick={(event) => openPhoto(index, event.currentTarget.querySelector("img"))}
                >
                  <span className="wall-mat">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                    <img
                      src={photo.thumb.src}
                      srcSet={photo.thumb.srcSet}
                      sizes="(min-width: 64rem) 22rem, (min-width: 48rem) 16rem, 42vw"
                      width={photo.thumb.width}
                      height={photo.thumb.height}
                      alt=""
                      loading={index < 6 ? "eager" : "lazy"}
                      fetchPriority={index === 0 ? "high" : "auto"}
                      decoding="async"
                    />
                  </span>
                </button>
                {/* The placard names the frame (aria-labelledby); it is the photo's existing alt text. */}
                <span id={`${captionId}-${index}`} className="wall-placard">
                  {photo.alt}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <ul className="wrap mx-auto max-w-[56rem]">
          {shown.map((photo, index) => (
            <li key={photo.thumb.src}>
              <button type="button" className="list-row" onClick={(event) => openPhoto(index, event.currentTarget.querySelector("img"))}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                <img
                  src={photo.thumb.src}
                  srcSet={photo.thumb.srcSet}
                  sizes="(min-width: 48rem) 20rem, 11rem"
                  width={photo.thumb.width}
                  height={photo.thumb.height}
                  alt=""
                  loading={index < 4 ? "eager" : "lazy"}
                  decoding="async"
                  data-loading=""
                  // Sharpens from a blur once loaded (CSS); an image that loaded before React started is shown at once.
                  ref={(img) => {
                    if (img?.complete) img.removeAttribute("data-loading");
                  }}
                  onLoad={(event) => event.currentTarget.removeAttribute("data-loading")}
                />
                <span className="leading-snug">{photo.alt}</span>
                <span className="mono muted md:text-right">
                  {siteName.get(photo.site)}
                  {year !== null && (
                    <>
                      <span aria-hidden="true"> · </span>
                      <span className="sr-only">, </span>
                      {formatYear(year, lang)}
                    </>
                  )}
                </span>
                <span aria-hidden="true" className="mono hidden md:block">
                  →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* The page's existing credit line, now a small plaque under the wall/places. */}
      {credit && <p className="wrap wall-credit">{credit}</p>}

      {open && (
        <PhotoView
          photos={shown}
          index={open.index}
          from={open.from}
          credit={credit}
          siteName={siteName}
          labels={labels.lightbox}
          onIndexChange={(index) => setOpen((value) => (value ? { ...value, index } : value))}
          onClose={() => setOpen(null)}
          sourceFor={(index) =>
            (view === "grid"
              ? document.querySelectorAll<HTMLImageElement>(".wall-frame img")[index]
              : document.querySelectorAll<HTMLImageElement>(".list-row img")[index]) ?? null
          }
        />
      )}
    </>
  );
}
