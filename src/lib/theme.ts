/**
 * The site's colour palette: ONE line chooses it. The colours of each palette are the token blocks
 * `:root[data-palette="…"]` in src/app/globals.css (checked for WCAG AA contrast there).
 *
 *   "a"  our red theme: sand ground, cream surfaces, brick footer and menu, crimson buttons
 *   "b"  Biegajaca's palette: light grey ground, near-black #1d1d1c text and dark bands, crimson accent only
 *   "c"  red theme: cream ground, brick-red bands/menu/footer, crimson headings, buttons and links, gold sparingly
 */
export const PALETTE: "a" | "b" | "c" = "c";
