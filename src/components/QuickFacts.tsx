import type { Dictionary } from "@/lib/i18n";
import type { Heritage } from "@/types/heritage";

interface QuickFactsProps {
  heritage: Heritage;
  dict: Dictionary;
}

/** Key facts from the frontmatter. A field with no data is left out — never "Unknown". */
export default function QuickFacts({ heritage, dict }: QuickFactsProps) {
  const t = dict.heritage;
  const festivals = heritage.festivals.map((festival) =>
    festival.month ? `${festival.name} (${festival.month})` : festival.name,
  );

  const facts: { term: string; value: string | string[] | undefined }[] = [
    { term: t.location, value: heritage.location },
    { term: t.established, value: heritage.established },
    { term: t.tradition, value: heritage.deity_or_tradition },
    { term: t.festivals, value: festivals },
    { term: t.hours, value: heritage.visiting.hours },
    { term: t.entry, value: heritage.visiting.entry },
  ];
  const shown = facts.filter(({ value }) => (Array.isArray(value) ? value.length > 0 : Boolean(value)));

  return (
    <aside aria-labelledby="quick-facts-title" className="rounded-xl bg-sand p-6 shadow-sm ring-1 ring-gold/50">
      <h2 id="quick-facts-title" className="text-2xl font-bold">
        {t.quickFacts}
      </h2>
      <dl className="mt-4 space-y-4">
        {shown.map(({ term, value }) => (
          <div key={term}>
            <dt className="text-sm font-bold text-crimson">{term}</dt>
            <dd className="mt-0.5">
              {Array.isArray(value) ? (
                <ul className="list-disc space-y-0.5 pl-5">
                  {value.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                value
              )}
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
