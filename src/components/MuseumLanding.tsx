"use client";

import dynamic from "next/dynamic";
import { useCallback, useId, useRef, useState } from "react";

import Gallery from "@/components/Gallery";
import MuseumErrorBoundary from "@/components/gallery/MuseumErrorBoundary";
import type { MuseumPhase } from "@/components/gallery/MuseumCanvas";
import { MUSEUM_COMPACT_QUERY, REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/breakpoints";
import type { Dictionary } from "@/lib/i18n";
import type { GalleryPhoto } from "@/lib/images";
import { EXHIBIT_START_POSE, type ExhibitInput, type WorldPose } from "@/lib/museum-world";
import { useWebGL } from "@/lib/webgl";
import type { Locale } from "@/types/locale";

// The 3D layer (Three.js) is code-split away from the page; the title and button render without it.
const MuseumCanvas = dynamic(() => import("@/components/gallery/MuseumCanvas"), { ssr: false, loading: () => null });

interface MuseumLandingProps {
  lang: Locale;
  photos: GalleryPhoto[];
  sites: { slug: string; name: string }[];
  credit: string | null;
  year: number | null;
  /** Only the gallery strings: the whole dictionary would be sent to the browser. */
  galleryLabels: Dictionary["gallery"];
  labels: { title: string; start: string; hint: string; aboutWard: string; overview: string; readMore: string };
  exhibit: ExhibitInput;
  /** Where "About Ward 16 →" and the way out of the museum lead: the Overview section below. */
  overviewHref: string;
}

/**
 * The home page opens inside the online museum (the gallery's 3D museum, in its exhibit layout).
 *
 * Intro: the museum is already there, walking slowly forward, under the title and "Start Exploring".
 * Explore: the drift stops and the visitor takes over (arrow keys, wheel, drag; touch buttons on
 * phones). The ward map and logo hang in the entrance; signboards at the junction lead into one
 * wing per site; any picture can be approached for a closer look, all without leaving the page.
 * Without WebGL, "Start Exploring" opens the gallery's hanging line instead.
 */
export default function MuseumLanding({ lang, photos, sites, credit, year, galleryLabels, labels, exhibit, overviewHref }: MuseumLandingProps) {
  const titleId = useId();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const poseRef = useRef<WorldPose>({ ...EXHIBIT_START_POSE });
  const webgl = useWebGL();
  const compact = useMediaQuery(MUSEUM_COMPACT_QUERY);
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY);
  const [phase, setPhase] = useState<MuseumPhase>("intro");
  const [introGone, setIntroGone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const useCanvas = webgl && !failed;

  const fail = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);
  const onReady = useCallback(() => setReady(true), []);

  function start() {
    setPhase("explore");
    // Bring the whole museum into view under the sticky menu, and give it the keyboard.
    const section = sectionRef.current;
    if (section) {
      const menu = document.querySelector<HTMLElement>("nav.sticky")?.offsetHeight ?? 0;
      window.scrollTo({ top: section.getBoundingClientRect().top + window.scrollY - menu, behavior: reduced ? "auto" : "smooth" });
    }
    stageRef.current?.focus({ preventScroll: true });
    window.setTimeout(() => setIntroGone(true), reduced ? 0 : 700);
  }

  return (
    <section ref={sectionRef} aria-labelledby={titleId} className={`gallery-page museum-landing${phase === "explore" && !useCanvas ? " is-fallback" : ""}`} data-phase={phase}>
      <div ref={stageRef} tabIndex={-1} className="museum-landing-stage">
        {useCanvas ? (
          <MuseumErrorBoundary onError={fail}>
            <MuseumCanvas
              photos={photos}
              sites={sites}
              filter="all"
              lang={lang}
              enabled
              reducedMotion={reduced}
              activeIndex={activeIndex}
              compact={compact}
              labels={{
                help: galleryLabels.museumHelp,
                forward: galleryLabels.museumForward,
                back: galleryLabels.museumBack,
                left: galleryLabels.museumTurnLeft,
                right: galleryLabels.museumTurnRight,
                close: galleryLabels.lightbox.Close,
                previous: galleryLabels.lightbox.Previous,
                next: galleryLabels.lightbox.Next,
                hint: labels.hint,
                aboutWard: labels.aboutWard,
                readMore: labels.readMore,
              }}
              credit={credit}
              poseRef={poseRef}
              focusNonce={0}
              onReady={onReady}
              onActiveIndex={setActiveIndex}
              onFail={fail}
              exhibit={exhibit}
              phase={phase}
              aboutHref={overviewHref}
              heritageBase={`/${lang}/heritage/`}
            />
          </MuseumErrorBoundary>
        ) : (
          <div className="museum-landing-poster" aria-hidden="true" />
        )}
        {useCanvas && !ready && (
          <div className="museum-loading" aria-hidden="true">
            <span className="museum-loading-mark" />
          </div>
        )}

        {/* The title stays in the page (for screen readers) after the intro has faded away. */}
        <div className={`museum-landing-intro${phase === "explore" ? " is-leaving" : ""}${introGone ? " is-gone" : ""}`}>
          <h1 id={titleId} className="museum-landing-title">
            {labels.title}
          </h1>
          {!introGone && (
            <button type="button" className="museum-landing-start" disabled={phase !== "intro"} onClick={start}>
              {labels.start}
            </button>
          )}
        </div>

        {phase === "explore" && useCanvas && (
          <a href={overviewHref} className="museum-landing-exit">
            {labels.overview}
            <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 6l5 5 5-5" />
            </svg>
          </a>
        )}
      </div>

      {phase === "explore" && !useCanvas && (
        <div className="museum-landing-fallback">
          <Gallery lang={lang} photos={photos} sites={sites} credit={credit} year={year} labels={galleryLabels} />
        </div>
      )}
    </section>
  );
}
