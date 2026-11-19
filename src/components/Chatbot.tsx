"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

import type { ChatPanelProps } from "@/components/ChatPanel";
import type { Dictionary } from "@/lib/i18n";

// The chat window is a separate chunk: it is not needed to show the page,
// so it is fetched while the browser is idle and is already loaded when someone opens it.
const loadPanel = () => import("@/components/ChatPanel");
const ChatPanel = lazy(loadPanel);

type ChatbotProps = Omit<ChatPanelProps, "onClose"> & { labels: Dictionary["chat"] };

/** Large cut-out (scripts/optimize-images.ts), used by the floating preview. */
const FIGURE_SRCSET =
  "/images/nani/nani-figure-260.webp 207w, /images/nani/nani-figure-520.webp 414w";
const FIGURE_SIZES = "120px";

/**
 * Floating "How can I help?" button, bottom-right on every page (swapped with the 3D Map button, which
 * is bottom-left). Side offsets use max(gap, safe-area inset) so they stay clear of a notch if the page
 * ever opts into viewport-fit=cover.
 *
 * Nani is her round face; hovering over her with a mouse shows the big half-body figure
 * and her speech bubble. Touch screens have no hover (Tailwind's hover: variant only
 * applies on devices that can hover), so phones always show the round face.
 */
export default function Chatbot(props: ChatbotProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Also warm the cache with the small avatars the panel shows (the file its srcset picks
    // for this screen), so opening and using the chat makes no network requests; and, on
    // devices that can hover, with the big figure, so it appears at once on the first hover.
    const preload = () => {
      void loadPanel();
      const scale = window.devicePixelRatio > 1 ? 2 : 1;
      for (const size of [28, 40]) new Image().src = `/images/nani/nani-${size * scale}.webp`;
      if (window.matchMedia("(hover: hover)").matches) {
        const figure = new Image();
        figure.sizes = FIGURE_SIZES;
        figure.srcset = FIGURE_SRCSET;
      }
    };
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(preload, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const openFromNavigation = () => setOpen(true);
    window.addEventListener("nani:open", openFromNavigation);
    return () => window.removeEventListener("nani:open", openFromNavigation);
  }, []);

  function close() {
    setOpen(false);
    buttonRef.current?.focus(); // give focus back to the button that opened the chat
  }

  return (
    <>
      {/* The button's accessible name is the sr-only bubble text, which names Nani, so the
          pictures are alt="" (they would only repeat the name). */}
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? close() : setOpen(true))}
        className="nani-chat-button group fixed right-[max(1rem,env(safe-area-inset-right))] bottom-4 z-30 block text-left md:right-[max(1.5rem,env(safe-area-inset-right))] md:bottom-6"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <span className="nani-launch relative z-10" aria-hidden="true">
          {/* The Ward's namaste portrait and number make this a project-specific Nani badge. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- local responsive portrait for static export */}
          <img
            src="/images/nani/nani-namaste-320.webp"
            srcSet="/images/nani/nani-namaste-320.webp 320w, /images/nani/nani-namaste-480.webp 480w"
            sizes="64px"
            width={320}
            height={480}
            alt=""
            decoding="async"
            className="nani-launch__portrait"
          />
          <span className="nani-launch__ward-mark">16</span>
        </span>
        <span className="nani-hover-preview" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- local responsive figure for static export */}
          <img
            src="/images/nani/nani-figure-260.webp"
            srcSet={FIGURE_SRCSET}
            sizes={FIGURE_SIZES}
            width={414}
            height={520}
            alt=""
            loading="lazy"
            decoding="async"
            className="nani-figure-animated nani-hover-preview__image"
          />
          <span className="nani-hover-preview__message">{props.labels.hoverPrompt}</span>
        </span>
        <span className="sr-only">{props.labels.bubble}</span>
      </button>

      {open && (
        <Suspense fallback={null}>
          <ChatPanel {...props} onClose={close} />
        </Suspense>
      )}
    </>
  );
}
