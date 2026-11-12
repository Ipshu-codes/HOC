import Image from "next/image";
import Link from "next/link";

import SectionDivider from "@/components/SectionDivider";
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

export default function Footer({ lang, dict, ward, navItems, heritages }: FooterProps) {
  const heritagesTitle = byCount(dict.footer.heritages, heritages.length);
  const linkClass = "underline-offset-4 hover:text-white hover:underline focus-visible:outline-cream";

  return (
    <footer className="mt-auto bg-brick text-cream">
      <SectionDivider className="text-gold" />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-start gap-3">
          <Image src={ward.logo.src} alt="" width={128} height={128} className="size-14 shrink-0 rounded-full bg-cream" />
          <div>
            <p className="font-heading text-xl font-bold text-white">{ward.name[lang]}</p>
            <p>{ward.city[lang]}</p>
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-sans text-lg font-bold text-white">{dict.footer.office}</h2>
          <address className="space-y-1 not-italic">
            <p>
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

        <nav aria-label={dict.footer.quickLinks}>
          <h2 className="mb-3 font-sans text-lg font-bold text-white">{dict.footer.quickLinks}</h2>
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} prefetch={false} className={linkClass}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={heritagesTitle}>
          <h2 className="mb-3 font-sans text-lg font-bold text-white">{heritagesTitle}</h2>
          <ul className="space-y-1">
            {heritages.map((heritage) => (
              <li key={heritage.slug}>
                <Link href={`/${lang}/heritage/${heritage.slug}/`} className={linkClass}>
                  {lang === "ne" ? heritage.nameNe : heritage.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Extra bottom padding so the floating buttons never cover the copyright line. */}
      <div className="border-t border-cream/20 px-4 pt-4 pb-24 text-center text-sm md:pb-4">{dict.footer.copyright}</div>
    </footer>
  );
}
