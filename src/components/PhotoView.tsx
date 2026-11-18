"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

import type { Dictionary } from "@/lib/i18n";
import type { GalleryPhoto } from "@/lib/images";

interface PhotoViewProps {
  /** The photos of the current filter, in order. */
  photos: GalleryPhoto[];
  index: number;
  /** The image the view opened from (a print or a row): the photo glides out of it, and focus returns to its button. */
  from: HTMLElement | null;
  credit: string | null;
  siteName: Map<string, string>;
  labels: Dictionary["gallery"]["lightbox"];
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** The image on the page for photo `index`, so closing glides back to where that photo now is. */
  sourceFor: (index: number) => Element | null;
}

const GLIDE_MS = 520;
const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * The photo view (Shutabug's "how a photo opens"): the photo glides and grows from the print you
 * clicked to the left half of the screen, then its details fade in on the right (the site, the
 * caption, the photo credit) with previous / next and close; more photos of the same site sit below.
 *
 * Keyboard: ← → previous / next, Esc closes, Tab stays inside the view, and focus goes back to the print
 * or row that opened it. Touch: swipe the photo left or right. With reduced motion there is no glide.
 * The glide is a FLIP animation: the photo is drawn at its final place, then animated (Web Animations
 * API, transform only) from the size and position the source image had.
 */
export default function PhotoView({ photos, index, from, credit, siteName, labels, onIndexChange, onClose, sourceFor }: PhotoViewProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const opener = useRef<HTMLElement | null>(from?.closest("button") ?? null);
  const closing = useRef(false);
  const photo = photos[index];
  const largest = photo.full.at(-1) ?? photo.thumb;
  const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Transform that makes the view's photo sit exactly over `source`. */
  const flipFrom = (source: Element, target: HTMLElement) => {
    const a = source.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    if (!a.width || !b.width) return null;
    return `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
  };

  // Open: glide in from the source image, focus the close button, lock the page scroll.
  useLayoutEffect(() => {
    const img = imgRef.current;
    const root = rootRef.current;
    if (img && from && !reduce) {
      const start = flipFrom(from, img);
      if (start) img.animate([{ transform: start, transformOrigin: "0 0" }, { transform: "none", transformOrigin: "0 0" }], { duration: GLIDE_MS, easing: EASE });
    }
    if (root && !reduce) root.animate([{ backgroundColor: "transparent" }, { backgroundColor: getComputedStyle(root).backgroundColor }], { duration: 220, easing: "ease-out" });
    closeRef.current?.focus({ preventScroll: true });
    const html = document.documentElement;
    const previous = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = previous;
    };
    // Runs once, when the view opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const img = imgRef.current;
    const root = rootRef.current;
    const source = sourceFor(index);
    const finish = () => {
      onClose();
      // Focus back on the print or row of the photo that was showing (or the one that opened the view).
      const button = (source?.closest("button") as HTMLElement | null) ?? opener.current;
      button?.focus({ preventScroll: true });
    };
    if (!img || !root || reduce) {
      finish();
      return;
    }
    const box = source?.getBoundingClientRect();
    const visible = box && box.bottom > 0 && box.top < window.innerHeight && box.width > 0;
    const end = visible ? flipFrom(source!, img) : null;
    root.querySelector(".photo-view-details")?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, fill: "forwards" });
    root.animate([{ backgroundColor: getComputedStyle(root).backgroundColor }, { backgroundColor: "transparent" }], { duration: 300, fill: "forwards" });
    const animation = end
      ? img.animate([{ transform: "none", transformOrigin: "0 0" }, { transform: end, transformOrigin: "0 0" }], { duration: 380, easing: EASE, fill: "forwards" })
      : img.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, fill: "forwards" });
    animation.onfinish = finish;
  }, [index, onClose, reduce, sourceFor]);

  const go = useCallback(
    (step: number) => {
      const next = index + step;
      if (next >= 0 && next < photos.length) onIndexChange(next);
    },
    [index, photos.length, onIndexChange],
  );

  // Keys: ← →, Esc, and Tab kept inside the view.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        go(1);
      } else if (event.key === "ArrowLeft") {
        go(-1);
      } else if (event.key === "Tab" && rootRef.current) {
        const stops = Array.from(rootRef.current.querySelectorAll<HTMLElement>("button:not([disabled])"));
        const at = stops.indexOf(document.activeElement as HTMLElement);
        const next = event.shiftKey ? (at <= 0 ? stops.length - 1 : at - 1) : at === stops.length - 1 ? 0 : at + 1;
        event.preventDefault();
        stops[next]?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
  }, [close, go]);

  // Swipe on the photo (touch and pen).
  const swipe = useRef<{ x: number; y: number; t: number } | null>(null);

  const related = photos.map((p, i) => ({ p, i })).filter(({ p, i }) => p.site === photo.site && i !== index).slice(0, 4);
  const buttonClass = "btn btn-outline";

  return (
    <div ref={rootRef} role="dialog" aria-modal="true" aria-label={photo.alt} className="photo-view">
      <div className="photo-view-grid">
        {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
        <img
          ref={imgRef}
          key={largest.src}
          src={photo.thumb.src}
          srcSet={photo.full.map((file) => `${file.src} ${file.width}w`).join(", ")}
          sizes="(min-width: 64rem) 56vw, 100vw"
          width={largest.width}
          height={largest.height}
          alt=""
          className="photo-view-img"
          onPointerDown={(event) => {
            if (event.pointerType !== "mouse") swipe.current = { x: event.clientX, y: event.clientY, t: event.timeStamp };
          }}
          onPointerUp={(event) => {
            const start = swipe.current;
            swipe.current = null;
            if (!start) return;
            const dx = event.clientX - start.x;
            const dy = event.clientY - start.y;
            const fast = Math.abs(dx) / Math.max(event.timeStamp - start.t, 1) > 0.11;
            if (Math.abs(dx) > Math.abs(dy) && (Math.abs(dx) > 50 || fast)) go(dx < 0 ? 1 : -1);
          }}
        />

        <div className="photo-view-details">
          <button ref={closeRef} type="button" className="mono link-slide" onClick={close}>
            <span aria-hidden="true">←&nbsp;</span>
            {labels.Close}
          </button>
          <p className="mono muted mt-6">{siteName.get(photo.site)}</p>
          <p className="d-4 mt-2" style={{ textTransform: "none" }}>
            {photo.alt}
          </p>
          {credit && <p className="mono muted mt-4">{credit}</p>}
          <div className="mt-8 flex gap-2">
            <button type="button" className={buttonClass} disabled={index === 0} onClick={() => go(-1)}>
              <span aria-hidden="true">←</span> {labels.Previous}
            </button>
            <button type="button" className={buttonClass} disabled={index === photos.length - 1} onClick={() => go(1)}>
              {labels.Next} <span aria-hidden="true">→</span>
            </button>
          </div>

          {related.length > 0 && (
            <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {related.map(({ p, i }) => (
                <li key={p.thumb.src}>
                  <button type="button" aria-label={p.alt} className="block w-full" onClick={() => onIndexChange(i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
                    <img src={p.thumb.src} srcSet={p.thumb.srcSet} sizes="8rem" width={p.thumb.width} height={p.thumb.height} alt="" loading="lazy" className="aspect-3/4 w-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
