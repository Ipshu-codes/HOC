"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * "From grey to colour": photos marked data-develop start greyscale and turn to full colour once
 * they scroll into view (or, on desktop, when hovered: see globals.css).
 *
 * Only photos that are off-screen when we first see them are greyed, so nothing on screen ever
 * flashes grey, and without JavaScript every photo simply shows in colour. Under
 * prefers-reduced-motion nothing is greyed at all. Each photo develops once and is then left alone.
 *
 * IntersectionObserver: the browser tells us when an element crosses into the viewport, without us
 * listening to scroll events. threshold 0.3 = when 30% of the photo is visible.
 * MutationObserver: tells us when new elements are added, so photos rendered later (the gallery after
 * it reads ?site=, a new filter or view) are handled too.
 */
export default function PhotoDevelop() {
  // Re-run after client-side navigation: the new page brings new photos.
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.develop = "done";
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.3 },
    );

    // Phones: the gallery grid (data-develop="dense") stays in colour. Two or three tiles changing colour
    // at once doubled the frame time on a slowed-down phone CPU; single large photos were fine.
    const phone = window.matchMedia("(width < 48rem)").matches;

    const scan = () => {
      for (const element of document.querySelectorAll<HTMLElement>("[data-develop]")) {
        const state = element.dataset.develop;
        if (state === "done" || state === "on-screen") continue;
        if (state === "dense" && phone) {
          element.dataset.develop = "on-screen";
          continue;
        }
        if (state !== "pending") {
          // First time we see it: a photo that is on screen right now stays in colour for good.
          const box = element.getBoundingClientRect();
          if (box.top < window.innerHeight && box.bottom > 0) {
            element.dataset.develop = "on-screen";
            continue;
          }
          element.dataset.develop = "pending";
        }
        observer.observe(element);
      }
    };
    scan();

    // Batch bursts of DOM changes (a whole grid re-rendering) into one scan per frame.
    let frame = 0;
    const mutations = new MutationObserver(() => {
      if (frame === 0) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          scan();
        });
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [pathname]);

  return null;
}
