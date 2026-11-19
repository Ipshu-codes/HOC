import Link from "next/link";

import HeroSlides, { type HeroSlide } from "@/components/HeroSlides";
import type { Locale } from "@/types/heritage";

interface HeroProps {
  lang: Locale;
  title: string;
  subtitle: string;
  mapLabel: string;
  eyebrow: string;
  slides: HeroSlide[];
  intervalMs: number;
}

/** Homepage hero with a photographic introduction and a link to the 3D map. */
export default function Hero({ lang, title, subtitle, mapLabel, eyebrow, slides, intervalMs }: HeroProps) {
  return (
    <section className="home-hero" aria-labelledby="home-title">
      <div className="home-hero__intro">
        <HeroSlides
          slides={slides}
          intervalMs={intervalMs}
        />
        <p className="eyebrow">{eyebrow}</p>
        <h1 id="home-title">{title}</h1>
        <p className="home-hero__lead justified">{subtitle}</p>
        <Link className="button button--light home-hero__map-link" href={`/${lang}/map/`}>
          <span>{mapLabel}</span><span aria-hidden="true">↗</span>
        </Link>
      </div>

    </section>
  );
}
