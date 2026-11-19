import type { ReactNode } from "react";
import Reveal from "@/components/Reveal";

interface HomeSectionProps {
  /** Anchor used by the nav links, e.g. "about" for /en/#about. */
  id: string;
  title: string;
  tone?: "cream" | "sand" | "crimson";
  children: ReactNode;
  index?: string;
}

/** One section of the home page: anchor, heading with a gold rule, and content. */
export default function HomeSection({ id, title, tone = "cream", children, index }: HomeSectionProps) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`editorial-section ${tone === "sand" ? "editorial-section--sand" : tone === "crimson" ? "editorial-section--crimson" : ""}`}>
      <div className="editorial-section__inner">
        <div className="editorial-section__heading">
          {index && <span aria-hidden="true" className="editorial-section__index">{index}</span>}
          <h2 id={`${id}-title`}>
          {title}
          </h2>
        </div>
        <Reveal className="editorial-section__content">{children}</Reveal>
      </div>
    </section>
  );
}
