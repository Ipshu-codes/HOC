import type { TocEntry } from "@/types/heritage";

interface TableOfContentsProps {
  title: string;
  entries: TocEntry[];
}

/**
 * Links to the page's sections. On wide screens it is a sticky side column;
 * on small screens a collapsible <details> box above the text (no JavaScript needed).
 */
export default function TableOfContents({ title, entries }: TableOfContentsProps) {
  const list = (
    <ol className="space-y-1">
      {entries.map((entry) => (
        <li key={entry.id} className={entry.depth === 3 ? "pl-4 text-sm" : ""}>
          <a href={`#${entry.id}`} className="block rounded-md px-2 py-1 text-ink hover:bg-sand hover:text-brick">
            {entry.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <details className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-gold/40 lg:hidden">
        <summary className="cursor-pointer font-bold text-brick">{title}</summary>
        <nav aria-label={title} className="mt-3">
          {list}
        </nav>
      </details>

      <nav aria-label={title} className="sticky top-20 hidden lg:block">
        <p className="mb-2 px-2 font-bold text-brick">{title}</p>
        {list}
      </nav>
    </>
  );
}
