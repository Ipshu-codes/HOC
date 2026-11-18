/**
 * The site's colour palette: ONE line chooses it. The colours of each palette are the token blocks
 * `:root[data-palette="…"]` in src/app/globals.css (checked for WCAG AA contrast there).
 *
 *   "a"  our red theme: sand ground, cream surfaces, brick footer and menu, crimson buttons
 *   "b"  Biegajaca's palette: light grey ground, near-black #1d1d1c text and dark bands, crimson accent only
 *   "c"  mix: their light/dark rhythm, dark sections in brick #8B1E1E, light sections cream, crimson accents, gold sparingly
 */
export const PALETTE: "a" | "b" | "c" = "c";
