"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

interface LanguageToggleProps {
  lang: Locale;
  labels: Dictionary["language"];
}

/** Compact switch to the other language, preserving the current route and query string. */
export default function LanguageToggle({ lang, labels }: LanguageToggleProps) {
  const pathname = usePathname();
  const router = useRouter();
  const nextLocale: Locale = lang === "en" ? "ne" : "en";
  const href = pathname.replace(/^\/(en|ne)(?=\/|$)/, `/${nextLocale}`);

  return (
    <Link
      href={href}
      lang={nextLocale}
      hrefLang={nextLocale}
      aria-label={`${labels.label}: ${labels[nextLocale]}`}
      className="site-language-switch"
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const { search, hash } = window.location;
        if (search || hash) {
          event.preventDefault();
          router.push(`${href}${search}${hash}`);
        }
      }}
    >
      {labels[nextLocale]}
    </Link>
  );
}
