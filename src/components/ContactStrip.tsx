import Link from "next/link";

import { phoneHref } from "@/lib/content";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";
import type { Ward } from "@/types/ward";

interface ContactStripProps {
  lang: Locale;
  dict: Dictionary;
  ward: Ward;
}

/** "Visit the ward" → ["Visit the", "ward"]; one word → ["", word]. The words themselves never change. */
function splitLastWord(text: string): [string, string] {
  const cut = text.trimEnd().lastIndexOf(" ");
  return cut < 0 ? ["", text] : [text.slice(0, cut + 1), text.slice(cut + 1)];
}

/**
 * The home page's closing call to action (Biegajaca layout): a giant heading whose last word is drawn
 * as an outline, the intro on the left, the ward office details as mono rows, and the button on the
 * right. The address is plain text with a link to our own 3D map (only when the office has
 * coordinates); the site never links to external map services.
 */
export default function ContactStrip({ lang, dict, ward }: ContactStripProps) {
  const [lead, last] = splitLastWord(dict.home.contactTitle);
  const linkClass = "link-slide font-medium";

  return (
    <section id="contact" aria-labelledby="contact-title" className="wrap section">
      <h2 id="contact-title" className="d-xl max-w-[14ch]">
        {lead}
        <span className="outline-word">{last}</span>
      </h2>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-6">
          <p className="lede">{dict.home.contactIntro}</p>
          <dl className="mt-8 max-w-xl">
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 rule py-2">
              <dt className="mono muted pt-3">{dict.footer.address}</dt>
              <dd>
                <span className="block pt-2.5">{ward.office.address[lang]}</span>
                {ward.office.coordinates && (
                  <Link href={`/${lang}/map/?site=ward-office`} className={linkClass}>
                    {dict.heritage.viewOnMap}
                  </Link>
                )}
              </dd>
            </div>
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 rule py-2">
              <dt className="mono muted pt-3">{dict.footer.phone}</dt>
              <dd>
                <a href={phoneHref(ward.office.phone)} className={linkClass}>
                  {ward.office.phone}
                </a>
              </dd>
            </div>
            <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 rule border-b border-line py-2">
              <dt className="mono muted pt-3">{dict.footer.email}</dt>
              <dd>
                <a href={`mailto:${ward.office.email}`} className={`${linkClass} break-all`}>
                  {ward.office.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>
        <div className="flex items-end lg:col-span-6 lg:justify-end">
          <Link href={`/${lang}/contact/`} className="btn btn-lg btn-accent">
            {dict.contactPage.contactLink} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
