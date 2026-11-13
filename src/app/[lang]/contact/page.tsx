import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ContactForm from "@/components/ContactForm";
import { getWard, phoneHref } from "@/lib/content";
import { getDictionary, isLocale } from "@/lib/i18n";

export async function generateMetadata({ params }: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};
  const dict = getDictionary(lang);
  return {
    title: dict.contactPage.title,
    description: dict.contactPage.intro,
    alternates: { languages: { en: "/en/contact/", ne: "/ne/contact/" } },
  };
}

export default async function ContactPage({ params }: PageProps<"/[lang]/contact">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);
  const ward = getWard();
  const osmSearch = `https://www.openstreetmap.org/search?query=${encodeURIComponent(ward.office.address.en)}`;
  const linkClass = "font-medium text-crimson underline underline-offset-4 hover:text-brick";

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <h1 className="text-4xl font-bold md:text-5xl">{dict.contactPage.title}</h1>
      <div aria-hidden="true" className="mt-3 mb-6 h-1 w-16 rounded-full bg-gold" />
      <p className="mb-8 max-w-3xl text-lg">{dict.contactPage.intro}</p>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* The access key is inlined at build time from the NEXT_PUBLIC_WEB3FORMS_KEY environment variable. */}
        <ContactForm
          accessKey={process.env.NEXT_PUBLIC_WEB3FORMS_KEY || undefined}
          email={ward.office.email}
          phone={ward.office.phone}
          labels={dict.contactPage}
        />

        <aside className="h-fit rounded-xl bg-sand p-6 ring-1 ring-gold/50">
          <h2 className="text-2xl font-bold">{dict.contactPage.officeHeading}</h2>
          <dl className="mt-4 space-y-3">
            <div>
              <dt className="text-sm font-bold text-crimson">{dict.footer.address}</dt>
              <dd>{ward.office.address[lang]}</dd>
              <dd>
                <a href={osmSearch} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {dict.home.openInOsm}
                  <span className="sr-only"> {dict.home.opensInNewTab}</span>
                  <span aria-hidden="true"> ↗</span>
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-crimson">{dict.footer.phone}</dt>
              <dd>
                <a href={phoneHref(ward.office.phone)} className={linkClass}>
                  {ward.office.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-crimson">{dict.footer.email}</dt>
              <dd>
                <a href={`mailto:${ward.office.email}`} className={`${linkClass} break-all`}>
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
