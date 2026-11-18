"use client";

import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import PhotoView from "@/components/PhotoView";
import { formatNumber, formatYear } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { GalleryPhoto } from "@/lib/images";
import type { Locale } from "@/types/locale";
import { useWebGL } from "@/lib/webgl";

// Client-only 3D layer, code-split away from the initial bundle (same pattern as MapView).
// Phase 1: the component is an empty scaffold, so the DOM gallery below still renders unchanged.
const MuseumCanvas = dynamic(() => import("@/components/gallery/MuseumCanvas"), { ssr: false });

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
/** sessionStorage key: the chosen view lasts for the visit (this tab), not forever. "grid" = the walk. */
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

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The gallery (Shutabug's collection page, docs/ui-match/reference-notes.md §2).
 *
 * Gallery view: a walk along a deep-red museum wall, one room per heritage site. Each room's plaque
 * carries the existing site name and its "01"/"02" number; the frames carry the photos' existing alt
 * text. Swipe or scroll sideways to walk, use the arrow keys to step between frames, and the frame
 * nearest the middle gets the brightest spotlight. With reduced motion the walk becomes plain paging:
 * no parallax, no smooth scrolling. No new words are introduced (the text lock counts every page).
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
  const roomId = useId();
  const walkRef = useRef<HTMLDivElement>(null);
  // The prerendered HTML is the gallery view (server snapshot); after hydration the remembered view is read.
  const view = useSyncExternalStore(subscribeView, readView, () => "grid" as const);
  // False during prerender, checked after hydration; gates the client-only 3D layer (DOM gallery is the fallback).
  const webgl = useWebGL();

  const siteName = new Map(sites.map((site) => [site.slug, site.name]));
  const shown = filter === "all" ? photos : photos.filter((photo) => photo.site === filter);
  const formatCount = (n: number) => (n === 1 ? labels.count.one : labels.count.other).replace("{n}", formatNumber(n, lang));
  const twoDigits = (n: number) => {
    const text = formatNumber(n, lang);
    return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
  };

  /** All sites keep their room (and the site-name word) even when a filter empties it; it is just hidden. */
  const rooms = sites.map((site) => ({
    ...site,
    number: twoDigits(sites.findIndex((entry) => entry.slug === site.slug) + 1),
    headingId: `${roomId}-${site.slug}`,
    frames: shown.flatMap((photo, index) => (photo.site === site.slug ? [{ photo, index }] : [])),
  }));

  function choose(slug: string) {
    setFilter(slug);
    // Keep the choice in the URL (shareable) without a navigation or scroll jump.
    window.history.replaceState(null, "", slug === "all" ? pathname : `${pathname}?site=${slug}`);
  }

  const zooming = useRef(false);

  /** A frame grows briefly under the finger/cursor, then hands off to the existing gliding photo view. */
  const openPhoto = (index: number, from: HTMLElement | null, zoom?: HTMLElement | null) => {
    if (zooming.current) return;
    if (!zoom || !from || reducedMotion()) {
      setOpen({ index, from });
      return;
    }
    zooming.current = true;
    const animation = zoom.animate(
      [
        { transform: "scale(1)" },
        { transform: "scale(1.2)", offset: 0.75 },
        { transform: "scale(1.22)" },
      ],
      { duration: 230, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
    );
    animation.onfinish = () => {
      setOpen({ index, from });
      // The view has measured the enlarged frame; settle it back so closing glides to its usual place.
      requestAnimationFrame(() => animation.cancel());
    };
    animation.oncancel = () => {
      zooming.current = false;
    };
  };

  /** Bring a frame to the middle; paging is instant when the visitor asked for less motion. */
  const stepTo = useCallback((index: number, behavior?: ScrollBehavior) => {
    const track = walkRef.current;
    const frame = track?.querySelectorAll<HTMLElement>(".walk-room:not([hidden]) .wall-item")[index];
    if (!track || !frame) return;
    track.scrollTo({
      left: frame.offsetLeft - (track.clientWidth - frame.offsetWidth) / 2,
      behavior: behavior ?? (reducedMotion() ? "auto" : "smooth"),
    });
  }, []);

  // Walk: wheel moves sideways, touch swipes natively. The middle frame gets the spotlight and each
  // image drifts a few pixels against the scroll (a light parallax), unless motion is reduced.
  useEffect(() => {
    const track = walkRef.current;
    if (!track || view !== "grid") return;
    const frames = Array.from(track.querySelectorAll<HTMLElement>(".walk-room:not([hidden]) .wall-item"));
    const reduce = reducedMotion();
    let frame = 0;
    let lastStep = 0;

    const update = () => {
      frame = 0;
      const middle = track.getBoundingClientRect().left + track.clientWidth / 2;
      let nearest = 0;
      let best = Infinity;
      frames.forEach((item, index) => {
        const box = item.getBoundingClientRect();
        const centre = box.left + box.width / 2;
        const distance = Math.abs(centre - middle);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
        const drift = reduce ? 0 : ((centre - middle) / Math.max(track.clientWidth, 1)) * -18;
        item.style.setProperty("--parallax", `${drift.toFixed(1)}px`);
      });
      track.dataset.current = String(nearest);
      frames.forEach((item, index) => {
        if (index === nearest) item.setAttribute("data-near", "");
        else item.removeAttribute("data-near");
      });
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(update);
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = track.scrollWidth - track.clientWidth;
      const atEnd = event.deltaY > 0 ? track.scrollLeft >= max - 1 : track.scrollLeft <= 1;
      if (atEnd) return;
      event.preventDefault();
      if (!reduce) {
        track.scrollLeft += event.deltaY;
        return;
      }
      // Reduced motion: one frame per deliberate wheel step, no glide.
      const now = Date.now();
      if (now - lastStep < 300) return;
      lastStep = now;
      const current = Number(track.dataset.current ?? "0");
      stepTo(Math.min(Math.max(current + Math.sign(event.deltaY), 0), frames.length - 1), "auto");
    };

    frame = requestAnimationFrame(update);
    track.addEventListener("scroll", onScroll, { passive: true });
    track.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("resize", onScroll);
    return () => {
      track.removeEventListener("scroll", onScroll);
      track.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
      frames.forEach((item) => {
        item.removeAttribute("data-near");
        item.style.removeProperty("--parallax");
      });
    };
  }, [view, filter, stepTo]);

  const tabs = [{ slug: "all", name: labels.all }, ...sites];

  return (
    <>
      {/* One toolbar row: the photo count, the site filter (their collections line), the Gallery/List pill.
          Phones: the filter on its own row above. Site tabs show their room number; the room plaque is
          their accessible name via aria-labelledby, so the site name is only in the page once. */}
      <div className="wrap mb-1 grid grid-cols-[1fr_auto] items-center gap-x-4 md:grid-cols-[1fr_auto_1fr]">
        {showFilter && (
          <div role="group" aria-label={labels.filterLabel} className="filter-tabs col-span-2 flex flex-wrap justify-center gap-x-2 md:col-span-1 md:col-start-2 md:row-start-1">
            {tabs.map((tab) => {
              const site = sites.find((entry) => entry.slug === tab.slug);
              return (
                <button
                  key={tab.slug}
                  type="button"
                  aria-pressed={filter === tab.slug}
                  aria-labelledby={site ? rooms.find((room) => room.slug === site.slug)?.headingId : undefined}
                  onClick={() => choose(tab.slug)}
                >
                  {site ? twoDigits(sites.findIndex((entry) => entry.slug === site.slug) + 1) : tab.name}
                </button>
              );
            })}
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
        <div className={`wall-stage${webgl ? " museum-active" : ""}`}>
          {webgl && <MuseumCanvas photos={photos} sites={sites} filter={filter} lang={lang} />}
          <div
            ref={walkRef}
            className="walk-track"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const current = Number(walkRef.current?.dataset.current ?? "0");
              const next = Math.min(Math.max(current + (event.key === "ArrowRight" ? 1 : -1), 0), shown.length - 1);
              stepTo(next);
              walkRef.current?.querySelectorAll<HTMLElement>(".walk-room:not([hidden]) .wall-item")[next]?.querySelector("button")?.focus({ preventScroll: true });
            }}
          >
            {rooms.map((room) => (
              <section key={room.slug} className="walk-room" hidden={room.frames.length === 0}>
                <div className="room-plaque">
                  <span className="room-number" aria-hidden="true">
                    {room.number}
                  </span>
                  <h2 id={room.headingId} className="room-name">
                    {room.name}
                  </h2>
                </div>
                {room.frames.map(({ photo, index }) => (
                  <figure key={photo.thumb.src} className="wall-item">
                    <button
                      type="button"
                      className="wall-frame"
                      data-frame-index={index}
                      aria-labelledby={`${captionId}-${index}`}
                      onClick={(event) => openPhoto(index, event.currentTarget.querySelector("img"), event.currentTarget)}
                    >
                      <span className="wall-mat">
                        {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                        <img
                          src={photo.thumb.src}
                          srcSet={photo.thumb.srcSet}
                          sizes="(min-width: 64rem) 18rem, 14rem"
                          width={photo.thumb.width}
                          height={photo.thumb.height}
                          alt=""
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                    </button>
                    {/* The placard names the frame (aria-labelledby); it is the photo's existing alt text. */}
                    <figcaption id={`${captionId}-${index}`} className="wall-placard">
                      {photo.alt}
                    </figcaption>
                  </figure>
                ))}
              </section>
            ))}
          </div>
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
            document.querySelector<HTMLImageElement>(`.wall-frame[data-frame-index="${index}"] img`) ??
            document.querySelectorAll<HTMLImageElement>(".list-row img")[index] ??
            null
          }
        />
      )}
    </>
  );
}
