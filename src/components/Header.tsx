import SiteHeader from "@/components/SiteHeader";
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
 * Top of every page: the fixed header with MENU, the ward name (one link home) and the language
 * switch (SiteHeader, a client component because of the menu). Only the strings it needs are passed.
 */
export default function Header({ lang, dict, ward, navItems }: HeaderProps) {
  return (
    <SiteHeader
      lang={lang}
      labels={dict.nav}
      languageLabels={dict.language}
      homeLabel={dict.a11y.homeLink}
      title={dict.site.headerTitle}
      subtitle={dict.site.headerSubtitle}
      otherLanguage={dict.site.otherLanguage as Locale}
      otherLanguageLine={dict.site.otherLanguageLine}
      items={navItems}
      logoSrc={ward.logo.src}
    />
  );
}
