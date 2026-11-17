"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

interface BrandLinkProps {
  href: string;
  /** Accessible name, e.g. "Ward No. 16, home". */
  label: string;
  children: ReactNode;
}

/**
 * The header brand (logo + "WARD NO. 16 / Kathmandu Metropolitan City" + the other-language line) as one
 * link to the home page in the current language. On the home page itself it scrolls to the top instead:
 * smoothly, or instantly for visitors who prefer reduced motion.
 */
export default function BrandLink({ href, label, children }: BrandLinkProps) {
  const pathname = usePathname();

  function onClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== href) return; // another page: a normal link home
    event.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }

  return (
    // prefetch off: prefetching the home page would preload its hero photo on every page
    <Link
      href={href}
      prefetch={false}
      aria-label={label}
      onClick={onClick}
      className="flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-offset-4 md:gap-5"
    >
      {children}
    </Link>
  );
}
