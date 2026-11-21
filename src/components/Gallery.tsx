"use client";

import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";

import PhotoView from "@/components/PhotoView";
import MuseumErrorBoundary from "@/components/gallery/MuseumErrorBoundary";
import { MUSEUM_COMPACT_QUERY, REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/breakpoints";
import { formatNumber, formatYear } from "@/lib/format";
import type { Dictionary } from "@/lib/i18n";
import type { GalleryPhoto } from "@/lib/images";
import { INITIAL_POSE } from "@/lib/museum-layout";
import type { WorldPose } from "@/lib/museum-world";
import type { MuseumApi } from "@/components/gallery/MuseumCanvas";
import type { Locale } from "@/types/locale";
import { useWebGL } from "@/lib/webgl";

// Client-only 3D layer, code-split away from the initial bundle (same pattern as MapView).
const MuseumCanvas = dynamic(() => import("@/components/gallery/MuseumCanvas"), {
  ssr: false,
  loading: () => <MuseumLoading />,
});

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
  /** "Read more": the 3D close-up links each photograph to its site's page. */
  readMore?: string;
}

/** Reads ?site= from the URL. Must sit inside <Suspense> (static export requirement). */
export function GalleryFromUrl(props: Omit<GalleryProps, "requestedSite">) {
  const searchParams = useSearchParams();
  return <Gallery {...props} requestedSite={searchParams.get("site")} />;
}

type View = "grid" | "hanging" | "list";
/** sessionStorage key: the chosen view lasts for the visit (this tab), not forever. "grid" = the 3D museum. */
const VIEW_KEY = "gallery-view";
const VIEW_EVENT = "gallery-view-change";
/** Used when storage is blocked (private windows, site data off): the switch still works on this page. */
let memoryView: View | null = null;

interface OpenState {
  index: number;
  from: HTMLElement | null;
}

// The chosen view lives outside React (sessionStorage), so the component subscribes to it with
// useSyncExternalStore, React's hook for reading outside state without a render mismatch.
function readView(): View {
  if (memoryView) return memoryView;
  try {
    const saved = window.sessionStorage.getItem(VIEW_KEY);
    return saved === "list" || saved === "hanging" ? saved : "grid";
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

const reducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches;

/** How far the middle of the string sags below its ends, in px (recovered from 6bed439). */
const SAG = 34;
const STRING_TOP = 18;

/** Decorative view glyphs: no words, no labels, no extra accessibility text. */
function MuseumIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="view-icon" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4.5h18v15H3zM9.5 19.5V9.5L15 5.5v14" />
    </svg>
  );
}

function HangingIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" className="view-icon" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2.5 5.5q9.5 8 19 0M7 7v6h6V9.5M14.5 9.5v5h5V8.5" />
    </svg>
  );
}

/** Shown while the client-only Three.js chunk loads; the localized label is overlaid by Gallery. */
function MuseumLoading() {
  return (
    <div className="museum-loading" aria-hidden="true">
      <span className="museum-loading-mark" />
    </div>
  );
}

/**
 * The gallery (Shutabug's collection page, docs/ui-match/reference-notes.md §2).
 *
 * Gallery view: with WebGL the 3D museum is the visual layer on every screen; drag to look, wheel or
 * pinch to walk, use the touch buttons, and click a framed print to open the one existing PhotoView.
 * The hanging view is an explicit alternative, and the original hanging line from 6bed439 is also the
 * fallback when WebGL is unavailable or initialization fails. All presentations share this one DOM
 * tree, its data, filters, photo view and saved state.
 *
 * List view: rows with a photo, the caption, the site and the year; a row opens the same photo view.
 * The chosen view is remembered for the visit. No new words are introduced: the third view control
 * uses existing DOM text plus numerals, which the text lock does not count as words.
 */
export default function Gallery({ lang, photos, sites, credit, year, labels, requestedSite = null, readMore }: GalleryProps) {
  const pathname = usePathname();
  const showFilter = sites.length > 1;

  // ?site=nanak-math preselects a tab (links from the detail pages use it).
  const preselected = showFilter && requestedSite && sites.some((site) => site.slug === requestedSite) ? requestedSite : "all";
  const [filter, setFilter] = useState<string>(preselected);
  const [open, setOpen] = useState<OpenState | null>(null);
  const captionId = useId();
  const roomId = useId();
  const viewId = useId();
  const walkRef = useRef<HTMLDivElement>(null);
  // The prerendered HTML is the gallery view (server snapshot); after hydration the remembered view is read.
  const view = useSyncExternalStore(subscribeView, readView, () => "grid" as const);
  // False during prerender, checked after hydration; gates the client-only 3D layer (DOM gallery is the fallback).
  const webgl = useWebGL();
  // Compact/touch screens get a narrower hall, a wider camera and visible touch controls — never a
  // different gallery. Reduced motion only removes camera easing; it does not select the 2D view.
  const compact = useMediaQuery(MUSEUM_COMPACT_QUERY);
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY);
  const [museumFailed, setMuseumFailed] = useState(false);
  const [museumReady, setMuseumReady] = useState(false);
  const failMuseum = useCallback(() => {
    setMuseumFailed(true);
    setMuseumReady(false);
  }, []);
  const readyMuseum = useCallback(() => setMuseumReady(true), []);
  // Every switch away from the museum clears its ready flag in the event handler, so the next
  // mount shows the loading state until that renderer reports its own onCreated.
  const selectView = useCallback((next: View) => {
    setMuseumReady(false);
    chooseView(next);
  }, []);
  const galleryView = view !== "list";
  const useMuseum = webgl && view === "grid" && !museumFailed;
  const hanging = galleryView && !useMuseum;
  // Camera state lives here so layout switches never reset the view.
  const poseRef = useRef<WorldPose>({ seg: 0, ...INITIAL_POSE });
  const museumApi = useRef<MuseumApi | null>(null);
  const setMuseumApi = useCallback((api: MuseumApi | null) => {
    museumApi.current = api;
  }, []);
  const [activeIndex, setActiveIndex] = useState(0);
  const [focusNonce, setFocusNonce] = useState(0);
  const [lineCurrent, setLineCurrent] = useState(0);
  const internalFocus = useRef(false);
  const lastIndexRef = useRef(0);

  const siteName = new Map(sites.map((site) => [site.slug, site.name]));
  const shown = filter === "all" ? photos : photos.filter((photo) => photo.site === filter);
  const formatCount = (n: number) => (n === 1 ? labels.count.one : labels.count.other).replace("{n}", formatNumber(n, lang));
  const twoDigits = (n: number) => {
    const text = formatNumber(n, lang);
    return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
  };

  useEffect(() => {
    lastIndexRef.current = activeIndex;
  }, [activeIndex]);

  /** All sites keep their room (and the site-name word) even when a filter empties it; it is just hidden. */
  const rooms = sites.map((site) => ({
    ...site,
    number: twoDigits(sites.findIndex((entry) => entry.slug === site.slug) + 1),
    headingId: `${roomId}-${site.slug}`,
    frames: shown.flatMap((photo, index) => (photo.site === site.slug ? [{ photo, index }] : [])),
  }));

  function choose(slug: string) {
    setFilter(slug);
    lastIndexRef.current = 0;
    setActiveIndex(0);
    setLineCurrent(0);
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

  /** Recovered from 6bed439: bring a hanging print to the middle of the line. */
  const centre = useCallback((index: number, smooth = true) => {
    const track = walkRef.current;
    const item = track?.querySelectorAll<HTMLElement>(".walk-room:not([hidden]) .wall-item")[index];
    if (!track || !item) return;
    track.scrollTo({
      left: item.offsetLeft + item.offsetWidth / 2 - track.clientWidth / 2,
      behavior: smooth && !reducedMotion() ? "smooth" : "auto",
    });
  }, []);

  /** Focus the matching accessible DOM frame without asking the camera to steer. */
  const focusDomFrame = useCallback((index: number) => {
    const button = walkRef.current?.querySelectorAll<HTMLElement>(".walk-room:not([hidden]) .wall-item")[index]?.querySelector("button");
    if (!button) {
      internalFocus.current = false;
      return;
    }
    internalFocus.current = true;
    button.focus({ preventScroll: true });
    requestAnimationFrame(() => {
      internalFocus.current = false;
    });
  }, []);

  // Returning from List, a filter change, or a layout switch restores the print of the last visit.
  useEffect(() => {
    if (view === "list") return;
    const id = requestAnimationFrame(() => {
      if (hanging) centre(lastIndexRef.current, false);
      else stepTo(lastIndexRef.current, "auto");
    });
    return () => cancelAnimationFrame(id);
  }, [view, filter, hanging, centre, stepTo]);

  // Walk: wheel moves sideways, touch swipes natively. The middle frame gets the spotlight and each
  // image drifts a few pixels against the scroll (a light parallax), unless motion is reduced.
  useEffect(() => {
    const track = walkRef.current;
    if (!track || view === "list" || useMuseum || hanging) return;
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
        const centreX = box.left + box.width / 2;
        const distance = Math.abs(centreX - middle);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
        const drift = reduce ? 0 : ((centreX - middle) / Math.max(track.clientWidth, 1)) * -18;
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
  }, [view, filter, stepTo, useMuseum, hanging]);

  // The recovered hanging line (6bed439): each print hangs from the sagging string at the height and
  // tilt of the curve under it; the middle print is current. This also runs on roomy screens when the
  // visitor chooses the hanging view or WebGL is unavailable. Wheel moves the line, swipe is native,
  // arrows and focus step one print. Reduced motion pages one at a time instead of gliding.
  useEffect(() => {
    if (!hanging) return;
    const track = walkRef.current;
    if (!track) return;
    const items = Array.from(track.querySelectorAll<HTMLElement>(".walk-room:not([hidden]) .wall-item"));
    const buttons = items.map((item) => item.querySelector<HTMLElement>("button")).filter((button): button is HTMLElement => Boolean(button));
    let frame = 0;
    let lastStep = 0;

    const hang = () => {
      frame = 0;
      const width = Math.max(track.clientWidth, 1);
      const left = track.getBoundingClientRect().left;
      let nearest = 0;
      let best = Infinity;
      buttons.forEach((button, index) => {
        const box = items[index].getBoundingClientRect();
        const x = (box.left + box.width / 2 - left) / width;
        const clamped = Math.min(Math.max(x, -0.2), 1.2);
        const drop = 4 * SAG * clamped * (1 - clamped);
        const slope = (4 * SAG * (1 - 2 * clamped)) / width;
        button.style.transform = `translateY(${drop}px) rotate(${(Math.atan(slope) * 180) / Math.PI}deg)`;
        const distance = Math.abs(x - 0.5);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });
      track.dataset.current = String(nearest);
      setLineCurrent(nearest);
      lastIndexRef.current = nearest;
      items.forEach((item, index) => {
        if (index === nearest) item.setAttribute("data-current", "");
        else item.removeAttribute("data-current");
      });
    };

    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(hang);
    };
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      const max = track.scrollWidth - track.clientWidth;
      const atEnd = event.deltaY > 0 ? track.scrollLeft >= max - 1 : track.scrollLeft <= 1;
      if (atEnd) return;
      event.preventDefault();
      if (!reducedMotion()) {
        track.scrollLeft += event.deltaY;
        return;
      }
      const now = Date.now();
      if (now - lastStep < 300) return;
      lastStep = now;
      const current = Number(track.dataset.current ?? "0");
      centre(Math.min(Math.max(current + Math.sign(event.deltaY), 0), items.length - 1), false);
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
      buttons.forEach((button) => button.style.removeProperty("transform"));
      items.forEach((item) => item.removeAttribute("data-current"));
    };
  }, [filter, hanging, centre]);

  const tabs = [{ slug: "all", name: labels.all }, ...sites];
  const threeView = webgl && !museumFailed;

  return (
    <>
      {/* One toolbar row: the photo count, the site filter (their collections line), the view pill.
          Phones: the filter on its own row above. Site tabs show the real site names from content, so
          they are understandable without decoding room numbers. The third view control reuses the
          existing Gallery word and a numeral, so the text lock stays at zero. */}
      <div className="wrap mb-1 grid grid-cols-[1fr_auto] items-center gap-x-4 md:grid-cols-[1fr_auto_1fr]">
        {showFilter && (
          <div role="group" aria-label={labels.filterLabel} className="filter-tabs col-span-2 flex flex-wrap justify-center gap-x-2 md:col-span-1 md:col-start-2 md:row-start-1">
            {tabs.map((tab) => (
              <button
                key={tab.slug}
                type="button"
                aria-pressed={filter === tab.slug}
                onClick={() => choose(tab.slug)}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}
        <p className="mono muted whitespace-nowrap md:col-start-1 md:row-start-1" aria-live="polite">
          {formatCount(shown.length)}
        </p>
        <div className="md:col-start-3 md:row-start-1 md:justify-self-end">
          <div role="group" aria-label={labels.view.label} className="view-pill">
            {/* With the third control hidden, Gallery represents the hanging-memory presentation. */}
            <button
              type="button"
              aria-pressed={view === "grid" || (!threeView && view === "hanging")}
              aria-labelledby={`${viewId}-gallery ${viewId}-museum-index`}
              onClick={() => selectView("grid")}
            >
              <MuseumIcon />
              <span id={`${viewId}-gallery`}>{labels.view.grid}</span>
              <span id={`${viewId}-museum-index`} className="view-index">
                {twoDigits(1)}
              </span>
            </button>
            {threeView && (
              <button
                type="button"
                aria-pressed={view === "hanging"}
                aria-labelledby={`${viewId}-hanging ${viewId}-hanging-index`}
                onClick={() => selectView("hanging")}
              >
                <HangingIcon />
                <span id={`${viewId}-hanging`} className="sr-only">
                  {labels.view.hanging}
                </span>
                <span id={`${viewId}-hanging-index`} className="view-index">
                  {twoDigits(2)}
                </span>
              </button>
            )}
            <button type="button" aria-pressed={view === "list"} onClick={() => selectView("list")}>
              {labels.view.list}
            </button>
          </div>
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="wrap rule py-16 text-center text-lg">{labels.empty}</p>
      ) : view === "list" ? (
        <ul className="wrap mx-auto max-w-[72rem]">
          {shown.map((photo, index) => (
            <li key={photo.thumb.src}>
              <button type="button" className="list-row" onClick={(event) => openPhoto(index, event.currentTarget.querySelector("img"))}>
                {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                <img
                  src={photo.thumb.src}
                  srcSet={photo.thumb.srcSet}
                  sizes="(min-width: 48rem) 20rem, 8rem"
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
                <span className="list-caption leading-snug">{photo.alt}</span>
                <span className="list-meta mono muted md:text-right">
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
      ) : (
        <>
          {view === "grid" && (museumFailed || !webgl) && (
            <p className="wrap museum-note">{labels.museumNoWebGL}</p>
          )}
          <div className={`wall-stage${useMuseum ? " museum-active" : ""}${hanging ? " hanging-active" : ""}`}>
          {useMuseum && (
            <MuseumErrorBoundary onError={failMuseum}>
              <MuseumCanvas
                photos={photos}
                sites={sites}
                filter={filter}
                lang={lang}
                enabled={!open}
                reducedMotion={reduced}
                activeIndex={activeIndex}
                compact={compact}
                labels={{
                  help: labels.museumHelp,
                  forward: labels.museumForward,
                  back: labels.museumBack,
                  left: labels.museumTurnLeft,
                  right: labels.museumTurnRight,
                  close: labels.lightbox.Close,
                  previous: labels.lightbox.Previous,
                  next: labels.lightbox.Next,
                  readMore,
                }}
                heritageBase={`/${lang}/heritage/`}
                credit={credit}
                poseRef={poseRef}
                focusNonce={focusNonce}
                onApi={setMuseumApi}
                onReady={readyMuseum}
                onActiveIndex={setActiveIndex}
                onFocusChange={(index) => {
                  // Stepping back returns focus to the frame that opened the close-up; that focus
                  // must not steer the camera away from where the visitor stood.
                  if (index !== null) return;
                  internalFocus.current = true;
                  requestAnimationFrame(() => {
                    internalFocus.current = false;
                  });
                }}
                onFail={failMuseum}
              />
            </MuseumErrorBoundary>
          )}
          {useMuseum && !museumReady && (
            <div className="museum-loading museum-loading-label" role="status" aria-live="polite">
              <span className="museum-loading-mark" aria-hidden="true" />
              <span>{labels.museumLoading}</span>
            </div>
          )}
          {/* The string and its counter are inert geometry and numerals: no words are added. */}
          <svg aria-hidden="true" className="line-string" viewBox="0 0 100 40" preserveAspectRatio="none">
            <path
              d={`M0 ${STRING_TOP / 2} Q50 ${STRING_TOP / 2 + SAG} 100 ${STRING_TOP / 2}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div
            ref={walkRef}
            className="walk-track"
            tabIndex={0}
            onKeyDown={(event) => {
              // On large screens the 3D controls own the arrow keys; the DOM layer stays focusable.
              if (useMuseum) return;
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const current = Number(walkRef.current?.dataset.current ?? "0");
              const next = Math.min(Math.max(current + (event.key === "ArrowRight" ? 1 : -1), 0), shown.length - 1);
              centre(next);
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
                      onClick={(event) => {
                        // In the 3D museum the camera walks up to the photograph instead of opening a view.
                        if (useMuseum && museumApi.current) museumApi.current.open(index);
                        else openPhoto(index, event.currentTarget.querySelector("img"), event.currentTarget);
                      }}
                      onFocus={() => {
                        setActiveIndex(index);
                        if (internalFocus.current) return;
                        if (useMuseum) setFocusNonce((nonce) => nonce + 1);
                        else centre(index);
                      }}
                    >
                      <span className="wall-mat">
                        {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                        <img
                          src={photo.thumb.src}
                          srcSet={photo.thumb.srcSet}
                          sizes="(min-width: 64rem) 26rem, 20rem"
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
          <p aria-hidden="true" className="mono line-counter absolute right-[var(--gutter)] bottom-0 flex items-center gap-3 tabular-nums">
            {twoDigits(lineCurrent + 1)} <span className="inline-block h-px w-10 bg-current" /> {twoDigits(shown.length)}
          </p>
          </div>
        </>
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
          onIndexChange={(index) => {
            setOpen((value) => (value ? { ...value, index } : value));
            if (useMuseum) {
              // Lightbox paging changes the spotlight, never the camera the visitor walked to.
              lastIndexRef.current = index;
              setActiveIndex(index);
            } else if (hanging) centre(index, false);
            else stepTo(index, "auto");
          }}
          onClose={() => {
            const closingIndex = open.index;
            // PhotoView's FLIP source is an empty proxy here; return focus to the accessible frame.
            // Set the guard now: PhotoView also restores focus synchronously before our deferred call,
            // and neither focus event may steer the camera away from where the visitor walked.
            if (useMuseum) {
              internalFocus.current = true;
              requestAnimationFrame(() => focusDomFrame(closingIndex));
            }
            setOpen(null);
          }}
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
