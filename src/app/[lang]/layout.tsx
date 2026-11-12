import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { mukta, playfair } from "@/app/fonts";
import { getDictionary, isLocale } from "@/lib/i18n";
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
  return {
    title: { default: dict.site.title, template: `%s · ${dict.site.title}` },
    description: dict.site.description,
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${mukta.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
