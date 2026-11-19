"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

export interface HeroSlide {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  /** Focal point as a CSS object-position, e.g. "center 30%": which part of a tall photo stays in the wide banner. */
  position?: string;
}

interface HeroSlidesProps {
  slides: HeroSlide[];
  /** Time each photo stays (content/home.json → heroIntervalMs). */
  intervalMs: number;
}

/** The first look-ahead download waits this long, so it never competes with the page's own first load. */
const FIRST_PRELOAD_DELAY_MS = 1500;
/** Later look-ahead downloads start once the fade (0.6 s, `duration-600` below) has finished. */
const PRELOAD_DELAY_MS = 700;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** Whether the visitor prefers reduced motion, kept up to date (false while rendering on the server). */
function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(REDUCED_MOTION);
      query.addEventListener("change", onChange);
      return () => {
        query.removeEventListener("change", onChange);
      };
    },
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

/**
 * The Network Information API (Chrome, Edge, Android browsers; not Safari or Firefox). Not in
 * TypeScript's DOM types, so the few fields we read are declared here.
 */
interface NetworkInformation extends EventTarget {
  saveData?: boolean;
  effectiveType?: string;
}

function connectionOf(): NetworkInformation | undefined {
  return (navigator as Navigator & { connection?: NetworkInformation })
    .connection;
}

/**
 * True when the visitor has Data Saver on or the connection is 2G / slow 2G: then the hero shows
 * the first photo only (no slideshow, no preloading). Browsers without the API count as false.
 */
function useSaveData(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const connection = connectionOf();
      connection?.addEventListener("change", onChange);
      return () => {
        connection?.removeEventListener("change", onChange);
      };
    },
    () => {
      const connection = connectionOf();
      return (
        Boolean(connection?.saveData) ||
        ["slow-2g", "2g"].includes(connection?.effectiveType ?? "")
      );
    },
    () => false,
  );
}

/**
 * The hero's photos, looping forever: after the last comes the first again. Only the first photo
 * loads with the page (eagerly, high priority). Each following photo, including the first again
 * after the last, is downloaded in the background while the current one shows, and appears only
 * once it has loaded, so a slow connection just shows each photo longer.
 *
 * No blank frame: the new photo fades in ON TOP of the previous one, which stays fully visible
 * underneath until the fade is over (z-order: shown photo, then previous, then the rest).
 *
 * For visitors who prefer reduced motion the slideshow starts paused and switches without a fade.
 * Hidden photos are aria-hidden: a screen reader only meets the one on screen.
 *
 * Data use: only the NEXT photo is ever downloaded ahead, never several at once, and nothing ahead
 * while paused. With Data Saver on or on 2G there is no slideshow at all: the first photo only.
 */
export default function HeroSlides({
  slides,
  intervalMs,
}: HeroSlidesProps) {
  const [active, setActive] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const paused = reducedMotion;
  // Slides rendered so far (their <img> exists, so the browser downloads them) and slides fully loaded.
  const [mounted, setMounted] = useState<number[]>([0]);
  const [loaded, setLoaded] = useState<number[]>([]);
  const saveData = useSaveData();
  // With Data Saver / 2G the hero is a single photo.
  const count = saveData ? 1 : slides.length;

  // Download the next photo (only that one; after the last, the first) while this one shows. Nothing while paused.
  useEffect(() => {
    if (paused || count < 2) return;
    const next = (active + 1) % count;
    const id = window.setTimeout(
      () => {
        setMounted((list) => (list.includes(next) ? list : [...list, next]));
      },
      previous === null ? FIRST_PRELOAD_DELAY_MS : PRELOAD_DELAY_MS,
    );
    return () => {
      window.clearTimeout(id);
    };
  }, [active, previous, paused, count]);

  // When the photo on screen appeared, the interval counts from here, so the next photo's
  // download finishing in between does not restart the clock.
  const shownAt = useRef(0);
  // Bumped to try again when a switch falls due while the tab is in the background.
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    shownAt.current = performance.now();
  }, [active, paused]);

  // Move on once the interval has passed since this photo appeared, but only to a photo that has
  // finished loading (if it has not, this runs again when it loads), and not in a background tab.
  useEffect(() => {
    if (paused || count < 2) return;
    const next = (active + 1) % count;
    if (!loaded.includes(next)) return;
    const wait = Math.max(
      0,
      intervalMs - (performance.now() - shownAt.current),
    );
    const id = window.setTimeout(() => {
      if (document.hidden) {
        shownAt.current = performance.now();
        setRetry((n) => n + 1);
        return;
      }
      setPrevious(active);
      setActive(next);
    }, wait);
    return () => {
      window.clearTimeout(id);
    };
  }, [active, paused, loaded, count, intervalMs, retry]);

  return (
    <>
      {mounted.map((index) => {
        const slide = slides[index];
        const shown = index === active;
        const underneath = index === previous;
        const markLoaded = () => {
          setLoaded((list) => (list.includes(index) ? list : [...list, index]));
        };
        return (
          // eslint-disable-next-line @next/next/no-img-element -- static export: no image server (see ResponsiveImage)
          <img
            key={slide.src}
            src={slide.src}
            srcSet={slide.srcSet}
            sizes="100vw"
            width={slide.width}
            height={slide.height}
            alt={slide.alt}
            aria-hidden={shown ? undefined : true}
            loading="eager"
            fetchPriority={index === 0 ? "high" : "low"}
            decoding="async"
            onLoad={markLoaded}
            // The first photo is in the page HTML and has often finished loading before React starts,
            // so its load event is never seen: check it when the element is attached. Without this the
            // loop would stop on the last slide, waiting for slide 1 to "load".
            ref={(img) => {
              if (img?.complete && img.naturalWidth > 0) markLoaded();
            }}
            style={{
              objectPosition: slide.position,
              // Behind the overlay but above the section's background color.
              zIndex: shown ? 0 : underneath ? -1 : -2,
            }}
            className={`absolute inset-0 size-full object-cover ${shown ? "opacity-100 transition-opacity duration-600 motion-reduce:transition-none" : underneath ? "opacity-100" : "opacity-0"}`}
          />
        );
      })}

    </>
  );
}
