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
    <ol>
      {entries.map((entry) => (
        <li key={entry.id} className={entry.depth === 3 ? "pl-4 text-sm" : ""}>
          <a href={`#${entry.id}`} className="link-slide min-h-9 py-1">
            {entry.text}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <>
      <details className="rule border-b border-line py-3 lg:hidden">
        <summary className="mono cursor-pointer py-2">{title}</summary>
        <nav aria-label={title} className="mt-3">
          {list}
        </nav>
      </details>

      <nav aria-label={title} className="hidden lg:block">
        <p className="mono muted mb-2">{title}</p>
        {list}
      </nav>
    </>
  );
}
