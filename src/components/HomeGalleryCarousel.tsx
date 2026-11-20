"use client";

import { useRef, useState } from "react";
import type { PointerEvent, UIEvent } from "react";

import ResponsiveImage from "@/components/ResponsiveImage";
import type { SiteImage } from "@/lib/images";

interface HomeGalleryCarouselProps {
  images: SiteImage[];
  labels: {
    title: string;
    previousPhoto: string;
    nextPhoto: string;
  };
}

interface DragState {
  pointerId: number;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

export default function HomeGalleryCarousel({
  images,
  labels,
}: HomeGalleryCarouselProps) {
  const [active, setActive] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  if (images.length === 0) return null;

  const scrollTo = (index: number) => {
    const track = trackRef.current;
    const slide = track?.children.item(index);
    if (!track || !(slide instanceof HTMLElement)) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    track.scrollTo({
      left: slide.offsetLeft,
      behavior: reducedMotion ? "auto" : "smooth",
    });
  };

  const updateActive = (event: UIEvent<HTMLDivElement>) => {
    const track = event.currentTarget;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    Array.from(track.children).forEach((slide, index) => {
      if (!(slide instanceof HTMLElement)) return;
      const distance = Math.abs(slide.offsetLeft - track.scrollLeft);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActive((current) =>
      current === closestIndex ? current : closestIndex,
    );
  };

  const startDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const drag = (event: PointerEvent<HTMLDivElement>) => {
    const current = dragRef.current;
    if (!current || current.pointerId !== event.pointerId) return;

    const distance = event.clientX - current.startX;
    if (!current.moved && Math.abs(distance) < 5) return;
    current.moved = true;
    setDragging(true);
    event.preventDefault();
    event.currentTarget.scrollLeft = current.startScrollLeft - distance;
  };

  const stopDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
  };

  const moveBy = (amount: number) => {
    scrollTo((active + amount + images.length) % images.length);
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={labels.title}
      className="mt-6"
    >
      <div
        ref={trackRef}
        role="group"
        aria-label={labels.title}
        tabIndex={0}
        onScroll={updateActive}
        onPointerDown={startDrag}
        onPointerMove={drag}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
        className={`relative flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:thin] [scrollbar-color:var(--color-sand)_transparent] touch-pan-y select-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-crimson ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {images.map((image, index) => (
          <div
            key={image.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${twoDigits(index + 1)} / ${twoDigits(images.length)}`}
            className="w-[min(82vw,34rem)] shrink-0 snap-start"
          >
            <ResponsiveImage
              image={image}
              sizes="(min-width: 1152px) 544px, 82vw"
              className="aspect-[4/3] size-full rounded-xl object-cover"
            />
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <span
          aria-live="polite"
          aria-atomic="true"
          className="shrink-0 text-sm tabular-nums text-ink/70"
        >
          {twoDigits(active + 1)} / {twoDigits(images.length)}
        </span>

        <div
          role="progressbar"
          aria-label={labels.title}
          aria-valuemin={1}
          aria-valuemax={images.length}
          aria-valuenow={active + 1}
          className="h-1 min-w-12 flex-1 overflow-hidden rounded-full bg-sand sm:max-w-64"
        >
          <div
            className="h-full bg-crimson transition-[width] motion-reduce:transition-none"
            style={{ width: `${((active + 1) / images.length) * 100}%` }}
          />
        </div>

        {images.length > 1 && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => moveBy(-1)}
              aria-label={labels.previousPhoto}
              className="flex size-10 items-center justify-center rounded-full border border-crimson/30 text-crimson transition-colors hover:bg-crimson hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
              >
                <path d="m15 18-6-6 6-6M9 12h12" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => moveBy(1)}
              aria-label={labels.nextPhoto}
              className="flex size-10 items-center justify-center rounded-full border border-crimson/30 text-crimson transition-colors hover:bg-crimson hover:text-cream focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="size-5"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
              >
                <path d="m9 18 6-6-6-6m6 6H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
