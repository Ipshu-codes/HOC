"use client";

import { useState, type FormEvent } from "react";

import type { Dictionary } from "@/lib/i18n";

interface ContactFormProps {
  /** Web3Forms access key (NEXT_PUBLIC_WEB3FORMS_KEY). Public by design; without it only the email link is shown. */
  accessKey: string | undefined;
  email: string;
  phone: string;
  labels: Dictionary["contactPage"];
}

type Status = "idle" | "sending" | "sent" | "error";

/**
 * Contact form that posts straight from the browser to Web3Forms (https://web3forms.com),
 * a free form-to-email service: no server of our own is needed for a static site.
 * The recipient address is set in the Web3Forms dashboard for this access key.
 */
export default function ContactForm({ accessKey, email, phone, labels }: ContactFormProps) {
  const [status, setStatus] = useState<Status>("idle");
  const mailto = `mailto:${email}?subject=${encodeURIComponent(labels.mailSubject)}`;
  const emailLink = (
    <a href={mailto} className="font-bold text-crimson underline underline-offset-4 hover:text-brick">
      {email}
    </a>
  );
  const withEmail = (text: string) => {
    const [before, after] = text.replace("{phone}", phone).split("{email}");
    return (
      <>
        {before}
        {emailLink}
        {after}
      </>
    );
  };

  if (!accessKey) {
    return <p className="rounded-xl bg-sand p-5 text-lg">{withEmail(labels.formUnavailable)}</p>;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("sending");
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const result = (await response.json()) as { success?: boolean };
      if (!response.ok || !result.success) throw new Error("Web3Forms rejected the message");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const fieldClass =
    "mt-1 block w-full rounded-lg border border-gold/70 bg-white px-3 py-2 text-ink focus-visible:outline-crimson";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <input type="hidden" name="access_key" value={accessKey} />
      <input type="hidden" name="subject" value={labels.mailSubject} />
      {/* Honeypot: hidden from people; bots that fill it in are rejected by Web3Forms. */}
      <input type="checkbox" name="botcheck" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div>
        <label htmlFor="contact-name" className="font-bold text-brick">
          {labels.name} <span className="text-sm font-normal text-ink/80">({labels.required})</span>
        </label>
        <input id="contact-name" name="name" required autoComplete="name" className={fieldClass} />
      </div>
      <div>
        <label htmlFor="contact-email" className="font-bold text-brick">
          {labels.email} <span className="text-sm font-normal text-ink/80">({labels.required})</span>
        </label>
        <input id="contact-email" name="email" type="email" required autoComplete="email" className={fieldClass} />
      </div>
      <div>
        <label htmlFor="contact-message" className="font-bold text-brick">
          {labels.message} <span className="text-sm font-normal text-ink/80">({labels.required})</span>
        </label>
        <textarea id="contact-message" name="message" required rows={6} className={fieldClass} />
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-xl bg-crimson px-6 py-3 font-bold text-white hover:bg-brick disabled:opacity-70"
      >
        {status === "sending" ? labels.sending : labels.send}
      </button>

      {/* role=status / role=alert: the result is announced by screen readers. */}
      {status === "sent" && (
        <p role="status" className="rounded-xl bg-sand p-4 font-bold text-brick">
          {labels.success}
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="rounded-xl border-2 border-crimson p-4 text-crimson">
          {labels.error}
        </p>
      )}

      <p className="text-ink/80">{withEmail(labels.emailInstead)}</p>
    </form>
  );
}
