"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

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
  labels: { pause: string; play: string };
}

/** Time each photo stays before the next fades in. */
const INTERVAL_MS = 6000;
/** Wait after a photo appears before downloading the next, so it never competes with the page's first load. */
const PRELOAD_DELAY_MS = 1500;

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
 * The hero's photos, cross-fading one into the next. Only the first photo loads with the page
 * (it is the largest image, so it loads eagerly with high priority). Each following photo is
 * downloaded in the background while the current one shows, and appears only once it has
 * loaded, so a slow connection just shows each photo longer.
 *
 * Moving content needs a way to stop it (WCAG 2.2.2), so there is a pause/play button. For
 * visitors who prefer reduced motion the slideshow starts paused and switches without a fade.
 * Hidden photos are aria-hidden: a screen reader only meets the one on screen.
 *
 * Data use: only the NEXT photo is ever downloaded ahead, never several at once, and nothing ahead
 * while paused. With Data Saver on or on 2G there is no slideshow at all: the first photo only.
 */
export default function HeroSlides({ slides, labels }: HeroSlidesProps) {
  const [active, setActive] = useState(0);
  // null until the visitor presses pause/play; until then reduced-motion visitors start paused.
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const reducedMotion = usePrefersReducedMotion();
  const paused = userPaused ?? reducedMotion;
  // Slides rendered so far (their <img> exists, so the browser downloads them) and slides fully loaded.
  const [mounted, setMounted] = useState<number[]>([0]);
  const [loaded, setLoaded] = useState<number[]>([]);
  const saveData = useSaveData();
  // With Data Saver / 2G the hero is a single photo.
  const count = saveData ? 1 : slides.length;

  // Download the next photo (only that one) in the background while this one shows; nothing while paused.
  useEffect(() => {
    if (paused || count < 2) return;
    const next = (active + 1) % count;
    const id = window.setTimeout(() => {
      setMounted((list) => (list.includes(next) ? list : [...list, next]));
    }, PRELOAD_DELAY_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [active, paused, count]);

  // Move on every few seconds, but only to a photo that has finished loading, and not in a background tab.
  useEffect(() => {
    if (paused || count < 2) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      const next = (active + 1) % count;
      if (loaded.includes(next)) setActive(next);
    }, INTERVAL_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [active, paused, loaded, count]);

  return (
    <>
      {mounted.map((index) => {
        const slide = slides[index];
        const shown = index === active;
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
            onLoad={() => {
              setLoaded((list) =>
                list.includes(index) ? list : [...list, index],
              );
            }}
            style={
              slide.position ? { objectPosition: slide.position } : undefined
            }
            className={`absolute inset-0 -z-20 size-full object-cover transition-opacity duration-1000 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
          />
        );
      })}

      {count > 1 && (
        <button
          type="button"
          onClick={() => setUserPaused(!paused)}
          aria-label={paused ? labels.play : labels.pause}
          title={paused ? labels.play : labels.pause}
          className="absolute top-4 right-4 flex size-11 items-center justify-center rounded-full bg-brick/70 text-cream ring-1 ring-cream/60 hover:bg-brick focus-visible:outline-cream md:top-6 md:right-6"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-5"
            fill="currentColor"
          >
            {paused ? (
              <path d="M8 5v14l11-7z" />
            ) : (
              <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
            )}
          </svg>
        </button>
      )}
    </>
  );
}
