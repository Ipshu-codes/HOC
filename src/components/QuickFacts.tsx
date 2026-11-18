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

  // Their spec list: small mono labels on the left, values on the right, hairlines between.
  return (
    <aside aria-labelledby="quick-facts-title">
      <h2 id="quick-facts-title" className="mono muted mb-2">
        {t.quickFacts}
      </h2>
      <dl className="spec-list border-b border-line">
        {shown.map(({ term, value }) => (
          <div key={term}>
            <dt className="mono muted pt-0.5">{term}</dt>
            <dd>
              {Array.isArray(value) ? (
                <ul className="space-y-0.5">
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
