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
        className="group fixed bottom-4 left-4 z-30 flex items-end gap-2 text-left md:bottom-6 md:left-6"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <span className="rounded-full bg-white p-0.5 shadow-lg ring-2 ring-crimson group-hover:ring-brick">
          <NaniAvatar size={64} alt="" animated className="size-16" />
        </span>
        {/* Phones: the bubble sits above Nani, so it never runs into the 3D Map button.
            Wider screens: beside her. Hidden while the chat is open, so it never covers the panel. */}
        <span
          className={`absolute bottom-full left-0 mb-2 w-52 rounded-2xl rounded-bl-sm bg-crimson px-3 py-2 text-sm leading-snug font-bold text-white shadow-lg ring-2 ring-white group-hover:bg-brick sm:static sm:mb-3 sm:w-auto sm:max-w-64 sm:rounded-bl-2xl ${
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
