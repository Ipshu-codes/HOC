"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ResponsiveImage from "@/components/ResponsiveImage";
import type { SiteImage } from "@/lib/images";

interface PhotoStoryRailProps {
  photos: SiteImage[];
  labels: { previous: string; next: string; photos: string };
}

/** A native scroll-snap photo story with keyboard controls and a compact progress indicator. */
export default function PhotoStoryRail({ photos, labels }: PhotoStoryRailProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const move = useCallback((direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const next = Math.max(0, Math.min(photos.length - 1, active + direction));
    track.children[next]?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "nearest",
      inline: "start",
    });
    setActive(next);
  }, [active, photos.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const first = track.children[0] as HTMLElement | undefined;
        if (!first) return;
        const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || "0");
        if (step > 0) setActive(Math.max(0, Math.min(photos.length - 1, Math.round(track.scrollLeft / step))));
      });
    };
    track.addEventListener("scroll", update, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", update);
    };
  }, [photos.length]);

  if (photos.length === 0) return null;

  return (
    <div className="photo-story" role="region" aria-roledescription="carousel" aria-label={labels.photos}>
      <ul
        ref={trackRef}
        className="photo-story__track"
        aria-label={labels.photos}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") { event.preventDefault(); move(1); }
          if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); }
        }}
      >
        {photos.map((photo, index) => (
          <li key={photo.src} className="photo-story__slide" role="group" aria-roledescription="slide" aria-label={`${index + 1} / ${photos.length}`}>
            <ResponsiveImage
              image={photo}
              sizes="(min-width: 900px) 62vw, 86vw"
              className="photo-story__image"
            />
          </li>
        ))}
      </ul>
      <div className="photo-story__controls">
        <span className="photo-story__count" aria-live="polite">{String(active + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</span>
        <div className="photo-story__progress" aria-hidden="true"><span style={{ transform: `scaleX(${(active + 1) / photos.length})` }} /></div>
        <button type="button" onClick={() => move(-1)} disabled={active === 0} aria-label={labels.previous}>←</button>
        <button type="button" onClick={() => move(1)} disabled={active === photos.length - 1} aria-label={labels.next}>→</button>
      </div>
    </div>
  );
}
