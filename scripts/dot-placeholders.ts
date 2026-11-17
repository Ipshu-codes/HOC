/**
 * Runs of dots used as placeholders, e.g. a festival description written as "………" or "....".
 * Used by check-content (content files) and verify-output (built pages), so the strict build fails
 * until they are filled in; `npm run dev` runs neither, so dev builds still work.
 *
 * A normal ellipsis at the end of text ("Type your question…", "Loading map…") is fine.
 */
const PATTERNS: { re: RegExp; what: string }[] = [
  { re: /\.{4,}/, what: "four or more dots" },
  { re: /…\s*…/, what: "two or more ellipsis characters" },
  // "…" or "..." alone as the content of a field or list item: after a dash, colon, bar, opening
  // quote or list bullet, with nothing but closing punctuation after it.
  { re: /(?:^\s*(?:[-*]|\d+\.)\s+|[—–:|]\s*|"\s*)(?:\.{3}|…)\s*["',]?\s*$/, what: "a lone ellipsis as content" },
];

export interface DotPlaceholder {
  line: number;
  what: string;
  text: string;
}

export function findDotPlaceholders(text: string): DotPlaceholder[] {
  const found: DotPlaceholder[] = [];
  text.split(/\r?\n/).forEach((line, i) => {
    for (const { re, what } of PATTERNS) {
      if (re.test(line)) {
        found.push({ line: i + 1, what, text: line.trim().slice(0, 100) });
        break;
      }
    }
  });
  return found;
}

/** The visible text of a built HTML page, one block per line (scripts, styles and tags removed). */
export function htmlText(html: string): string {
  return html
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/(p|li|h[1-6]|div|td|th|dd|dt|figcaption|span|a|button)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ");
}
