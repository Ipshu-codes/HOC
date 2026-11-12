import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@/lib/i18n";

// Home page. The sections (hero, overview, about, heritages, gallery, contact) arrive in Phase 4.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return <h1 className="sr-only">{dict.site.title}</h1>;
}
