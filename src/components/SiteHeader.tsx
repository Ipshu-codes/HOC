"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";

import LanguageToggle from "@/components/LanguageToggle";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface SiteHeaderProps {
  lang: Locale;
  /** Only the strings this component needs: the whole dictionary would be sent to the browser. */
  navLabels: Dictionary["nav"];
  languageLabels: Dictionary["language"];
  /** Ward logo (content/ward.json). */
  logoSrc: string;
}

// The nav destinations: "Home" is the museum landing itself, "About" opens the About
// page (which starts with the Overview content), "Heritages" the Heritage Sites page.
const NAV_ROUTES = [
  { id: "overview", path: "" },
  { id: "about", path: "/about" },
  { id: "heritages", path: "/heritages" },
] as const;

/**
 * The site's single header row, sticky at the top of every page: ward logo — section links —
 * language switch — RatnaInTech logo. It has no background bar; the links are the site's red
 * and turn white on a red pill on hover, and the link for the current page stays in that
 * state (aria-current="page").
 *
 * Below `sm` the row wraps: the two logos on the first line, the links + language switch
 * centred on the second, so everything still fits a phone screen.
 */
export default function SiteHeader({ lang, navLabels, languageLabels, logoSrc }: SiteHeaderProps) {
  const pathname = usePathname();
  const path = pathname.replace(/\/+$/, "");
  const items = NAV_ROUTES.map((item) => ({
    ...item,
    href: `/${lang}${item.path}/`,
    label: navLabels[item.id],
  }));
  // The About/Heritages pages, every heritage detail page, the gallery and the 3D map
  // get the solid crimson header (with the scroll-morph card); the museum landing,
  // contact and every other page keep the transparent one.
  const solid =
    ["/about", "/heritages", "/gallery", "/map"].some(
      (p) => path === `/${lang}${p}`,
    ) || path.startsWith(`/${lang}/heritage/`);

  // On the crimson-header pages the bar morphs into a floating card as the page
  // scrolls. The progress (0 → 1 over SCROLL_RANGE px) is written to --header-p and
  // every visual property interpolates from it in CSS — no threshold, no jump.
  // The styles only exist under .site-header--solid, so the museum header is unaffected.
  const SCROLL_RANGE = 120;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() =>
        setProgress(Math.min(1, window.scrollY / SCROLL_RANGE)),
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={`site-header${solid ? " site-header--solid" : ""}`}
      style={{ "--header-p": progress } as CSSProperties}
    >
      {/* The card carries the crimson bar on inner pages and morphs into a floating
          card as --header-p goes 0 → 1 with scroll. On transparent-header pages it
          is just a plain wrapper. */}
      <div className="site-header-card">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3 pb-2 sm:flex-nowrap sm:gap-6 sm:px-6 sm:pt-4 sm:pb-3">
        {/* The ward logo is a plain image here — deliberately not a link. */}
        <div className="flex shrink-0 items-center">
          {/* alt="": decorative; the site name is in the page titles and footer. */}
          <Image
            src={logoSrc}
            alt=""
            width={128}
            height={128}
            priority
            className="size-11 rounded-full ring-2 ring-white/80 sm:size-14"
          />
        </div>

        <nav
          aria-label={navLabels.label}
          className="order-3 flex basis-full items-center justify-center gap-2 sm:order-2 sm:basis-auto sm:mx-auto sm:gap-4"
        >
          <ul className="flex items-center gap-1 sm:gap-5">
            {items.map((item) => {
              const active = path === `/${lang}${item.path}`;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={`site-nav-link${active ? " is-active" : ""}`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          {/* The language switch sits right beside "Heritages", inside the same nav row. */}
          <LanguageToggle lang={lang} labels={languageLabels} variant="plain" />
        </nav>

        {/* RatnaInTech logo on the right, slightly larger than the previous header's. */}
        <div className="order-2 ml-auto flex items-center sm:order-3 sm:ml-0">
          <Image
            src="/images/logo/Ratna.png"
            alt="RatnaInTech"
            width={120}
            height={60}
            className="h-11 w-auto sm:h-14"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
      </div>
    </header>
  );
}
