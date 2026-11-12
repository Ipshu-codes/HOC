import { notFound } from "next/navigation";

import { getDictionary, isLocale } from "@/lib/i18n";

// Phase 2: an empty home page on the cream background. Sections arrive in Phase 4.
export default async function HomePage({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = getDictionary(lang);

  return (
    <main className="flex-1">
      <h1 className="sr-only">{dict.site.title}</h1>
    </main>
  );
}
