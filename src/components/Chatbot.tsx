"use client";

import { usePathname } from "next/navigation";
import { lazy, Suspense, useEffect, useRef, useState } from "react";

import type { ChatPanelProps } from "@/components/ChatPanel";
import NaniAvatar from "@/components/NaniAvatar";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/types/locale";

// The chat window is a separate chunk: it is not needed to show the page,
// so it is fetched while the browser is idle and is already loaded when someone opens it.
const loadPanel = () => import("@/components/ChatPanel");
const ChatPanel = lazy(loadPanel);

type ChatbotProps = Omit<ChatPanelProps, "onClose"> & { labels: Dictionary["chat"]; lang: Locale };

/** The home page hero (Hero.tsx); the big Nani figure would cover its buttons. */
const HERO_SELECTOR = "[data-nani-compact]";

/**
 * Floating "How can I help?" button, bottom-left on every page as in the sketch.
 *
 * Nani is the big half-body figure only on the home page once its hero has scrolled away.
 * Everywhere else she is her round face: at 1440 px the big figure covered the detail
 * page's table of contents, the first gallery photos, the contact form and the map.
 */
export default function Chatbot({ lang, ...props }: ChatbotProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === `/${lang}/`;
  // Whether the hero of the home page at `path` is on screen (set by the observer below).
  const [hero, setHero] = useState<{ path: string; onScreen: boolean } | null>(null);
  // Until the observer has reported, assume the hero is in view (also in the prerendered HTML),
  // so the big figure never flashes over it.
  const compact = !isHome || hero?.path !== pathname || hero.onScreen;
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Also warm the cache with the small avatars the panel shows (the file its srcset picks
    // for this screen), so opening and using the chat makes no network requests.
    const preload = () => {
      void loadPanel();
      const scale = window.devicePixelRatio > 1 ? 2 : 1;
      for (const size of [28, 40]) new Image().src = `/images/nani/nani-${size * scale}.webp`;
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(preload, 2000);
    return () => clearTimeout(timer);
  }, []);

  // On the home page, watch the hero (re-run on every navigation).
  useEffect(() => {
    const target = isHome ? document.querySelector(HERO_SELECTOR) : null;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([record]) => setHero({ path: pathname, onScreen: record.isIntersecting }),
      // The top 72 px are under the sticky header. rootMargin takes px or % only ("rem" throws).
      { rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [isHome, pathname]);

  // Lets CSS hide the 3D Map button where the open panel would cover it (globals.css).
  useEffect(() => {
    if (open) document.documentElement.dataset.chatOpen = "";
    else delete document.documentElement.dataset.chatOpen;
  }, [open]);

  function close() {
    setOpen(false);
    buttonRef.current?.focus(); // give focus back to the button that opened the chat
  }

  return (
    <>
      {/* Nani with her speech bubble. The button's accessible name is the bubble text, which
          names Nani, so the picture itself is alt="" (it would only repeat the name). */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? close() : setOpen(true))}
        // Big: Nani stands on the bottom edge of the screen, 130 px tall on phones, 260 px from 768 px.
        // Compact: her round face in the corner.
        className={`group fixed z-30 block text-left ${compact ? "bottom-4 left-4 md:bottom-6 md:left-6" : "bottom-0 left-2 md:left-4"}`}
        style={{
          paddingBottom: compact ? undefined : "env(safe-area-inset-bottom)",
          marginBottom: compact ? "env(safe-area-inset-bottom)" : undefined,
        }}
      >
        {compact ? (
          <NaniAvatar
            size={56}
            alt=""
            animated
            className="size-14 shadow-lg ring-4 ring-crimson group-hover:ring-brick"
          />
        ) : (
          <>
            {/* Half-body cut-out (scripts/optimize-images.ts). Low fetch priority so it never
                delays the page's main photo; the files are 7–54 KB. */}
            {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
            <img
              src="/images/nani/nani-figure-260.webp"
              srcSet="/images/nani/nani-figure-130.webp 104w, /images/nani/nani-figure-260.webp 207w, /images/nani/nani-figure-520.webp 414w"
              sizes="(min-width: 48rem) 207px, 104px"
              width={207}
              height={260}
              alt=""
              fetchPriority="low"
              decoding="async"
              className="nani-figure-animated h-[130px] w-auto drop-shadow-lg md:h-[260px]"
            />
          </>
        )}
        {/* Big: on phones the bubble sits above Nani, so it never runs into the 3D Map button;
            wider screens: beside her face. Compact: screen readers only (it still names the
            button). Hidden while the chat is open, so it never covers the panel. */}
        <span
          className={
            compact
              ? "sr-only"
              : `absolute bottom-full left-0 mb-1 w-52 rounded-2xl rounded-bl-sm bg-crimson px-3 py-2 text-sm leading-snug font-bold text-white shadow-lg ring-2 ring-white group-hover:bg-brick md:bottom-auto md:left-full md:top-8 md:mb-0 md:ml-1 md:w-60 md:rounded-bl-2xl md:rounded-tl-sm md:text-base ${
                  open ? "hidden" : ""
                }`
          }
        >
          {props.labels.bubble}
        </span>
      </button>

      {open && (
        <Suspense fallback={null}>
          <ChatPanel {...props} compact={compact} onClose={close} />
        </Suspense>
      )}
    </>
  );
}
