import { Mukta, Playfair_Display } from "next/font/google";

// next/font downloads the fonts at build time and serves them from our own
// domain, so there is no request to Google from the visitor's browser.

/** Body text for both languages — Mukta covers Latin and Devanagari. */
export const mukta = Mukta({
  subsets: ["latin", "devanagari"],
  weight: ["400", "500", "700"],
  variable: "--font-mukta",
  display: "swap",
});

/** English headings. */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});
