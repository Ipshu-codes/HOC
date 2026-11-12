"use client";

/**
 * The chat window. Matching runs entirely in the browser with Fuse.js
 * (https://www.fusejs.io), a small fuzzy-search library: it scores how closely
 * the visitor's question matches each prepared question in content/faq.json,
 * tolerating typos and word order. There is no server and no AI API — every
 * answer is written in faq.json and checked at build time.
 */
import Fuse from "fuse.js";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import type { Dictionary } from "@/lib/i18n";
import type { ChatEntry } from "@/types/faq";
import type { Locale } from "@/types/locale";

export interface ChatPanelProps {
  lang: Locale;
  entries: ChatEntry[];
  labels: Dictionary["chat"];
  /** "Sorry, … phone …, email …" in both languages, already filled in. */
  fallback: Record<Locale, string>;
  readMore: Record<Locale, string>;
  onClose: () => void;
}

interface Message {
  from: "user" | "bot";
  text: string;
  lang: Locale;
  link?: string;
  readMore?: string;
}

/** 0 = exact match, 1 = anything. 0.4 accepts small typos and rephrasings, rejects unrelated text. */
const MATCH_THRESHOLD = 0.4;
const MAX_CHIPS = 3;

/** Any Devanagari character → the visitor is writing Nepali, so answer in Nepali. */
const isNepali = (text: string) => /[ऀ-ॿ]/.test(text);

export default function ChatPanel({ lang, entries, labels, fallback, readMore, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([{ from: "bot", text: labels.greeting, lang }]);
  const [asked, setAsked] = useState<string[]>([]);
  const [lastSite, setLastSite] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // One search index per language: each prepared question is a separate item pointing at its entry.
  const indexes = useMemo(() => {
    const build = (l: Locale) =>
      new Fuse(
        entries.flatMap((entry) => entry.q[l].map((question) => ({ id: entry.id, question }))),
        { keys: ["question"], threshold: MATCH_THRESHOLD, ignoreLocation: true, includeScore: true },
      );
    return { en: build("en"), ne: build("ne") };
  }, [entries]);

  // Block bodies on purpose: an effect may only return a cleanup function, and newer browsers
  // return a Promise from scroll methods such as scrollIntoView (React would then crash).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Escape closes the chat wherever focus is (a clicked chip is replaced after answering,
  // so focus can leave the panel).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    const answerLang: Locale = isNepali(text) ? "ne" : "en";
    const best = indexes[answerLang].search(text, { limit: 1 })[0];
    const entry = best ? entries.find((e) => e.id === best.item.id) : undefined;

    const reply: Message = entry
      ? { from: "bot", text: entry.a[answerLang], lang: answerLang, link: entry.link?.[answerLang], readMore: readMore[answerLang] }
      : { from: "bot", text: fallback[answerLang], lang: answerLang };
    setMessages((current) => [...current, { from: "user", text, lang: answerLang }, reply]);
    if (entry) {
      setAsked((current) => [...current, entry.id]);
      setLastSite(entry.site);
    }
    setInput("");
    inputRef.current?.focus(); // ready for the next question, also after clicking a chip
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(input);
  }

  // Suggested chips: at the start the entries marked "suggest"; afterwards, unasked entries
  // about the same site first, then other suggestions.
  const chips = useMemo(() => {
    const unasked = entries.filter((entry) => !asked.includes(entry.id));
    const ranked =
      asked.length === 0
        ? unasked.filter((entry) => entry.suggest)
        : [
            ...unasked.filter((entry) => lastSite !== null && entry.site === lastSite),
            ...unasked.filter((entry) => entry.suggest),
            ...unasked,
          ];
    return [...new Map(ranked.map((entry) => [entry.id, entry])).values()].slice(0, asked.length === 0 ? 4 : MAX_CHIPS);
  }, [entries, asked, lastSite]);

  return (
    <section
      role="dialog"
      aria-label={labels.title}
      className="fixed bottom-24 left-4 z-40 flex max-h-[min(36rem,calc(100dvh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl bg-cream shadow-2xl ring-1 ring-gold/60 md:left-6"
    >
      <header className="flex items-center justify-between gap-2 bg-crimson px-4 py-3 text-white">
        <h2 className="font-sans text-lg font-bold text-white">{labels.title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label={labels.close}
          className="rounded-md p-1 hover:bg-brick focus-visible:outline-white"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </header>

      {/* aria-live: screen readers announce each new answer. */}
      <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((message, index) => (
          <div key={index} className={message.from === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              lang={message.lang}
              className={`max-w-[85%] rounded-xl px-3 py-2 ${
                message.from === "user" ? "bg-brick text-white" : "bg-white text-ink shadow-sm ring-1 ring-gold/40"
              }`}
            >
              <span className="sr-only">{message.from === "user" ? labels.you : labels.bot}: </span>
              {message.text}
              {message.link && (
                // prefetch off: chatting must not make network requests (the chat works offline).
                <Link
                  href={message.link}
                  prefetch={false}
                  className="mt-1 block font-bold text-crimson underline underline-offset-4"
                >
                  {message.readMore}
                </Link>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {chips.length > 0 && (
        <div className="border-t border-gold/40 px-4 py-2">
          <p className="sr-only">{labels.suggestions}</p>
          <ul className="flex flex-wrap gap-2">
            {chips.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => ask(entry.q[lang][0])}
                  className="rounded-full bg-white px-3 py-1 text-left text-sm text-brick ring-1 ring-gold/60 hover:bg-sand"
                >
                  {entry.q[lang][0]}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-gold/40 bg-white p-3">
        <label htmlFor="chat-input" className="sr-only">
          {labels.inputLabel}
        </label>
        <input
          id="chat-input"
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder={labels.placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-gold/60 bg-cream px-3 py-2 text-ink placeholder:text-ink/60"
        />
        <button type="submit" className="rounded-lg bg-crimson px-4 py-2 font-bold text-white hover:bg-brick">
          {labels.send}
        </button>
      </form>
    </section>
  );
}
