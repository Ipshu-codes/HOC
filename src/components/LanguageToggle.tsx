"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Dictionary } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/types/locale";

interface LanguageToggleProps {
  lang: Locale;
  dict: Dictionary;
}

const SHORT_LABEL: Record<Locale, string> = { en: "EN", ne: "ने" };

/** "EN | ने" switch that keeps you on the same page: /en/gallery/ ⇄ /ne/gallery/. */
export default function LanguageToggle({ lang, dict }: LanguageToggleProps) {
  const pathname = usePathname();

  return (
    <ul aria-label={dict.language.label} className="flex items-center rounded-full border border-cream/40 p-0.5">
      {LOCALES.map((locale) => {
        const current = locale === lang;
        const href = pathname.replace(/^\/(en|ne)(?=\/|$)/, `/${locale}`);
        return (
          <li key={locale}>
            <Link
              href={href}
              lang={locale}
              hrefLang={locale}
              aria-label={dict.language[locale]}
              aria-current={current ? "true" : undefined}
              className={
                current
                  ? "block rounded-full bg-cream px-3 py-1 text-sm font-bold text-brick focus-visible:outline-cream"
                  : "block rounded-full px-3 py-1 text-sm font-medium text-cream hover:bg-crimson focus-visible:outline-cream"
              }
            >
              {SHORT_LABEL[locale]}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
