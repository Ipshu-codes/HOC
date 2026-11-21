import type { ReactNode } from "react";

interface HomeSectionProps {
  /** Anchor for the section, e.g. "overview" for /en/about/#overview. */
  id: string;
  title: string;
  tone?: "cream" | "sand";
  /** 1 when the section opens its page (its title is then the page's h1). */
  headingLevel?: 1 | 2;
  children: ReactNode;
}

/** One content section (About, Heritages…): anchor, heading with a gold rule, and content. */
export default function HomeSection({ id, title, tone = "cream", headingLevel = 2, children }: HomeSectionProps) {
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={tone === "sand" ? "bg-sand" : "bg-cream"}>
      <div className="mx-auto max-w-6xl px-5 py-8 @2xl:px-8 @2xl:py-10">
        <Heading id={`${id}-title`} className="text-3xl font-bold @2xl:text-4xl">
          {title}
        </Heading>
        <div aria-hidden="true" className="mt-3 mb-8 h-1 w-16 rounded-full bg-gold" />
        {children}
      </div>
    </section>
  );
}
