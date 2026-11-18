"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

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
  /** "Photos: Samyojan, 2026", shown in the photo view; null when there is no credit to show. */
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
/** sessionStorage key: the chosen view lasts for the visit (this tab), not forever. "grid" = the hanging line. */
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

/** How far the middle of the string sags below its ends, in px. */
const SAG = 34;
const STRING_TOP = 18;

/**
 * The gallery (Shutabug's collection page, docs/ui-match/reference-notes.md §2).
 *
 * Gallery view: the photos hang from a string as prints. The line is a horizontal scroller: swipe on a
 * phone, the mouse wheel or trackpad on a desktop (the line moves sideways; at either end the page
 * scrolls on), the arrow keys, or click/tap a print to bring it to the middle. The print in the middle
 * is the current one: its caption shows bottom left, the counter bottom right. Clicking the middle
 * print (or Enter) opens it in the photo view, which glides out of the print.
 *
 * List view: rows with a photo, the caption, the site and the year; a row opens the same photo view.
 * The chosen view is remembered for the visit. Captions are the photos' alt text from content/.
 */
export default function Gallery({ lang, photos, sites, credit, year, labels, requestedSite = null }: GalleryProps) {
  const pathname = usePathname();
  const showFilter = sites.length > 1;

  // ?site=nanak-math preselects a tab (links from the detail pages use it).
  const preselected = showFilter && requestedSite && sites.some((site) => site.slug === requestedSite) ? requestedSite : "all";
  const [filter, setFilter] = useState<string>(preselected);
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState<{ index: number; from: HTMLElement | null } | null>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const captionId = useId();
  // The prerendered HTML is the gallery view (server snapshot); after hydration the remembered view is read.
  const view = useSyncExternalStore(subscribeView, readView, () => "grid" as const);

  const siteName = new Map(sites.map((site) => [site.slug, site.name]));
  const shown = filter === "all" ? photos : photos.filter((photo) => photo.site === filter);
  const formatCount = (n: number) => (n === 1 ? labels.count.one : labels.count.other).replace("{n}", formatNumber(n, lang));
  const twoDigits = (n: number) => {
    const text = formatNumber(n, lang);
    return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
  };

  function choose(slug: string) {
    setFilter(slug);
    setCurrent(0);
    trackRef.current?.scrollTo({ left: 0 });
    // Keep the choice in the URL (shareable) without a navigation or scroll jump.
    window.history.replaceState(null, "", slug === "all" ? pathname : `${pathname}?site=${slug}`);
  }

  const tabs = [{ slug: "all", name: labels.all }, ...sites];

  /** Scroll the line so that print `index` is in the middle. */
  const centre = useCallback((index: number, smooth = true) => {
    const track = trackRef.current;
    const item = track?.children[index] as HTMLElement | undefined;
    if (!track || !item) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2, behavior: smooth && !reduce ? "smooth" : "auto" });
  }, []);

  // The line: hang each print on the string (its height and tilt follow the curve where it is), find the
  // print in the middle, and turn the mouse wheel into sideways movement.
  useEffect(() => {
    if (view !== "grid") return;
    const track = trackRef.current;
    if (!track) return;
    const buttons = Array.from(track.querySelectorAll<HTMLElement>(".line-print > button"));
    let frame = 0;
    const hang = () => {
      frame = 0;
      const width = track.clientWidth;
      const left = track.getBoundingClientRect().left;
      let nearest = 0;
      let best = Infinity;
      buttons.forEach((button, index) => {
        const box = button.parentElement!.getBoundingClientRect();
        const x = (box.left + box.width / 2 - left) / width; // 0 … 1 across the visible line
        const clamped = Math.min(Math.max(x, -0.2), 1.2);
        const drop = 4 * SAG * clamped * (1 - clamped); // the string's parabola
        const slope = (4 * SAG * (1 - 2 * clamped)) / width; // dy/dx at that point
        button.style.transform = `translateY(${drop}px) rotate(${(Math.atan(slope) * 180) / Math.PI}deg)`;
        const distance = Math.abs(x - 0.5);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });
      setCurrent(nearest);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(hang);
    };
    // Mouse wheel / trackpad: vertical movement moves the line sideways until it reaches an end.
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = track.scrollWidth - track.clientWidth;
      const atEnd = event.deltaY > 0 ? track.scrollLeft >= max - 1 : track.scrollLeft <= 1;
      if (atEnd) return;
      event.preventDefault();
      track.scrollLeft += event.deltaY;
    };
    frame = requestAnimationFrame(hang);
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onScroll);
    return () => {
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [view, filter]);

  const openPhoto = (index: number, from: HTMLElement | null) => {
    setOpen({ index, from });
  };

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
        <div ref={stageRef} className="line-stage pb-16">
          <svg aria-hidden="true" className="line-string" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path d={`M0 ${STRING_TOP / 2} Q50 ${STRING_TOP / 2 + SAG} 100 ${STRING_TOP / 2}`} fill="none" stroke="currentColor" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          <ul
            ref={trackRef}
            className="line-track"
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
                event.preventDefault();
                const next = Math.min(Math.max(current + (event.key === "ArrowRight" ? 1 : -1), 0), shown.length - 1);
                centre(next);
                (trackRef.current?.children[next]?.querySelector("button") as HTMLButtonElement | null)?.focus({ preventScroll: true });
              }
            }}
          >
            {shown.map((photo, index) => (
              <li key={photo.thumb.src} className="line-print" data-current={index === current ? "" : undefined}>
                <button
                  type="button"
                  aria-labelledby={`${captionId}-${index}`}
                  onClick={(event) => {
                    if (index === current) openPhoto(index, event.currentTarget.querySelector("img"));
                    else centre(index);
                  }}
                  onFocus={() => {
                    if (index !== current) centre(index);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                  <img
                    src={photo.thumb.src}
                    srcSet={photo.thumb.srcSet}
                    sizes="(min-width: 64rem) 17rem, 13rem"
                    width={photo.thumb.width}
                    height={photo.thumb.height}
                    alt=""
                    loading={index < 6 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                  />
                </button>
                {/* The caption names the print (aria-labelledby; the image is alt=""). It sits outside the
                    tilted button so it can show under the line, bottom left, while this print is in the middle. */}
                <span id={`${captionId}-${index}`} className="line-caption">
                  <span className="works-title block">{photo.alt}</span>
                </span>
              </li>
            ))}
          </ul>
          <p aria-hidden="true" className="mono absolute right-[var(--gutter)] bottom-0 flex items-center gap-3 tabular-nums">
            {twoDigits(current + 1)} <span className="inline-block h-px w-10 bg-current" /> {twoDigits(shown.length)}
          </p>
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

      {open && (
        <PhotoView
          photos={shown}
          index={open.index}
          from={open.from}
          credit={credit}
          siteName={siteName}
          labels={labels.lightbox}
          onIndexChange={(index) => {
            setOpen((value) => (value ? { ...value, index } : value));
            if (view === "grid") centre(index, false);
          }}
          onClose={() => setOpen(null)}
          sourceFor={(index) =>
            (view === "grid"
              ? trackRef.current?.children[index]?.querySelector("img")
              : document.querySelectorAll<HTMLImageElement>(".list-row img")[index]) ?? null
          }
        />
      )}
    </>
  );
}
