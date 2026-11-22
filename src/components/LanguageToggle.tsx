"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import type { Dictionary } from "@/lib/i18n";
import { carryLanguageSwitch } from "@/lib/language-switch";
import { LOCALES, type Locale } from "@/types/locale";

interface LanguageToggleProps {
  lang: Locale;
  labels: Dictionary["language"];
  /** "bar" sits on the old brick nav; "plain" floats in the site header (red text, no bar). */
  variant?: "bar" | "plain";
}

const SHORT_LABEL: Record<Locale, string> = { en: "EN", ne: "ने" };

/** "EN | ने" switch that keeps you on the same page AND the same section anchor:
    /en/gallery/ ⇄ /ne/gallery/, /en/#about ⇄ /ne/#about. A client-side navigation without Next's
    scroll to the top; what is open and how far the panel is scrolled travel along
    (src/lib/language-switch.ts). */
export default function LanguageToggle({ lang, labels, variant = "bar" }: LanguageToggleProps) {
  const pathname = usePathname();
  const plain = variant === "plain";
  const [hash, setHash] = useState("");

  // Keep the current #anchor so switching language does not drop the visitor back
  // to the top of the page (the home sections are reached by anchor).
  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  return (
    <ul
      aria-label={labels.label}
      className={`lang-toggle flex items-center rounded-full border p-0.5 ${plain ? "border-crimson/40" : "border-cream/40"}`}
    >
      {LOCALES.map((locale) => {
        const current = locale === lang;
        const href = pathname.replace(/^\/(en|ne)(?=\/|$)/, `/${locale}`) + hash;
        const className = plain
          ? current
            ? "block rounded-full bg-crimson px-3 py-1 text-sm font-bold text-white"
            : "block rounded-full px-3 py-1 text-sm font-medium text-crimson transition-colors hover:bg-crimson hover:text-white"
          : current
            ? "block rounded-full bg-cream px-3 py-1 text-sm font-bold text-brick"
            : "block rounded-full px-3 py-1 text-sm font-medium text-cream hover:bg-crimson";
        return (
          <li key={locale}>
            <Link
              href={href}
              scroll={false}
              onClick={() => {
                if (!current) carryLanguageSwitch(href);
              }}
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
