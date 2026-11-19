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
      <header className="site-header">
        <div className="site-header__inner">
          <BrandLink href={`/${lang}/`} label={dict.a11y.homeLink}>
            {/* alt="": the link's name ("Ward No. 16, home") already says what it is. */}
            <Image
              src={ward.logo.src}
              alt=""
              width={128}
              height={128}
              priority
              className="site-header__logo"
            />

            <span className="site-header__wordmark">
              <span className="site-header__title">
                {dict.site.headerTitle}
              </span>
              <span className="site-header__subtitle">
                {dict.site.headerSubtitle}
              </span>
              <span lang={dict.site.otherLanguage} className="site-header__other-language">
                {dict.site.otherLanguageLine}
              </span>
            </span>
          </BrandLink>
        </div>
      </header>

      <Nav
        lang={lang}
        labels={dict.nav}
        languageLabels={dict.language}
        assistantLabel={dict.chat.navLabel}
        items={navItems}
        logoSrc={ward.logo.src}
        homeLabel={dict.a11y.homeLink}
      />
    </>
  );
}
