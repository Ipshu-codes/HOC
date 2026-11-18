import Image from "next/image";
import Link from "next/link";

import BrandLink from "@/components/BrandLink";
import { phoneHref } from "@/lib/content";
import { byCount, type Dictionary, type NavItem } from "@/lib/i18n";
import type { Heritage, Locale } from "@/types/heritage";
import type { Ward } from "@/types/ward";

interface FooterProps {
  lang: Locale;
  dict: Dictionary;
  ward: Ward;
  navItems: NavItem[];
  /** Sites on this build (drafts already removed for production). */
  heritages: Heritage[];
}

/**
 * Footer (Biegajaca layout): the office details and two link columns under small mono titles, then the
 * ward name as a giant wordmark across the full width (the footer's link home), then the copyright line.
 */
export default function Footer({ lang, dict, ward, navItems, heritages }: FooterProps) {
  const heritagesTitle = byCount(dict.footer.heritages, heritages.length);
  const linkClass = "link-slide";
  const titleClass = "mono mb-3 opacity-80";

  return (
    <footer className="site-footer mt-auto">
      <div className="wrap grid gap-10 pt-16 pb-12 sm:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className={titleClass}>{dict.footer.office}</h2>
          <address className="not-italic">
            <p className="py-1.5">
              <span className="sr-only">{dict.footer.address}: </span>
              {ward.office.address[lang]}
            </p>
            <p>
              {dict.footer.phone}:{" "}
              <a href={phoneHref(ward.office.phone)} className={linkClass}>
                {ward.office.phone}
              </a>
            </p>
            <p>
              {dict.footer.email}:{" "}
              <a href={`mailto:${ward.office.email}`} className={`${linkClass} break-all`}>
                {ward.office.email}
              </a>
            </p>
          </address>
        </div>

        <nav aria-label={dict.footer.quickLinks} className="lg:col-span-3 lg:col-start-7">
          <h2 className={titleClass}>{dict.footer.quickLinks}</h2>
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false} className={`${linkClass} text-lg`}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={heritagesTitle} className="lg:col-span-3">
          <h2 className={titleClass}>{heritagesTitle}</h2>
          <ul>
            {heritages.map((heritage) => (
              <li key={heritage.slug}>
                <Link href={`/${lang}/heritage/${heritage.slug}/`} className={`${linkClass} text-lg`}>
                  {lang === "ne" ? heritage.nameNe : heritage.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* The logo, the name as a wordmark and the city: one link to the top of the home page. */}
      <div className="wrap">
        <BrandLink href={`/${lang}/`} label={dict.a11y.homeLink} className="block rounded-sm focus-visible:outline-offset-4">
          <span className="flex items-center gap-3">
            <Image src={ward.logo.src} alt="" width={128} height={128} className="size-10 shrink-0 rounded-full" />
            <span className="mono">{ward.city[lang]}</span>
          </span>
          <span className="wordmark mt-2">{ward.name[lang]}</span>
        </BrandLink>
      </div>

      {/* Extra bottom padding so the floating buttons never cover the copyright line. */}
      <div className="wrap mono mt-6 border-t border-line pt-4 pb-24 md:pb-6">{dict.footer.copyright}</div>
    </footer>
  );
}
