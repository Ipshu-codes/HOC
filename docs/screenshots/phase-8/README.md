# Phase 8 — chatbot screenshots (tap-only version)

Captured on 13 Nov 2026 in Microsoft Edge from `npm run build:preview`. The Mhepi Ajima draft is excluded, so its topic and answers are not shown.

| File | What it shows |
|---|---|
| `chat-en-375.jpg`, `chat-ne-375.jpg` | Phone: a question tapped in the Nanak Math topic, with the answer, "Read more →", 3 related questions, "← Back", "Topics" and "My question isn't here" |
| `chat-not-here-en-375.jpg`, `chat-not-here-ne-375.jpg`, `chat-not-here-en-1440.jpg`, `chat-not-here-ne-1440.jpg` | The "My question isn't here" reply: the explanation, tappable phone and email links (Devanagari digits on Nepali pages) and a single "← Back to topics" button |
| `chat-en-1440.jpg`, `chat-ne-1440.jpg` | Desktop: the transcript after browsing several topics |

How it works: there is no typing. The flow is topic list → question list → answer.

- **Topics:** one per non-draft site, plus "Getting there" and "Contact the ward office". Nanak Math is labelled "Nanak Math (Siddheshwar Mahadev)" / "नानक मठ (सिद्धेश्वर महादेव)".
- **Transcript:** the tapped topic or question appears as the visitor's bubble and the answer as the guide's, so it still reads like a chat. "Start over" in the header clears it.
- **"My question isn't here"** is the last option of every list. The bot explains what it covers and links the ward office phone and email; the only option after that is "← Back to topics".

Checked in the browser, in both languages at both widths:

- **Buttons and keyboard:** every option is a real `<button>`, and the whole flow works with Tab and Enter. After each step, focus moves to the first new option, with a visible focus ring.
- **Escape:** it closes the chat and returns focus to the "How can I help?" button.
- **Offline:** there are **0 network requests while chatting**. Answer links don't prefetch.
- **No text input:** the panel has no text field, and Fuse.js has been uninstalled.
