"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Dictionary } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/types/locale";

interface LanguageToggleProps {
  lang: Locale;
  labels: Dictionary["language"];
}

const SHORT_LABEL: Record<Locale, string> = { en: "EN", ne: "ने" };

/** "EN | ने" switch that keeps you on the same page: /en/gallery/ ⇄ /ne/gallery/. */
export default function LanguageToggle({ lang, labels }: LanguageToggleProps) {
  const pathname = usePathname();

  return (
    <ul aria-label={labels.label} className="flex items-center rounded-full border border-current/40 p-0.5">
      {LOCALES.map((locale) => {
        const current = locale === lang;
        const href = pathname.replace(/^\/(en|ne)(?=\/|$)/, `/${locale}`);
        return (
          <li key={locale}>
            <Link
              href={href}
              lang={locale}
              hrefLang={locale}
              aria-current={current ? "true" : undefined}
              className={
                current
                  ? "flex min-h-11 min-w-11 items-center justify-center rounded-full bg-fg px-3 text-sm font-bold text-ground"
                  : "flex min-h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-medium hover:underline hover:underline-offset-4"
              }
            >
              {/* Visible "EN" / "ने" plus the full name for screen readers ("EN English"):
                  the accessible name must contain the visible text. */}
              {SHORT_LABEL[locale]}
              <span className="sr-only"> {labels[locale]}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
