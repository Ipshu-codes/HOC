"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  assistantLabel: Dictionary["chat"]["navLabel"];
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
  assistantLabel,
  items,
  logoSrc,
  homeLabel,
}: NavProps) {
  const [open, setOpen] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const menuId = useId();
  const currentPath = pathname.replace(/\/+$/, "") || "/";

  function isActive(item: NavItem) {
    if (item.href.includes("#heritages")) return currentPath.startsWith(`/${lang}/heritage/`);
    return item.href.split("#")[0].replace(/\/+$/, "") === currentPath;
  }

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

  // Nav links all point at home-page sections. prefetch={false}: prefetching the home page
  // would make the browser preload its hero photo on every page.
  const linkClass = "site-nav__link";

  return (
    <nav
      ref={navRef}
      aria-label={labels.label}
      className="site-nav"
    >
      <div className="site-nav__inner">
        <div className="flex min-w-0 items-center gap-1">
          {/* overflow-x-clip hides the logo while its width is 0 without clipping the focus outline above and below. */}
          <div
            inert={!showLogo}
            className={`site-nav__mini-brand ${showLogo ? "is-visible" : ""}`}
          >
            <BrandLink
              href={`/${lang}/`}
              label={homeLabel}
              className="block shrink-0 rounded-full"
            >
              <Image
                src={logoSrc}
                alt=""
                width={128}
                height={128}
                className="site-nav__mini-logo"
              />
            </BrandLink>
          </div>

          <button
            type="button"
            className="site-nav__menu-toggle"
            aria-expanded={open}
            aria-controls={menuId}
            aria-label={open ? labels.closeMenu : labels.openMenu}
            onClick={() => setOpen((value) => !value)}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="size-5"
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

          <ul className="site-nav__links">
            {items.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false} className={linkClass} aria-current={isActive(item) ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="site-nav__actions">
          <button
            type="button"
            className="site-nav__assistant"
            onClick={() => {
              window.dispatchEvent(new Event("nani:open"));
              setOpen(false);
            }}
          >
            <span aria-hidden="true">✳</span>
            <span>{assistantLabel}</span>
          </button>
          <LanguageToggle lang={lang} labels={languageLabels} />
        </div>
      </div>

      {/* Mobile menu: rendered always (hidden when closed) so aria-controls points at a real element. */}
      <ul
        id={menuId}
        hidden={!open}
        className="site-nav__mobile-links"
      >
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              prefetch={false}
              className={linkClass}
              aria-current={isActive(item) ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={linkClass}
            onClick={() => {
              window.dispatchEvent(new Event("nani:open"));
              setOpen(false);
            }}
          >
            {assistantLabel}
          </button>
        </li>
      </ul>
    </nav>
  );
}
