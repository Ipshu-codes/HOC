"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

import type { ChatPanelProps } from "@/components/ChatPanel";
import type { Dictionary } from "@/lib/i18n";

// The chat window is a separate chunk: it is not needed to show the page,
// so it is fetched while the browser is idle and is already loaded when someone opens it.
const loadPanel = () => import("@/components/ChatPanel");
const ChatPanel = lazy(loadPanel);

type ChatbotProps = Omit<ChatPanelProps, "onClose"> & { labels: Dictionary["chat"] };

/** Floating "How can I help?" button, bottom-left on every page as in the sketch. */
export default function Chatbot(props: ChatbotProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(() => void loadPanel());
      return () => window.cancelIdleCallback(id);
    }
    const timer = setTimeout(() => void loadPanel(), 2000);
    return () => clearTimeout(timer);
  }, []);

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
        // Nani stands on the bottom edge of the screen: 130 px tall on phones, 260 px from 768 px.
        className="group fixed bottom-0 left-2 z-30 block text-left md:left-4"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
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
        {/* Phones: the bubble sits above Nani, so it never runs into the 3D Map button.
            Wider screens: beside her face. Hidden while the chat is open, so it never covers the panel. */}
        <span
          className={`absolute bottom-full left-0 mb-1 w-52 rounded-2xl rounded-bl-sm bg-crimson px-3 py-2 text-sm leading-snug font-bold text-white shadow-lg ring-2 ring-white group-hover:bg-brick md:bottom-auto md:left-full md:top-8 md:mb-0 md:ml-1 md:w-60 md:rounded-bl-2xl md:rounded-tl-sm md:text-base ${
            open ? "hidden" : ""
          }`}
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
