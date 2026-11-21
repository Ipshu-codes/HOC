import type { ReactNode } from "react";

interface HomeSectionProps {
  /** Anchor used by the nav links, e.g. "about" for /en/about/. */
  id: string;
  title: string;
  tone?: "cream" | "sand";
  /** "h1" for a page's main section, "h2" for a second section on the same page. */
  headingLevel?: "h1" | "h2";
  children: ReactNode;
}

/** One section of a content page: anchor, heading with a gold rule, and content. */
export default function HomeSection({ id, title, tone = "cream", headingLevel = "h1", children }: HomeSectionProps) {
  // scroll-mt keeps the heading clear of the sticky site header on anchor jumps.
  const Heading = headingLevel;
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-32 ${tone === "sand" ? "bg-sand" : "bg-cream"}`}>
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <Heading id={`${id}-title`} className="text-3xl font-bold md:text-4xl">
          {title}
        </Heading>
        <div aria-hidden="true" className="mt-3 mb-8 h-1 w-16 rounded-full bg-gold" />
        {children}
      </div>
    </section>
  );
}
