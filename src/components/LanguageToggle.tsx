"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import type { Dictionary } from "@/lib/i18n";
import { LOCALES, type Locale } from "@/types/locale";

interface LanguageToggleProps {
  lang: Locale;
  labels: Dictionary["language"];
  /** "bar" sits on the brick nav bar; "plain" floats over the landing museum (white text, no bar). */
  variant?: "bar" | "plain";
}

const SHORT_LABEL: Record<Locale, string> = { en: "EN", ne: "ने" };

/** "EN | ने" switch that keeps you on the same page: /en/gallery/ ⇄ /ne/gallery/. */
export default function LanguageToggle({ lang, labels, variant = "bar" }: LanguageToggleProps) {
  const pathname = usePathname();
  const plain = variant === "plain";

  return (
    <ul
      aria-label={labels.label}
      className={`flex items-center rounded-full border p-0.5 ${plain ? "border-white/60" : "border-cream/40"}`}
    >
      {LOCALES.map((locale) => {
        const current = locale === lang;
        const href = pathname.replace(/^\/(en|ne)(?=\/|$)/, `/${locale}`);
        const className = plain
          ? current
            ? "block rounded-full bg-crimson px-3 py-1 text-sm font-bold text-white transition-colors hover:bg-brick focus-visible:outline-white"
            : "block rounded-full px-3 py-1 text-sm font-medium text-white/90 transition-colors hover:text-crimson focus-visible:outline-white"
          : current
            ? "block rounded-full bg-cream px-3 py-1 text-sm font-bold text-brick focus-visible:outline-cream"
            : "block rounded-full px-3 py-1 text-sm font-medium text-cream hover:bg-crimson focus-visible:outline-cream";
        return (
          <li key={locale}>
            <Link
              href={href}
              lang={locale}
              hrefLang={locale}
              aria-current={current ? "true" : undefined}
              className={className}
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
