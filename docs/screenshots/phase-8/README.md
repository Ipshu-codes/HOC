# Phase 8 — chatbot screenshots (tap-only version)

Captured on 13 Nov 2026 in Microsoft Edge from `npm run build:preview`. The Mhepi Ajima draft is excluded, so its topic and answers are not shown.

| File | What it shows |
|---|---|
| `chat-en-375.jpg`, `chat-ne-375.jpg` | Phone: a question tapped in the Nanak Math topic, with the answer, "Read more →", 3 related questions, "← Back", "Topics" and "My question isn't here" |
| `chat-not-here-en-375.jpg`, `chat-not-here-ne-375.jpg`, `chat-not-here-en-1440.jpg`, `chat-not-here-ne-1440.jpg` | The "My question isn't here" reply: the explanation, tappable phone and email links (Devanagari digits on Nepali pages) and a single "← Back to topics" button |
| `nani-big-en-375.jpg`, `nani-big-ne-375.jpg`, `nani-big-ne-768.jpg`, `nani-big-en-1440.jpg`, `nani-big-ne-1440.jpg` | Big Nani standing bottom-left: 130 px tall on phones (bubble above her), 260 px from 768 px (bubble beside her face). She doesn't overlap the 3D Map button at 320, 375, 768 or 1440 px. |
| `nani-big-chat-en-375.jpg`, `nani-big-chat-ne-375.jpg`, `nani-big-chat-en-1440.jpg`, `nani-big-chat-ne-1440.jpg` | The chat open: above Nani on phones, beside her on wider screens. Her face and name are in the header, with a small static avatar beside each of her messages. |
| `chat-en-1440.jpg`, `chat-ne-1440.jpg` | Desktop: the transcript after browsing several topics |

How it works: there is no typing. The flow is topic list → question list → answer.

- **Topics:** one per non-draft site, plus "Getting there" and "Contact the ward office". Nanak Math is labelled "Nanak Math (Siddheshwar Mahadev)" / "नानक मठ (सिद्धेश्वर महादेव)". *(Superseded in Phase 9: "Visiting {site}" / "About {site}" per site plus "Contact the ward office" and "About this website"; Siddheshwar Mahadev removed until it has a source. See `../phase-9/`.)*
- **Transcript:** the tapped topic or question appears as the visitor's bubble and the answer as the guide's, so it still reads like a chat. "Start over" in the header clears it.
- **"My question isn't here"** is the last option of every list. The bot explains what it covers and links the ward office phone and email; the only option after that is "← Back to topics".

Checked in the browser, in both languages at both widths:

- **Buttons and keyboard:** every option is a real `<button>`, and the whole flow works with Tab and Enter. After each step, focus moves to the first new option, with a visible focus ring.
- **Escape:** it closes the chat and returns focus to the "How can I help?" button.
- **Offline:** there are **0 network requests while chatting**. Answer links don't prefetch.
- **No text input:** the panel has no text field, and Fuse.js has been uninstalled.
