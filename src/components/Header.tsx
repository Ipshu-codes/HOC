import Image from "next/image";

import BrandLink from "@/components/BrandLink";
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
 * Kathmandu Metropolitan City" beside it, and the nav row underneath. The whole brand
 * is one link home (BrandLink). The title band scrolls away; only the nav bar sticks.
 */
export default function Header({ lang, dict, ward, navItems }: HeaderProps) {
  return (
    <>
      <header className="border-b-2 border-gold/60 bg-cream">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-5">
          <BrandLink href={`/${lang}/`} label={dict.a11y.homeLink}>
            {/* alt="": the link's name ("Ward No. 16, home") already says what it is. */}
            <Image
              src={ward.logo.src}
              alt=""
              width={128}
              height={128}
              priority
              className="size-14 shrink-0 rounded-full ring-2 ring-crimson ring-offset-2 ring-offset-cream md:size-20"
            />

            <span className="block min-w-0">
              <span className="block font-heading text-2xl leading-tight font-bold tracking-wide text-brick md:text-4xl">
                {dict.site.headerTitle}
              </span>
              <span className="block text-base leading-snug font-medium text-crimson md:text-lg">
                {dict.site.headerSubtitle}
              </span>
              <span lang={dict.site.otherLanguage} className="hidden text-sm text-ink/80 sm:block">
                {dict.site.otherLanguageLine}
              </span>
            </span>
          </BrandLink>

          {/* RatnaInTech logo on the right, vertically centered */}
          <div className="ml-4 shrink-0 md:ml-8">
            <Image
              src="/images/logo/Ratna.png"
              alt="RatnaInTech"
              width={120}
              height={60}
              className="h-auto max-h-14 w-auto md:max-h-20"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </header>

      <Nav
        lang={lang}
        labels={dict.nav}
        languageLabels={dict.language}
        items={navItems}
        logoSrc={ward.logo.src}
        homeLabel={dict.a11y.homeLink}
      />
    </>
  );
}
