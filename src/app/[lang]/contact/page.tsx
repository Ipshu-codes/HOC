import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getWard, phoneHref } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.contactPage.title,
    description: dict.contactPage.intro,
    alternates: { languages: { en: "/en/contact/", ne: "/ne/contact/" } },
  };
}

export default async function ContactPage({
  params,
}: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const ward = getWard();
  const linkClass = "link-slide font-medium";
  // A plain mailto: link: the visitor's own email app opens with the ward's address and a subject line.
  const mailto = `mailto:${ward.office.email}?subject=${encodeURIComponent(dict.contactPage.mailSubject)}`;

  return (
    // Biegajaca's contact page: giant title, the intro, a hairline; "write to us" left, details right.
    <div className="wrap pt-8 pb-16 md:pt-10">
      <h1 className="d-xl max-w-[12ch]">{dict.contactPage.title}</h1>
      <p className="justified lede mt-6 mb-10 max-w-2xl">{dict.contactPage.intro}</p>

      <div className="rule grid gap-10 pt-10 lg:grid-cols-12 lg:gap-[var(--gap)]">
        {/* No form and no form service: visitors write from their own email app. */}
        <section aria-labelledby="write-to-us" className="lg:col-span-7">
          <h2 id="write-to-us" className="d-3">
            {dict.contactPage.writeHeading}
          </h2>
          <p className="justified lede mt-5">{dict.contactPage.writeBody}</p>
          <a
            href={mailto}
            className="btn btn-lg btn-accent mt-8"
          >
            {dict.contactPage.emailButton} <span aria-hidden="true">→</span>
          </a>
          <p className="mt-4">
            <a href={mailto} className={`${linkClass} text-lg break-all`}>
              {ward.office.email}
            </a>
          </p>
        </section>

        <aside className="lg:col-span-4 lg:col-start-9">
          <h2 className="mono muted mb-3">
            {dict.contactPage.officeHeading}
          </h2>
          <dl className="spec-list border-b border-line">
            <div>
              <dt className="mono muted pt-0.5">
                {dict.footer.address}
              </dt>
              <dd>{ward.office.address[lang]}</dd>
              {/* Our own 3D map, never an external map service. */}
              {ward.office.coordinates && (
                <dd>
                  <Link
                    href={`/${lang}/map/?site=ward-office`}
                    className={linkClass}
                  >
                    {dict.heritage.viewOnMap}
                  </Link>
                </dd>
              )}
            </div>
            <div>
              <dt className="mono muted pt-0.5">
                {dict.footer.phone}
              </dt>
              <dd>
                <a href={phoneHref(ward.office.phone)} className={linkClass}>
                  {ward.office.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="mono muted pt-0.5">
                {dict.footer.email}
              </dt>
              <dd>
                <a
                  href={`mailto:${ward.office.email}`}
                  className={`${linkClass} break-all`}
                >
                  {ward.office.email}
                </a>
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}
