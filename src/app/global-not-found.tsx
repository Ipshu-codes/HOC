import type { Metadata } from "next";
import Link from "next/link";

import { archivo, archivoDisplay, jetbrainsMono, mukta } from "@/app/fonts";
import { PALETTE } from "@/lib/theme";
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
    <html lang="en" data-palette={PALETTE} className={`${mukta.variable} ${archivo.variable} ${archivoDisplay.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-screen items-center justify-center bg-ground px-4">
        <main className="w-full max-w-xl text-center">
          <p aria-hidden="true" className="d-xl text-heading">
            404
          </p>
          <h1 className="d-2 mt-2">{en.notFound.title}</h1>
          <p className="mt-2 text-lg">{en.notFound.body}</p>
          <div lang="ne" className="rule mt-8 pt-8">
            <h2 className="text-3xl not-italic normal-case">{ne.notFound.title}</h2>
            <p className="mt-2 text-lg">{ne.notFound.body}</p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/en/" className="btn btn-lg btn-accent">
              {en.notFound.home}
            </Link>
            <Link href="/ne/" lang="ne" className="btn btn-lg btn-outline">
              {ne.notFound.home}
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
