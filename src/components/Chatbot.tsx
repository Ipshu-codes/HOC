"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

import type { ChatPanelProps } from "@/components/ChatPanel";
import NaniAvatar from "@/components/NaniAvatar";
import type { Dictionary } from "@/lib/i18n";

// The chat window is a separate chunk: it is not needed to show the page,
// so it is fetched while the browser is idle and is already loaded when someone opens it.
const loadPanel = () => import("@/components/ChatPanel");
const ChatPanel = lazy(loadPanel);

type ChatbotProps = Omit<ChatPanelProps, "onClose"> & { labels: Dictionary["chat"] };

/** Half-body cut-out (scripts/optimize-images.ts): 130 px tall below 768 px, 260 px from 768 px. */
const FIGURE_SRCSET =
  "/images/nani/nani-figure-130.webp 104w, /images/nani/nani-figure-260.webp 207w, /images/nani/nani-figure-520.webp 414w";
const FIGURE_SIZES = "(min-width: 48rem) 207px, 104px";

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

  function close() {
    setOpen(false);
    buttonRef.current?.focus(); // give focus back to the button that opened the chat
  }

  // While the chat is open, hovering does not bring up the big figure or the bubble.
  const onHover = open ? "" : "group-hover:block";

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
        className="group fixed right-[max(1rem,env(safe-area-inset-right))] bottom-4 z-30 block text-left md:right-[max(1.5rem,env(safe-area-inset-right))] md:bottom-6"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* invisible (not hidden) on hover: the face keeps its box, so the pointer stays over the button. */}
        <NaniAvatar
          size={56}
          alt=""
          animated
          className={`size-14 shadow-lg ring-4 ring-crimson ${open ? "" : "group-hover:invisible"}`}
        />
        {/* The big figure stands on the bottom edge of the screen, over the face. display:none until
            hovered, so phones never download it. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- static export: no image server */}
        <img
          src="/images/nani/nani-figure-260.webp"
          srcSet={FIGURE_SRCSET}
          sizes={FIGURE_SIZES}
          width={207}
          height={260}
          alt=""
          loading="lazy"
          decoding="async"
          className={`nani-figure-animated absolute -right-2 -bottom-4 hidden h-[130px] w-auto max-w-none drop-shadow-lg md:-right-2 md:-bottom-6 md:h-[260px] ${onHover}`}
        />
        <span className="sr-only">{props.labels.bubble}</span>
        {/* The speech bubble, shown with the big figure: above her below 768 px, to the left of her face (into the page) from 768 px. */}
        <span
          aria-hidden="true"
          className={`absolute right-0 bottom-[7.5rem] hidden w-52 rounded-2xl rounded-br-sm bg-brick px-3 py-2 text-sm leading-snug font-bold text-white shadow-lg ring-2 ring-white md:right-[11.5rem] md:bottom-[8rem] md:w-60 md:text-base ${onHover}`}
        >
          {props.labels.bubble}
        </span>
      </button>

      {open && (
        <Suspense fallback={null}>
          <ChatPanel {...props} onClose={close} />
        </Suspense>
      )}
    </>
  );
}
