"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
}

/** Progressive enhancement: content stays visible without JS and reveals only after observation starts. */
export default function Reveal({ children, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || !("IntersectionObserver" in window) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    node.dataset.reveal = "pending";
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        node.dataset.reveal = "visible";
        observer.unobserve(node);
      }
    }, { threshold: 0.08, rootMargin: "0px 0px -48px 0px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className={className}>{children}</div>;
}
