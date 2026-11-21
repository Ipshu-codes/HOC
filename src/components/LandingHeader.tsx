import Image from "next/image";
import Link from "next/link";

import BrandLink from "@/components/BrandLink";
import LanguageToggle from "@/components/LanguageToggle";
import type { Dictionary, NavItem } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface LandingHeaderProps {
  lang: Locale;
  /** Only the strings this component needs: the whole dictionary would be sent to the browser. */
  navLabels: Dictionary["nav"];
  languageLabels: Dictionary["language"];
  /** Accessible name of the ward logo link, "Ward No. 16 Heritage — home". */
  homeLabel: string;
  /** Ward logo (content/ward.json). */
  logoSrc: string;
}

/**
 * The landing page's single transparent top row, overlaid on the online museum:
 * ward logo — Home / About / Heritages — language switch — RatnaInTech logo.
 * It is positioned inside the museum wrapper, so it scrolls away with the museum
 * and the sections below get the full width back. The standard header and nav bar
 * are hidden on this page only (globals.css, `body:has(.museum-landing)`).
 *
 * Below `sm` the row wraps: logos + language switch on the first line, the three
 * links centred on the second, so everything still fits a phone screen.
 */
export default function LandingHeader({ lang, navLabels, languageLabels, homeLabel, logoSrc }: LandingHeaderProps) {
  // The same section links the old nav used, minus Gallery and Contact (their pages
  // stay reachable through the footer and the museum's own links).
  const items: NavItem[] = (["overview", "about", "heritages"] as const).map((id) => ({
    href: `/${lang}/#${id}`,
    label: navLabels[id],
  }));

  return (
    <header className="landing-header">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 pt-3 pb-2 sm:flex-nowrap sm:gap-6 sm:px-6 sm:pt-4">
        {/* The whole brand is just the logo now (no title text): one link home,
            scrolls to the top on the home page itself (BrandLink). */}
        <BrandLink
          href={`/${lang}/`}
          label={homeLabel}
          className="flex shrink-0 items-center rounded-full focus-visible:outline-offset-4"
        >
          {/* alt="": the link's name already says what it is. */}
          <Image
            src={logoSrc}
            alt=""
            width={128}
            height={128}
            priority
            className="size-11 rounded-full ring-2 ring-white/80 sm:size-14"
          />
        </BrandLink>

        <nav
          aria-label={navLabels.label}
          className="order-3 flex basis-full items-center justify-center sm:order-2 sm:basis-auto sm:mx-auto"
        >
          <ul className="flex items-center gap-1 sm:gap-5">
            {items.map((item) => (
              <li key={item.href}>
                {/* Same rule as the other home links: no prefetch of the home page. */}
                <Link href={item.href} prefetch={false} className="landing-nav-link">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-3 sm:order-3 sm:ml-0">
          <LanguageToggle lang={lang} labels={languageLabels} variant="plain" />
          {/* RatnaInTech logo on the right, slightly smaller than the old header's. */}
          <Image
            src="/images/logo/Ratna.png"
            alt="RatnaInTech"
            width={120}
            height={60}
            className="h-9 w-auto sm:h-11"
            style={{ objectFit: "contain" }}
          />
        </div>
      </div>
    </header>
  );
}
