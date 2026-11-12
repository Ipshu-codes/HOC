import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { mukta, playfair } from "@/app/fonts";
import Chatbot from "@/components/Chatbot";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MapButton from "@/components/MapButton";
import { getHeritageList, getWard } from "@/lib/content";
import { getChatEntries } from "@/lib/faq";
import { getDictionary, getNavItems, isLocale, joinList } from "@/lib/i18n";
import { LOCALES } from "@/types/heritage";
import type { Locale } from "@/types/locale";
import "@/app/globals.css";

// This is the root layout (it renders <html>), placed under [lang] so that
// <html lang="en"> / <html lang="ne"> is correct for every page.

// Static export: build exactly /en and /ne, and nothing else.
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  // Built from the visible sites, so a draft site's name never reaches a preview build.
  const sites = getHeritageList(lang).map((h) => (lang === "ne" ? h.nameNe : h.name));
  return {
    // Absolute base for Open Graph image URLs. Set SITE_URL in the Cloudflare Pages build settings (see DEPLOY.md).
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: { default: dict.site.title, template: `%s · ${dict.site.title}` },
    description: dict.site.description.replace("{sites}", joinList(sites, dict.site.and)),
    icons: { icon: "/images/logo/ward-logo-64.png", apple: "/images/logo/ward-logo-256.png" },
  };
}

/** The chatbot's "no answer" message, with the ward office phone and email filled in. */
function chatFallback(lang: Locale, phone: string, email: string): string {
  return getDictionary(lang).chat.fallback.replace("{phone}", phone).replace("{email}", email);
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);
  const ward = getWard();
  const navItems = getNavItems(lang, dict);

  return (
    <html lang={lang} className={`${mukta.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main-content"
          className="sr-only z-50 rounded-md bg-crimson px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
        >
          {dict.a11y.skipToContent}
        </a>
        <Header lang={lang} dict={dict} ward={ward} navItems={navItems} />
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer lang={lang} dict={dict} ward={ward} navItems={navItems} heritages={getHeritageList(lang)} />
        <MapButton lang={lang} label={dict.map.floatingButton} />
        {/* FAQ entries for visible sites only; answers in both languages (the bot replies in the visitor's language). */}
        <Chatbot
          lang={lang}
          entries={getChatEntries()}
          labels={dict.chat}
          fallback={{
            en: chatFallback("en", ward.office.phone, ward.office.email),
            ne: chatFallback("ne", ward.office.phone, ward.office.email),
          }}
          readMore={{ en: getDictionary("en").chat.readMore, ne: getDictionary("ne").chat.readMore }}
        />
      </body>
    </html>
  );
}
