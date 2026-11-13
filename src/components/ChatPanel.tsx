"use client";

/**
 * The chat window. Visitors cannot type: they tap a topic, then a question, and
 * the prepared answer from content/faq.json appears in a chat-style transcript.
 * Everything is already in the page, so the chat works offline and makes no
 * network requests (its links do not prefetch).
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import NaniAvatar from "@/components/NaniAvatar";
import type { Dictionary } from "@/lib/i18n";
import type { ChatData, ChatEntry, ChatLink, ChatTopic } from "@/types/faq";

export interface ChatPanelProps {
  data: ChatData;
  labels: Dictionary["chat"];
  /** Ward office contact for the "My question isn't here" reply (phone shown in the page's digits). */
  contact: { phone: string; phoneHref: string; email: string };
  onClose: () => void;
}

interface Message {
  from: "user" | "bot";
  text: string;
  note?: string | null;
  links?: ChatLink[];
  /** Show the ward office phone and email links under the text. */
  contact?: boolean;
}

type View =
  | { kind: "topics" }
  | { kind: "topic"; topicId: string }
  | { kind: "answer"; entryId: string }
  | { kind: "not-here" };

const MAX_RELATED = 3;

/** Up to 3 other questions: same topic first, then the same site. */
function relatedTo(entry: ChatEntry, entries: ChatEntry[]): ChatEntry[] {
  const others = entries.filter((e) => e.id !== entry.id);
  const sameTopic = others.filter((e) => entry.topic !== null && e.topic === entry.topic);
  const sameSite = others.filter((e) => entry.site !== null && e.site === entry.site);
  return [...new Map([...sameTopic, ...sameSite].map((e) => [e.id, e])).values()].slice(0, MAX_RELATED);
}

export default function ChatPanel({ data, labels, contact, onClose }: ChatPanelProps) {
  const greeting: Message = { from: "bot", text: labels.greeting };
  const [messages, setMessages] = useState<Message[]>([greeting]);
  const [view, setView] = useState<View>({ kind: "topics" });
  /** The topic the visitor last browsed, for "← Back" from an answer. */
  const [lastTopic, setLastTopic] = useState<ChatTopic | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // After every step, move focus to the first new option (the button that was pressed has
  // been replaced) and keep the newest message in view. Block bodies on purpose: effects may
  // only return a cleanup function, and some browsers return a Promise from scrollIntoView.
  useEffect(() => {
    optionsRef.current?.querySelector("button")?.focus();
  }, [view]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  // Escape closes the chat wherever focus is.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const say = (...added: Message[]) => setMessages((current) => [...current, ...added]);

  function chooseTopic(topic: ChatTopic) {
    say({ from: "user", text: topic.label }, { from: "bot", text: labels.topicPrompt.replace("{topic}", topic.label) });
    setLastTopic(topic);
    setView({ kind: "topic", topicId: topic.id });
  }

  function chooseQuestion(entry: ChatEntry) {
    say({ from: "user", text: entry.question }, { from: "bot", text: entry.answer, note: entry.note, links: entry.links });
    const topic = data.topics.find((t) => t.id === entry.topic);
    if (topic) setLastTopic(topic);
    setView({ kind: "answer", entryId: entry.id });
  }

  function showTopics() {
    say({ from: "bot", text: labels.topicsPrompt });
    setView({ kind: "topics" });
  }

  function notHere() {
    say({ from: "user", text: labels.didntFind }, { from: "bot", text: labels.didntFindAnswer, contact: true });
    setView({ kind: "not-here" });
  }

  function startOver() {
    setMessages([greeting]);
    setLastTopic(null);
    setView({ kind: "topics" });
    // The view may already be "topics", so focus the first topic explicitly.
    requestAnimationFrame(() => optionsRef.current?.querySelector("button")?.focus());
  }

  // The options for the current step.
  let options: { key: string; label: string; onClick: () => void; style?: "nav" }[] = [];
  /** Quick questions, shown as chips above the topics until the visitor's first step. */
  let quick: ChatEntry[] = [];
  if (view.kind === "topics") {
    if (messages.length === 1) {
      quick = data.suggestions.flatMap((id) => data.entries.filter((entry) => entry.id === id));
    }
    options = data.topics.map((topic) => ({ key: topic.id, label: topic.label, onClick: () => chooseTopic(topic) }));
  } else if (view.kind === "topic") {
    options = [
      ...data.entries
        .filter((entry) => entry.topic === view.topicId)
        .map((entry) => ({ key: entry.id, label: entry.question, onClick: () => chooseQuestion(entry) })),
      { key: "topics", label: labels.topics, onClick: showTopics, style: "nav" },
    ];
  } else if (view.kind === "not-here") {
    // After the "My question isn't here" reply the only way on is back to the topics.
    options = [{ key: "back-to-topics", label: labels.backToTopics, onClick: showTopics, style: "nav" }];
  } else {
    const entry = data.entries.find((e) => e.id === view.entryId);
    const backTopic = lastTopic;
    options = [
      ...(entry ? relatedTo(entry, data.entries) : []).map((related) => ({
        key: related.id,
        label: related.question,
        onClick: () => chooseQuestion(related),
      })),
      ...(backTopic
        ? [{ key: "back", label: labels.back, onClick: () => setView({ kind: "topic", topicId: backTopic.id }), style: "nav" as const }]
        : []),
      { key: "topics", label: labels.topics, onClick: showTopics, style: "nav" },
    ];
  }
  // "My question isn't here" closes every list (except its own reply, which only offers the way back).
  if (view.kind !== "not-here") {
    options.push({ key: "not-here", label: labels.didntFind, onClick: notHere, style: "nav" });
  }

  const optionClass = (style?: "nav") =>
    style === "nav"
      ? "rounded-full bg-sand px-3 py-1.5 text-left text-sm font-bold text-brick ring-1 ring-gold/60 hover:bg-white"
      : "rounded-xl bg-white px-3 py-2 text-left text-sm text-ink ring-1 ring-gold/60 hover:bg-sand";

  return (
    <section
      role="dialog"
      aria-label={labels.dialogLabel}
      // Just above Nani's round face (bottom-left).
      className="fixed bottom-24 left-4 z-40 flex max-h-[min(38rem,calc(100dvh-8rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl bg-cream shadow-2xl ring-1 ring-gold/60 md:bottom-28 md:left-6"
    >
      <header className="flex items-center gap-2 bg-crimson px-4 py-2.5 text-white">
        <NaniAvatar size={40} alt={labels.naniAlt} className="size-10 ring-2 ring-white" />
        <h2 className="flex-1 font-sans text-lg font-bold text-white">{labels.title}</h2>
        <button
          type="button"
          onClick={startOver}
          className="rounded-md px-2 py-1 text-sm font-bold text-white ring-1 ring-white/60 hover:bg-brick focus-visible:outline-white"
        >
          {labels.startOver}
        </button>
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

      {/* aria-live: screen readers announce each new message. */}
      <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.map((message, index) => (
          <div key={index} className={message.from === "user" ? "flex justify-end" : "flex items-end justify-start gap-2"}>
            {/* Small static Nani beside her messages. alt="": the sr-only "Nani:" prefix below already names her. */}
            {message.from === "bot" && <NaniAvatar size={28} alt="" className="size-7" />}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 whitespace-pre-line ${
                message.from === "user" ? "bg-brick text-white" : "bg-white text-ink shadow-sm ring-1 ring-gold/40"
              }`}
            >
              <span className="sr-only">{message.from === "user" ? labels.you : labels.bot}: </span>
              {message.text}
              {message.contact && (
                <span className="mt-2 block space-y-1 whitespace-normal">
                  <span className="block">
                    {labels.phoneLabel}:{" "}
                    <a href={contact.phoneHref} className="font-bold text-crimson underline underline-offset-4">
                      {contact.phone}
                    </a>
                  </span>
                  <span className="block">
                    {labels.emailLabel}:{" "}
                    <a href={`mailto:${contact.email}`} className="font-bold break-all text-crimson underline underline-offset-4">
                      {contact.email}
                    </a>
                  </span>
                </span>
              )}
              {message.note && <span className="mt-1 block text-sm text-ink/80 italic">{message.note}</span>}
              {message.links?.map((link) =>
                link.external ? (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block font-bold text-crimson underline underline-offset-4"
                  >
                    {link.label} <span className="sr-only">{labels.newTab}</span>
                  </a>
                ) : (
                  // prefetch off: the chat must make no network requests while it is used.
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch={false}
                    className="mt-1 block font-bold text-crimson underline underline-offset-4"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div ref={optionsRef} className="max-h-[45%] overflow-y-auto border-t border-gold/40 bg-cream px-4 py-3">
        {quick.length > 0 && (
          <>
            <p className="mb-2 text-sm font-bold text-brick">{labels.quickQuestions}</p>
            <ul className="mb-3 flex flex-wrap gap-2">
              {quick.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => chooseQuestion(entry)}
                    className="rounded-full bg-crimson px-3 py-1.5 text-left text-sm font-bold text-white hover:bg-brick"
                  >
                    {entry.question}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="sr-only">{labels.optionsLabel}</p>
        <ul className="flex flex-col items-start gap-2">
          {options.map((option) => (
            <li key={option.key}>
              <button type="button" onClick={option.onClick} className={optionClass(option.style)}>
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
