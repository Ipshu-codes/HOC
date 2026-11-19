"use client";

interface AssistantCalloutProps {
  eyebrow: string;
  title: string;
  text: string;
  action: string;
}

export default function AssistantCallout({ eyebrow, title, text, action }: AssistantCalloutProps) {
  return (
    <section className="assistant-callout" aria-labelledby="assistant-callout-title">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="assistant-callout-title">{title}</h2>
        <p className="justified">{text}</p>
      </div>
      <button
        type="button"
        className="button button--light"
        onClick={() => window.dispatchEvent(new Event("nani:open"))}
      >
        {action}<span aria-hidden="true"> ↗</span>
      </button>
    </section>
  );
}
