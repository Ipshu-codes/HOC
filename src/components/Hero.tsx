import Link from "next/link";
import type { CSSProperties } from "react";

export interface HeroStrip {
  src: string;
  srcSet: string;
  width: number;
  height: number;
  alt: string;
  /** Focal point as a CSS object-position, e.g. "center 30%" (content/home.json → heroSlides). */
  position?: string;
}

interface HeroProps {
  /** Four photos from content/home.json → heroSlides (two show on phones). */
  strips: HeroStrip[];
  title: string;
  subtitle: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
}

/**
 * The hero "wall" (Biegajaca layout): four tall photo strips side by side (two on phones), torn paper
 * at the edges, the title on paper strips, the subtitle in a small box and two buttons.
 *
 * Grey to colour: the strips start greyscale and turn to colour one after another, once, when the page
 * loads (a CSS animation, globals.css → .hero-strip). With reduced motion they are in colour at once.
 *
 * Only the first strip is described (it is the page's main photo, loaded first with high priority);
 * the other three are the same kind of view and are decorative (alt="").
 */
export default function Hero({ strips, title, subtitle, primary, secondary }: HeroProps) {
  return (
    <section data-enter="" className="hero-wall">
      <div className="hero-strips">
        {strips.map((strip, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- static export: no image server (see ResponsiveImage)
          <img
            key={strip.src}
            src={strip.src}
            srcSet={strip.srcSet}
            // A strip is a quarter of the width (half on phones), but tall: the browser needs a wider file.
            sizes="(min-width: 48rem) 40vw, 80vw"
            width={strip.width}
            height={strip.height}
            alt={index === 0 ? strip.alt : ""}
            loading={index < 2 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
            className="hero-strip"
            style={{ objectPosition: strip.position, "--i": index } as CSSProperties}
          />
        ))}
      </div>

      <div className="hero-copy">
        <h1 className="hero-title d-hero">
          <span className="paper-line">{title}</span>
        </h1>
        <div className="hero-row">
          <p className="hero-sub">{subtitle}</p>
          <div className="hero-ctas">
            <Link href={primary.href} className="btn btn-lg btn-accent">
              {primary.label}
            </Link>
            <Link href={secondary.href} className="btn btn-lg btn-paper">
              {secondary.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
