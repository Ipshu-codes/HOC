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
  const linkClass =
    "font-medium text-crimson underline underline-offset-4 hover:text-brick";
  // A plain mailto: link: the visitor's own email app opens with the ward's address and a subject line.
  const mailto = `mailto:${ward.office.email}?subject=${encodeURIComponent(dict.contactPage.mailSubject)}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <h1 className="text-4xl font-bold md:text-5xl">
        {dict.contactPage.title}
      </h1>
      <div
        aria-hidden="true"
        className="mt-3 mb-6 h-1 w-16 rounded-full bg-gold"
      />
      <p className="mb-8 max-w-3xl text-lg">{dict.contactPage.intro}</p>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* No form and no form service: visitors write from their own email app. */}
        <section
          aria-labelledby="write-to-us"
          className="rounded-xl bg-cream p-6 shadow-sm ring-1 ring-gold/40 md:p-8"
        >
          <h2 id="write-to-us" className="text-2xl font-bold">
            {dict.contactPage.writeHeading}
          </h2>
          <p className="mt-3 text-lg">{dict.contactPage.writeBody}</p>
          <a
            href={mailto}
            className="mt-6 inline-block rounded-xl bg-crimson px-5 py-3 font-bold text-white hover:bg-brick"
          >
            {dict.contactPage.emailButton} <span aria-hidden="true">→</span>
          </a>
          <p className="mt-4">
            <a href={mailto} className={`${linkClass} text-lg break-all`}>
              {ward.office.email}
            </a>
          </p>
        </section>

        <aside className="rounded-xl bg-sand p-6 ring-1 ring-gold/50">
          <h2 className="text-2xl font-bold">
            {dict.contactPage.officeHeading}
          </h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-bold text-crimson">
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
              <dt className="text-sm font-bold text-crimson">
                {dict.footer.phone}
              </dt>
              <dd>
                <a href={phoneHref(ward.office.phone)} className={linkClass}>
                  {ward.office.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-crimson">
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
