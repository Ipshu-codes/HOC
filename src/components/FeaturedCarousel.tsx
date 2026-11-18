"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

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

interface FeaturedCarouselProps {
  slides: CarouselSlide[];
  lang: Locale;
  labels: { label: string; previous: string; next: string; slide: string };
  /** The section heading and its sentence (rendered in the text column). */
  heading: ReactNode;
  /** "See all photos" link. */
  more: { href: string; label: string };
}

/** Desktop with motion: the pinned, scroll-driven version. Phones, tablets and reduced motion: swipe. */
const PIN_QUERY = "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";
function subscribePin(onChange: () => void) {
  const query = window.matchMedia(PIN_QUERY);
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

/** Scroll distance per photo in pinned mode, as a share of the screen height. */
const STEP_VH = 0.7;

/**
 * The numbered photo carousel ("01 / 09"), after Biegajaca's works carousel.
 *
 * One DOM, two modes (data-mode on the section):
 *   swipe  a horizontal scroller with CSS scroll snapping: swipe, arrows, the arrow keys. Neighbours of
 *          the current photo rest grey. Used on phones and tablets (< 1024 px), with reduced motion and
 *          before JavaScript runs.
 *   pin    desktop: the section is several screens tall and its stage sticks under the header; scrolling
 *          the page moves the photos along (the old one slides left and fades to grey) and the current
 *          caption shows in the text column. The arrows scroll the page to the previous/next photo.
 */
export default function FeaturedCarousel({ slides, lang, labels, heading, more }: FeaturedCarouselProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const capSpaceRef = useRef<HTMLDivElement>(null);
  // Which mode follows the screen width and the reduced-motion setting (swipe on the server and before JS).
  const pinned = useSyncExternalStore(subscribePin, () => window.matchMedia(PIN_QUERY).matches, () => false);
  const mode: "swipe" | "pin" = pinned ? "pin" : "swipe";
  const [current, setCurrent] = useState(0);
  const [nearView, setNearView] = useState(false);
  const total = slides.length;

  const twoDigits = (n: number) => {
    const text = formatNumber(n, lang);
    return text.length < 2 ? `${lang === "ne" ? "०" : "0"}${text}` : text;
  };

  // Load every photo once the section comes near the screen (before that, only the first few).
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNearView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" },
    );
    observer.observe(section);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Swipe mode: the current slide is the one nearest the track's centre.
  useEffect(() => {
    if (mode !== "swipe") return;
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
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      track.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [mode]);

  // Pin mode: page scroll → position of every photo (set directly on the elements, no re-render per frame).
  useEffect(() => {
    if (mode !== "pin") return;
    const section = sectionRef.current;
    const stage = stageRef.current;
    const track = trackRef.current;
    if (!section || !stage || !track) return;
    const photos = Array.from(track.querySelectorAll<HTMLElement>(".works-photo"));
    let frame = 0;
    const place = () => {
      frame = 0;
      const step = window.innerHeight * STEP_VH;
      const top = section.getBoundingClientRect().top + window.scrollY;
      const progress = Math.min(Math.max((window.scrollY - top) / step, 0), total - 1);
      photos.forEach((photo, index) => {
        const offset = index - progress;
        // Leaving (offset < 0): slides left, greys and fades out quickly, before it reaches the text column.
        // Coming (offset > 0): waits at the right edge, grey, and colours in as it reaches the middle.
        const grey = offset < 0 ? Math.min(-offset * 2.5, 1) : Math.min(Math.max((offset - 0.15) * 1.6, 0), 1);
        const opacity = offset < 0 ? Math.max(1 + offset * 2.2, 0) : offset > 1.6 ? 0 : 1 - Math.min(offset, 1) * 0.35;
        photo.style.transform = `translateX(${offset * 108}%)`;
        photo.style.filter = `grayscale(${grey})`;
        photo.style.opacity = String(opacity);
      });
      setCurrent(Math.round(progress));
    };
    const placeCaption = () => {
      if (capSpaceRef.current) stage.style.setProperty("--cap-top", `${capSpaceRef.current.offsetTop}px`);
    };
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(place);
    };
    const onResize = () => {
      placeCaption();
      onScroll();
    };
    placeCaption();
    frame = requestAnimationFrame(place);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frame);
      photos.forEach((photo) => {
        photo.style.transform = "";
        photo.style.filter = "";
        photo.style.opacity = "";
      });
      stage.style.removeProperty("--cap-top");
    };
  }, [mode, total]);

  const go = useCallback(
    (index: number) => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (mode === "pin") {
        const section = sectionRef.current;
        if (!section) return;
        const top = section.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + index * window.innerHeight * STEP_VH + 1, behavior: reduce ? "auto" : "smooth" });
        return;
      }
      const track = trackRef.current;
      const slide = track?.children[index] as HTMLElement | undefined;
      if (!track || !slide) return;
      track.scrollTo({ left: slide.offsetLeft - (track.clientWidth - slide.offsetWidth) / 2, behavior: reduce ? "auto" : "smooth" });
    },
    [mode],
  );

  const atStart = current === 0;
  const atEnd = current === total - 1;
  const pinHeight = mode === "pin" ? `calc(100vh + ${(total - 1) * STEP_VH * 100}vh)` : undefined;

  const controls = (
    <>
      <div className="mt-6 flex items-center gap-4">
        <p aria-live="polite" className="mono tabular-nums">
          {twoDigits(current + 1)} <span aria-hidden="true">/</span>
          <span className="sr-only">,</span> {twoDigits(total)}
        </p>
        <span aria-hidden="true" className="works-count-line" />
      </div>
      {mode === "pin" && <div ref={capSpaceRef} className="works-cap-space" />}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-label={labels.previous}
          aria-disabled={atStart}
          onClick={() => {
            if (!atStart) go(current - 1);
          }}
          className="btn btn-outline btn-square"
        >
          <span aria-hidden="true">←</span>
        </button>
        <button
          type="button"
          aria-label={labels.next}
          aria-disabled={atEnd}
          onClick={() => {
            if (!atEnd) go(current + 1);
          }}
          className="btn btn-outline btn-square"
        >
          <span aria-hidden="true">→</span>
        </button>
        <Link href={more.href} className="btn btn-accent">
          {more.label} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  );

  return (
    <section
      ref={sectionRef}
      id="gallery"
      aria-labelledby="gallery-title"
      data-mode={mode}
      className="works relative"
      style={{ height: pinHeight }}
    >
      <div ref={stageRef} className="works-stage">
        <div className={mode === "pin" ? "works-text" : "wrap section pb-6"}>{heading}{mode === "pin" && controls}</div>

        <div role="region" aria-roledescription="carousel" aria-label={labels.label}>
          <ul
            ref={trackRef}
            tabIndex={mode === "swipe" ? 0 : -1}
            className="works-track flex gap-4 overflow-x-auto px-[9vw] py-2 focus-visible:outline-offset-[-2px] md:gap-8 md:px-[20vw]"
          >
            {slides.map((slide, index) => (
              <li
                key={slide.src}
                role="group"
                aria-roledescription="slide"
                aria-label={labels.slide.replace("{n}", formatNumber(index + 1, lang)).replace("{total}", formatNumber(total, lang))}
                data-current={index === current ? "" : undefined}
                className="works-slide w-[82vw] shrink-0 md:w-[60vw]"
              >
                <figure>
                  <div className="works-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                    <img
                      src={slide.src}
                      srcSet={slide.srcSet}
                      sizes="(min-width: 64rem) 56vw, (min-width: 48rem) 60vw, 82vw"
                      width={slide.width}
                      height={slide.height}
                      alt=""
                      loading={nearView || index <= 2 ? "eager" : "lazy"}
                      decoding="async"
                      className="aspect-4/3 w-full object-cover"
                    />
                  </div>
                  <figcaption className="mt-4">
                    <span className="works-title line-clamp-3 block">{slide.alt}</span>
                    <span className="mono muted mt-2 block">{slide.site}</span>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>

        {mode === "swipe" && <div className="wrap pb-14">{controls}</div>}
      </div>
    </section>
  );
}
