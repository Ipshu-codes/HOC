import Link from "next/link";

import HomeSection from "@/components/HomeSection";
import { phoneHref } from "@/lib/content";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";
import type { Ward } from "@/types/ward";

interface ContactStripProps {
  lang: Locale;
  dict: Dictionary;
  ward: Ward;
}

/**
 * Ward office contact details. There is no embedded map yet because the office
 * coordinates are unknown (see MISSING_INFO.md), so the address links to an
 * OpenStreetMap search instead.
 */
export default function ContactStrip({ lang, dict, ward }: ContactStripProps) {
  // Search with the English address: OpenStreetMap's search matches it more reliably.
  const osmSearch = `https://www.openstreetmap.org/search?query=${encodeURIComponent(ward.office.address.en)}`;
  const linkClass = "font-medium text-crimson underline underline-offset-4 hover:text-brick";

  return (
    <HomeSection id="contact" title={dict.home.contactTitle} tone="sand">
      <p className="max-w-2xl text-lg">{dict.home.contactIntro}</p>

      <dl className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-cream p-5 shadow-sm ring-1 ring-gold/40">
          <dt className="font-bold text-brick">{dict.footer.address}</dt>
          <dd className="mt-1">{ward.office.address[lang]}</dd>
          <dd className="mt-2">
            <a href={osmSearch} target="_blank" rel="noopener noreferrer" className={linkClass}>
              {dict.home.openInOsm}
              <span className="sr-only"> {dict.home.opensInNewTab}</span>
              <span aria-hidden="true"> ↗</span>
            </a>
          </dd>
        </div>
        <div className="rounded-xl bg-cream p-5 shadow-sm ring-1 ring-gold/40">
          <dt className="font-bold text-brick">{dict.footer.phone}</dt>
          <dd className="mt-1">
            <a href={phoneHref(ward.office.phone)} className={linkClass}>
              {ward.office.phone}
            </a>
          </dd>
        </div>
        <div className="rounded-xl bg-cream p-5 shadow-sm ring-1 ring-gold/40">
          <dt className="font-bold text-brick">{dict.footer.email}</dt>
          <dd className="mt-1">
            <a href={`mailto:${ward.office.email}`} className={`${linkClass} break-all`}>
              {ward.office.email}
            </a>
          </dd>
        </div>
      </dl>

      <Link
        href={`/${lang}/contact/`}
        className="mt-8 inline-block rounded-xl bg-crimson px-5 py-3 font-bold text-white hover:bg-brick"
      >
        {dict.contactPage.sendMessageLink} <span aria-hidden="true">→</span>
      </Link>
    </HomeSection>
  );
}
