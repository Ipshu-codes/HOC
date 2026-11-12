"use client";

import { lazy, Suspense, useEffect, useRef, useState } from "react";

import type { ChatPanelProps } from "@/components/ChatPanel";
import type { Dictionary } from "@/lib/i18n";

// The chat window (and Fuse.js) is a separate chunk: it is not needed to show the page,
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
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => (open ? close() : setOpen(true))}
        // On phones the label may wrap to two lines (max-w-44) so it never runs into the 3D map button.
        className="fixed bottom-4 left-4 z-30 flex max-w-44 items-center gap-2 rounded-full bg-crimson py-2 pr-4 pl-2 text-left text-sm leading-tight font-bold text-white shadow-lg ring-2 ring-white hover:bg-brick sm:max-w-none sm:text-base md:bottom-6 md:left-6"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-crimson">
          <svg viewBox="0 0 24 24" className="size-5" fill="currentColor">
            <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
          </svg>
        </span>
        {props.labels.bubble}
      </button>

      {open && (
        <Suspense fallback={null}>
          <ChatPanel {...props} onClose={close} />
        </Suspense>
      )}
    </>
  );
}
