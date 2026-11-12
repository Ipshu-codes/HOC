import Image from "next/image";
import Link from "next/link";

import Nav from "@/components/Nav";
import type { Dictionary, NavItem } from "@/lib/i18n";
import type { Locale } from "@/types/heritage";
import type { Ward } from "@/types/ward";

interface HeaderProps {
  lang: Locale;
  dict: Dictionary;
  ward: Ward;
  navItems: NavItem[];
}

/**
 * Top of every page, following the sketch: logo circle on the left, "WARD NO. 16 /
 * Kathmandu Metropolitan City" beside it, and the nav row underneath. The title
 * band scrolls away; only the nav bar sticks to the top.
 */
export default function Header({ lang, dict, ward, navItems }: HeaderProps) {
  return (
    <>
      <header className="border-b-2 border-gold/60 bg-cream">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:gap-5 md:py-5">
          {/* prefetch off: prefetching the home page would preload its hero photo on every page */}
          <Link
            href={`/${lang}/`}
            prefetch={false}
            aria-label={dict.a11y.homeLink}
            className="shrink-0 rounded-full ring-2 ring-crimson ring-offset-2 ring-offset-cream"
          >
            <Image
              src={ward.logo.src}
              alt={ward.logo.alt[lang]}
              width={128}
              height={128}
              priority
              className="size-14 rounded-full md:size-20"
            />
          </Link>

          <div className="min-w-0">
            <p className="font-heading text-2xl leading-tight font-bold tracking-wide text-brick md:text-4xl">
              {dict.site.headerTitle}
            </p>
            <p className="text-base leading-snug font-medium text-crimson md:text-lg">{dict.site.headerSubtitle}</p>
            <p lang={dict.site.otherLanguage} className="hidden text-sm text-ink/80 sm:block">
              {dict.site.otherLanguageLine}
            </p>
          </div>
        </div>
      </header>

      <Nav lang={lang} labels={dict.nav} languageLabels={dict.language} items={navItems} />
    </>
  );
}
