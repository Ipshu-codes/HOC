"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { formatNumber } from "@/lib/format";
import type { Locale } from "@/types/locale";

export interface CarouselSlide {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  /** The photo's alt text, shown as its caption (the <img> itself is then alt=""). */
  alt: string;
  /** Name of the heritage site the photo belongs to. */
  site: string;
}

/** How many slides after the current one are downloaded in advance. */
const LOAD_AHEAD = 2;

interface FeaturedCarouselProps {
  slides: CarouselSlide[];
  lang: Locale;
  labels: { label: string; previous: string; next: string; slide: string };
}

/**
 * Numbered photo carousel ("01 / 09") with arrow buttons.
 *
 * The track is a plain horizontal scroller with CSS scroll snapping, so swiping on a phone is the
 * browser's own (smooth, compositor-driven) scrolling and needs no gesture code. The arrows scroll to
 * the previous/next slide; the counter follows whichever slide is nearest the centre. The track can
 * be focused and scrolled with the arrow keys. Slides load lazily, so only the ones near the view are
 * downloaded.
 */
export default function FeaturedCarousel({ slides, lang, labels }: FeaturedCarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);
  // Set when the carousel comes near the screen, or on the first scroll of the track: from then on every
  // slide loads, so even a long fling never lands on an empty frame.
  const [moved, setMoved] = useState(false);
  const total = slides.length;

  // "1" → "01" (Nepali: "०१"), so the counter keeps its width.
  const twoDigits = (n: number) => {
    const text = formatNumber(n, lang);
    return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
  };

  // Load every slide once the carousel comes near the screen (like any image further down a page);
  // before that only the first slides are fetched.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setMoved(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    observer.observe(track);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Follow the scroll position: the current slide is the one whose centre is nearest the track's centre.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const middle = track.scrollLeft + track.clientWidth / 2;
      let nearest = 0;
      let best = Infinity;
      Array.from(track.children).forEach((child, index) => {
        const slide = child as HTMLElement;
        const distance = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - middle);
        if (distance < best) {
          best = distance;
          nearest = index;
        }
      });
      setCurrent(nearest);
    };
    const onScroll = () => {
      setMoved(true);
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const go = useCallback((index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({
      left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2,
      behavior: reduce ? "auto" : "smooth",
    });
  }, []);

  const atStart = current === 0;
  const atEnd = current === total - 1;
  const arrow =
    "press flex size-12 shrink-0 items-center justify-center rounded-full border border-ink text-xl text-ink hover:bg-ink hover:text-cream aria-disabled:cursor-default aria-disabled:opacity-35 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink";

  return (
    <div role="region" aria-roledescription="carousel" aria-label={labels.label}>
      {/* Sizes are in cqw (1% of this wrapper's width, a CSS container query unit): a % inside the
          padded track would be a % of the track minus its padding. The side padding lets the first and
          last slides sit in the centre too. On phones the track runs to the screen edges (-mx-4). */}
      <div className="@container -mx-4 md:mx-0">
        <ul
          ref={trackRef}
          tabIndex={0}
          className="carousel-track relative flex gap-4 overflow-x-auto px-[9cqw] py-4 focus-visible:outline-offset-[-2px] md:gap-8 md:px-[20cqw] lg:px-[28cqw]"
        >
          {slides.map((slide, index) => (
            <li
              key={slide.src}
              role="group"
              aria-roledescription="slide"
              aria-label={labels.slide.replace("{n}", formatNumber(index + 1, lang)).replace("{total}", formatNumber(total, lang))}
              data-current={index === current ? "" : undefined}
              className="carousel-slide w-[82cqw] shrink-0 md:w-[60cqw] lg:w-[44cqw]"
            >
              <figure>
                <div className="print">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                  <img
                    src={slide.src}
                    srcSet={slide.srcSet}
                    sizes="(min-width: 64rem) 32rem, (min-width: 48rem) 60vw, 82vw"
                    width={slide.width}
                    height={slide.height}
                    alt=""
                    // The slides just ahead load before they are reached; all of them once the
                    // carousel has been moved. Until then the rest wait (lazy).
                    loading={moved || index <= current + LOAD_AHEAD ? "eager" : "lazy"}
                    decoding="async"
                    className="aspect-4/3 w-full object-cover"
                  />
                </div>
                <figcaption className="mt-4">
                  <span className="label-small block font-bold text-crimson">{slide.site}</span>
                  <span className="mt-1 line-clamp-2 block text-ink/80">{slide.alt}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex items-center justify-center gap-5">
        <button
          type="button"
          aria-label={labels.previous}
          aria-disabled={atStart}
          onClick={() => {
            if (!atStart) go(current - 1);
          }}
          className={arrow}
        >
          <span aria-hidden="true">←</span>
        </button>
        <div className="flex min-w-32 flex-col items-center gap-2">
          <p aria-live="polite" className="text-sm font-bold tracking-[0.12em] text-ink tabular-nums">
            {twoDigits(current + 1)} <span aria-hidden="true">/</span>
            <span className="sr-only">,</span> {twoDigits(total)}
          </p>
          <span aria-hidden="true" className="block h-px w-24 bg-ink/20">
            <span
              className="carousel-progress block h-px w-full bg-crimson"
              style={{ transform: `scaleX(${(current + 1) / total})` }}
            />
          </span>
        </div>
        <button
          type="button"
          aria-label={labels.next}
          aria-disabled={atEnd}
          onClick={() => {
            if (!atEnd) go(current + 1);
          }}
          className={arrow}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
