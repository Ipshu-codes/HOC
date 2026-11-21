"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import BrandLink from "@/components/BrandLink";
import LanguageToggle from "@/components/LanguageToggle";
import type { Dictionary, NavItem } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface NavProps {
  lang: Locale;
  /** Only the strings this component needs: the whole dictionary would be sent to the browser. */
  labels: Dictionary["nav"];
  languageLabels: Dictionary["language"];
  items: NavItem[];
  /** Ward logo (content/ward.json), shown at the left of the bar once the big header has scrolled away. */
  logoSrc: string;
  /** Its accessible name, "Ward No. 16, home". */
  homeLabel: string;
}

/**
 * Sticky brick-red nav bar. From 768px (Tailwind `md`) the links sit in a row;
 * below that they collapse behind a hamburger button. This is a client
 * component because the menu has open/closed state and the logo watches the header.
 *
 * Once the header (logo + title, just above this bar) has scrolled out of view, a small round
 * ward logo slides in at the left of the bar as a link home (on the home page: back to the top).
 * While the header is visible the logo is hidden and `inert` (not focusable, not read out).
 */
export default function Nav({
  lang,
  labels,
  languageLabels,
  items,
  logoSrc,
  homeLabel,
}: NavProps) {
  const [open, setOpen] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const menuId = useId();

  // IntersectionObserver calls back whenever the header enters or leaves the viewport — no scroll listener needed.
  useEffect(() => {
    const header = navRef.current?.previousElementSibling;
    if (!header) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShowLogo(!entry.isIntersecting);
    });
    observer.observe(header);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) =>
      event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // prefetch={false}: avoid preloading the home page hero photo from every navigation link.
  const linkClass =
    "block rounded-md px-3 py-2 font-medium text-cream hover:bg-crimson hover:text-white focus-visible:bg-crimson focus-visible:outline-cream";

  return (
    <nav
      ref={navRef}
      aria-label={labels.label}
      className="sticky top-0 z-40 bg-brick shadow-md"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
        <div className="flex min-w-0 items-center gap-1">
          {/* overflow-x-clip hides the logo while its width is 0 without clipping the focus outline above and below. */}
          <div
            inert={!showLogo}
            className={`flex shrink-0 items-center overflow-x-clip transition-[width,opacity] duration-200 motion-reduce:transition-none ${showLogo ? "w-12 opacity-100" : "w-0 opacity-0"}`}
          >
            <BrandLink
              href={`/${lang}/`}
              label={homeLabel}
              className="ml-0.5 block shrink-0 rounded-full focus-visible:outline-cream"
            >
              <Image
                src={logoSrc}
                alt=""
                width={128}
                height={128}
                className="size-10 rounded-full bg-cream ring-2 ring-cream"
              />
            </BrandLink>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-md px-2 py-2 text-cream hover:bg-crimson focus-visible:outline-cream md:hidden"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? labels.closeMenu : labels.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
            <span>{labels.menu}</span>
          </button>

          <ul className="hidden items-center gap-1 md:flex">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <LanguageToggle lang={lang} labels={languageLabels} />
      </div>

      {/* Mobile menu: rendered always (hidden when closed) so aria-controls points at a real element. */}
      <ul
        id={menuId}
        hidden={!open}
        className="space-y-1 border-t border-cream/20 px-4 pt-2 pb-4 md:hidden"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={false}
              className={linkClass}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
