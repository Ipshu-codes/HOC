import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { mukta, playfair } from "@/app/fonts";
import Chatbot from "@/components/Chatbot";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MapButton from "@/components/MapButton";
import { getHeritageList, getHomeConfig, getWard } from "@/lib/content";
import { getChatData } from "@/lib/faq";
import { getDictionary, getNavItems, isLocale, joinList } from "@/lib/i18n";
import { findSiteImage } from "@/lib/images";
import { SITE_URL } from "@/lib/site-url";
import { LOCALES } from "@/types/heritage";
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
  const description = dict.site.description.replace("{sites}", joinList(sites, dict.site.and));
  // Default share image for pages without their own: the home page hero (largest file).
  const hero = getHomeConfig()
    .heroCandidates.map((src) => findSiteImage(src, getHeritageList(lang)))
    .find((image) => image !== null);
  return {
    // Absolute base for Open Graph image URLs. Set SITE_URL in the Cloudflare Pages build settings (see DEPLOY.md).
    metadataBase: new URL(SITE_URL),
    title: { default: dict.site.title, template: `%s · ${dict.site.title}` },
    description,
    icons: { icon: "/images/logo/ward-logo-64.png", apple: "/images/logo/ward-logo-256.png" },
    openGraph: {
      type: "website",
      siteName: dict.site.title,
      locale: lang === "ne" ? "ne_NP" : "en_US",
      title: dict.site.title,
      description,
      images: hero ? [{ url: hero.src.replace(/\.webp$/, "-1920.webp"), alt: hero.alt }] : [],
    },
  };
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
        {/* Topics and answers for visible sites only, in the page language. */}
        <Chatbot
          data={getChatData(lang)}
          labels={dict.chat}
          contactText={dict.chat.didntFindAnswer
            .replace("{phone}", ward.office.phone)
            .replace("{email}", ward.office.email)}
        />
      </body>
    </html>
  );
}
