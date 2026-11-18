"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface FanInProps {
  children: ReactNode;
  className?: string;
}

/**
 * A fan of tilted prints (Biegajaca's commissions block). The fan is spread out by default (no
 * JavaScript, reduced motion); with motion allowed the script stacks the prints until the fan scrolls
 * into view, then lets them spread once (CSS: globals.css → .fan[data-waiting]).
 */
export default function FanIn({ children, className = "" }: FanInProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fan = ref.current;
    if (!fan || !("IntersectionObserver" in window)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (fan.getBoundingClientRect().top < window.innerHeight * 0.65) return; // already in view
    fan.dataset.waiting = "";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          delete fan.dataset.waiting;
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(fan);
    return () => {
      observer.disconnect();
      delete fan.dataset.waiting;
    };
  }, []);

  return (
    <div ref={ref} className={`fan ${className}`}>
      {children}
    </div>
  );
}
