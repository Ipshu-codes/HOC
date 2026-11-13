import Link from "next/link";

import en from "@/i18n/en.json";
import ne from "@/i18n/ne.json";

// A static export has no server to send a 301, so "/" is a tiny HTML page that
// redirects with <meta http-equiv="refresh"> (React hoists it into <head>).
// On Cloudflare Pages, public/_redirects already sends "/" to "/en/"; this page is the fallback.
// Its language is unknown, so it links to both versions.
export default function RootRedirect() {
  return (
    <main className="p-8">
      <meta httpEquiv="refresh" content="0; url=/en/" />
      <link rel="canonical" href="/en/" />
      <p>
        <Link href="/en/" className="text-crimson underline">
          {en.site.title} — {en.language.en}
        </Link>
        {" · "}
        <Link href="/ne/" className="text-crimson underline" lang="ne">
          {ne.site.title} — {ne.language.ne}
        </Link>
      </p>
    </main>
  );
}
