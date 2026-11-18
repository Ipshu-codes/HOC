import { Bricolage_Grotesque, Mukta } from "next/font/google";

// next/font downloads the fonts at build time and serves them from our own
// domain, so there is no request to Google from the visitor's browser.
//
// `subsets` lists the subsets that are *preloaded* (fetched first, at high
// priority). Only Latin is preloaded: preloading Devanagari as well meant
// ~270 KB of fonts competing with the first photo on every page. The
// Devanagari @font-face rules are still generated (unicode-range U+900-97F),
// so those files load as soon as a page shows Devanagari text.

/**
 * Body text and all Nepali text (headings and body): Mukta covers Latin and Devanagari.
 * 400 body, 600 small headings, 700 headings and bold. Weight 500 is not loaded (renders as 400).
 */
export const mukta = Mukta({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mukta",
  display: "swap",
});

/**
 * English headings only (Nepali pages never load it). Every heading is bold, so only the 700 weight
 * is loaded: one ~20 KB file. (The full variable font with its optical-size axis was 77 KB.)
 */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: "700",
  variable: "--font-bricolage",
  display: "swap",
});
