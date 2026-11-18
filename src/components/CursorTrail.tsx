"use client";

import { useEffect, useRef } from "react";

interface CursorTrailProps {
  /** Small photo files (480 px) to leave behind the pointer, in turn. */
  photos: string[];
}

/** Distance the mouse must travel before the next photo is dropped. */
const SPACING_PX = 110;
/** At most this many photos on screen at once (older ones are removed first). */
const MAX_CARDS = 8;

/**
 * The trail in the dark band (Biegajaca's "running" band): moving the mouse over the band leaves small
 * framed photos behind it, which fade away. Decorative only (aria-hidden, alt="").
 *
 * Mouse only: touch and pen pointers never start it, and it is off with reduced motion. Nothing is
 * downloaded until the mouse first moves over the band.
 */
export default function CursorTrail({ photos }: CursorTrailProps) {
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const band = layer?.parentElement;
    if (!layer || !band || photos.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    let last: { x: number; y: number } | null = null;
    let next = 0;
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const box = band.getBoundingClientRect();
      const x = event.clientX - box.left;
      const y = event.clientY - box.top;
      if (last && Math.hypot(x - last.x, y - last.y) < SPACING_PX) return;
      last = { x, y };

      const card = document.createElement("img");
      card.src = photos[next % photos.length];
      card.alt = "";
      card.decoding = "async";
      card.className = "trail-card";
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      card.style.rotate = `${(Math.random() - 0.5) * 16}deg`;
      next += 1;
      layer.append(card);
      while (layer.childElementCount > MAX_CARDS) layer.firstElementChild?.remove();

      // In, hold, out: a CSS-free Web Animation, removed when done.
      const animation = card.animate(
        [
          { opacity: 0, transform: "scale(0.92)" },
          { opacity: 1, transform: "scale(1)", offset: 0.15 },
          { opacity: 1, transform: "scale(1)", offset: 0.6 },
          { opacity: 0, transform: "scale(0.97)" },
        ],
        { duration: 1400, easing: "ease-out", fill: "forwards" },
      );
      animation.onfinish = () => card.remove();
    };
    band.addEventListener("pointermove", onMove);
    return () => {
      band.removeEventListener("pointermove", onMove);
      layer.replaceChildren();
    };
  }, [photos]);

  return <div ref={layerRef} aria-hidden="true" className="trail-layer" />;
}
