"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import Gallery from "@/components/Gallery";
import MuseumTopBar from "@/components/MuseumTopBar";
import MuseumErrorBoundary from "@/components/gallery/MuseumErrorBoundary";
import type { MuseumPhase } from "@/components/gallery/MuseumCanvas";
import { MUSEUM_COMPACT_QUERY, REDUCED_MOTION_QUERY, useMediaQuery } from "@/lib/breakpoints";
import type { Dictionary } from "@/lib/i18n";
import type { GalleryPhoto } from "@/lib/images";
import { EXHIBIT_START_POSE, type ExhibitInput, type WorldPose } from "@/lib/museum-world";
import { useWebGL } from "@/lib/webgl";
import type { Locale } from "@/types/locale";

// The 3D layer (Three.js) is code-split away from the page; the controls and content render without it.
const MuseumCanvas = dynamic(() => import("@/components/gallery/MuseumCanvas"), { ssr: false, loading: () => null });

export interface MuseumShellProps {
  lang: Locale;
  photos: GalleryPhoto[];
  sites: { slug: string; name: string }[];
  credit: string | null;
  year: number | null;
  /** Only the gallery strings: the whole dictionary would be sent to the browser. */
  galleryLabels: Dictionary["gallery"];
  labels: { title: string; start: string; hint: string; aboutWard: string; readMore: string };
  exhibit: ExhibitInput;
  /** Where "About Ward 16 →" in the emblem's close-up leads: the About page. */
  aboutHref: string;
  /** The museum's own control row (emblem, menu, contact, logo, language): the site has no header. */
  topBar: Omit<ComponentProps<typeof MuseumTopBar>, "lang" | "currentHref">;
  /** The current page (from the layout); on the home page there is none to show. */
  children: ReactNode;
}

/** "/en" or "/en/about" — the path without its trailing slash. */
function trimmed(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

/**
 * The online museum is the website. It lives in the root layout, so it is mounted once: moving between
 * pages keeps the same canvas, renderer and camera position.
 *
 * - Home page (Overview): the museum alone. Intro: a slow walk forward under the title and "Start
 *   Exploring"; then the visitor takes over (arrow keys, wheel, drag; touch buttons on phones).
 * - Every other page (About, Heritages, Gallery, a heritage site, the 3D map…): an information panel
 *   floating over the museum, which stays visible around it, still and untouchable. The panel shows
 *   the page's own content (laid out for the panel's width); ×, Esc or a click beside it closes it
 *   and returns to the museum exactly as it was. The page's URL still opens it directly.
 *
 * Without WebGL, "Start Exploring" opens the gallery's hanging line instead.
 */
export default function MuseumShell({ lang, photos, sites, credit, year, galleryLabels, labels, exhibit, aboutHref, topBar, children }: MuseumShellProps) {
  const titleId = useId();
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const poseRef = useRef<WorldPose>({ ...EXHIBIT_START_POSE });
  const pathname = trimmed(usePathname());
  const home = pathname === `/${lang}`;
  const webgl = useWebGL();
  const compact = useMediaQuery(MUSEUM_COMPACT_QUERY);
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY);
  const [started, setStarted] = useState(false);
  const [introGone, setIntroGone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const useCanvas = webgl && !failed;
  const phase: MuseumPhase = !home ? "backdrop" : started ? "explore" : "intro";

  // The menu marks the page being shown; a heritage site's own page belongs to "Heritages".
  const current =
    topBar.nav.items.find((item) => trimmed(item.href) === pathname) ??
    topBar.nav.items
      .filter((item) => trimmed(item.href) !== `/${lang}`)
      .find((item) => pathname.startsWith(trimmed(item.href)) || (pathname.startsWith(`/${lang}/heritage/`) && item.href.endsWith("/heritages/")));

  const fail = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, [setFailed, setReady]);
  const onReady = useCallback(() => setReady(true), [setReady]);

  // Closing a panel goes back to the museum (client navigation: the scene is never rebuilt). Back in
  // the browser then reopens the panel, like undoing the close.
  const close = useCallback(() => {
    router.push(`/${lang}/`, { scroll: false });
  }, [router, lang]);

  // A newly opened panel takes the keyboard focus, so it is read out and Esc works at once.
  useEffect(() => {
    if (!home) panelRef.current?.focus({ preventScroll: true });
  }, [home, pathname]);

  // Esc closes the panel, unless something in front of it handles Esc itself (the photo viewer, the
  // contact popup, the chat with Nani, the menu).
  useEffect(() => {
    if (home) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("dialog[open], .photo-view")) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement && active.closest('[role="dialog"]') && !panelRef.current?.contains(active)) return;
      if (active instanceof HTMLElement && active.closest(".museum-menu-wrap")) return;
      event.preventDefault();
      close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [home, close]);

  function start() {
    setStarted(true);
    // Give the museum the keyboard, so the arrow keys walk at once.
    stageRef.current?.focus({ preventScroll: true });
    window.setTimeout(() => setIntroGone(true), reduced ? 0 : 700);
  }

  return (
    <div className={`gallery-page museum-shell ${home ? "is-home" : "is-page"}${home && started && !useCanvas ? " is-fallback" : ""}`}>
      <div ref={stageRef} tabIndex={-1} className="museum-stage" inert={!home}>
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
              aboutHref={aboutHref}
              heritageBase={`/${lang}/heritage/`}
            />
          </MuseumErrorBoundary>
        ) : (
          <div className="museum-poster" aria-hidden="true" />
        )}
        {useCanvas && !ready && (
          <div className="museum-loading" aria-hidden="true">
            <span className="museum-loading-mark" />
          </div>
        )}
      </div>
      {/* Behind a panel the museum is a calm backdrop, lightly tinted so the panel stands out. */}
      {!home && <div className="museum-veil" aria-hidden="true" />}

      <MuseumTopBar lang={lang} {...topBar} currentHref={current?.href ?? null} />

      <main id="main-content" tabIndex={-1} className={home ? "museum-main-home" : "museum-main-page"}>
        {home ? (
          <>
            {/* The title stays in the page (for screen readers) after the intro has faded away. */}
            <div className={`museum-intro${started ? " is-leaving" : ""}${introGone ? " is-gone" : ""}`}>
              <h1 id={titleId} className="museum-title">
                {labels.title}
              </h1>
              {!introGone && (
                <button type="button" className="museum-start" disabled={started} onClick={start}>
                  {labels.start}
                </button>
              )}
            </div>
            {started && !useCanvas && (
              <div className="museum-fallback">
                <Gallery lang={lang} photos={photos} sites={sites} credit={credit} year={year} labels={galleryLabels} />
              </div>
            )}
            {children}
          </>
        ) : (
          // A click beside the panel (on the museum around it) closes it.
          <div
            className="museum-panel-layer"
            onClick={(event) => {
              if (event.target === event.currentTarget) close();
            }}
          >
            <section
              key={pathname}
              ref={panelRef}
              role="dialog"
              aria-label={current?.label ?? topBar.nav.menu}
              tabIndex={-1}
              className="museum-panel"
            >
              <button type="button" className="museum-panel-close" aria-label={galleryLabels.lightbox.Close} title={galleryLabels.lightbox.Close} onClick={close}>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 16 16" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
              <div className="museum-panel-body">{children}</div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
