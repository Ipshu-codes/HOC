import type { Metadata } from "next";
import Link from "next/link";

import { mukta, playfair } from "@/app/fonts";
import en from "@/i18n/en.json";
import ne from "@/i18n/ne.json";
import "@/app/globals.css";

// Shown for any URL that matches no page (out/404.html in the static export).
// It renders outside the [lang] layout, so the language is unknown: the page is bilingual.

export const metadata: Metadata = {
  title: `${en.notFound.title} · ${en.site.title}`,
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="en" className={`${mukta.variable} ${playfair.variable}`}>
      <body className="flex min-h-screen items-center justify-center bg-cream px-4">
        <main className="w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-lg ring-1 ring-gold/50">
          <p aria-hidden="true" className="font-heading text-7xl font-bold text-crimson">
            404
          </p>
          <h1 className="mt-2 text-3xl font-bold">{en.notFound.title}</h1>
          <p className="mt-2 text-lg">{en.notFound.body}</p>
          <div lang="ne" className="mt-6 border-t border-gold/50 pt-6">
            <h2 className="text-2xl font-bold">{ne.notFound.title}</h2>
            <p className="mt-2 text-lg">{ne.notFound.body}</p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/en/" className="rounded-xl bg-crimson px-5 py-3 font-bold text-white hover:bg-brick">
              {en.notFound.home}
            </Link>
            <Link href="/ne/" lang="ne" className="rounded-xl bg-brick px-5 py-3 font-bold text-white hover:bg-crimson">
              {ne.notFound.home}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
