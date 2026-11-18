import { Archivo, JetBrains_Mono, Mukta } from "next/font/google";

// next/font downloads the fonts at build time and serves them from our own
// domain, so there is no request to Google from the visitor's browser.
//
// `subsets` lists the subsets that are *preloaded* (fetched first, at high
// priority). Only Latin is preloaded: preloading Devanagari as well meant
// ~270 KB of fonts competing with the first photo on every page. The
// Devanagari @font-face rules are still generated (unicode-range U+900-97F),
// so those files load as soon as a page shows Devanagari text.
//
// English pages: Archivo (body 400, headings 900 italic) + JetBrains Mono (small labels, counters,
// buttons), the pairing the UI match uses (docs/ui-match/reference-notes.md, D3).
// Nepali pages: Mukta only, for every kind of text (a slanted or monospaced Devanagari reads badly).

/**
 * Body text and all Nepali text (headings and body): Mukta covers Latin and Devanagari.
 * 400 body, 600 labels, 800 headings.
 */
export const mukta = Mukta({
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  variable: "--font-mukta",
  display: "swap",
});

/** English body text. */
export const archivo = Archivo({
  subsets: ["latin"],
  weight: "400",
  style: "normal",
  variable: "--font-archivo",
  display: "swap",
});

/**
 * English headings: heavy italic capitals, semi-condensed. The variable font with its width axis
 * (wdth), so the CSS can narrow the letters (font-stretch) like the reference's headings.
 */
export const archivoDisplay = Archivo({
  subsets: ["latin"],
  weight: "variable",
  style: "italic",
  axes: ["wdth"],
  variable: "--font-archivo-display",
  display: "swap",
});

/** English labels: breadcrumbs, counters ("01 / 09"), button labels, footer column titles. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-jetbrains",
  display: "swap",
});
