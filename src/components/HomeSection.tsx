import type { ReactNode } from "react";

interface HomeSectionProps {
  /** Anchor used by the nav links, e.g. "about" for /en/#about. */
  id: string;
  title: string;
  tone?: "cream" | "sand";
  children: ReactNode;
}

/** One section of the home page: anchor, heading with a gold rule, and content. */
export default function HomeSection({ id, title, tone = "cream", children }: HomeSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={tone === "sand" ? "bg-sand" : "bg-cream"}>
      <div className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h2 id={`${id}-title`} className="text-3xl font-bold md:text-4xl">
          {title}
        </h2>
        <div aria-hidden="true" className="mt-3 mb-8 h-1 w-16 rounded-full bg-gold" />
        {children}
      </div>
    </section>
  );
}
