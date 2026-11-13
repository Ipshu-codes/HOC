import { Mukta, Playfair_Display } from "next/font/google";

// next/font downloads the fonts at build time and serves them from our own
// domain, so there is no request to Google from the visitor's browser.
//
// `subsets` lists the subsets that are *preloaded* (fetched first, at high
// priority). Only Latin is preloaded: preloading Devanagari as well meant
// ~270 KB of fonts competing with the first photo on every page. The
// Devanagari @font-face rules are still generated (unicode-range U+900-97F),
// so those files load as soon as a page shows Devanagari text.

/** Body text for both languages — Mukta covers Latin and Devanagari. Weight 500 is not loaded (renders as 400). */
export const mukta = Mukta({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mukta",
  display: "swap",
});

/** English headings (all bold). */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-playfair",
  display: "swap",
});
