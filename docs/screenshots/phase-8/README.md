# Phase 8 — chatbot screenshots

Captured on 12 Nov 2026 in Microsoft Edge from `npm run build:preview` (Mhepi Ajima draft excluded, so its 5 FAQ entries are not included).

| File | What it shows |
|---|---|
| `chat-en-375.jpg` | The chat open on a phone after several English questions, with suggested-question chips |
| `chat-ne-375.jpg` | The Nepali page. Nepali questions get Nepali answers; an English question gets an English answer. The "म कसरी मद्दत गर्न सक्छु?" button wraps so it never overlaps the 3D Map button. |
| `chat-en-1440.jpg` | The chat on desktop after clicking a suggested question |

**Behaviour checked in the browser:**

- **Matching:** typos match ("nanak mat timimg" gets the opening hours), and Devanagari in a question gets a Nepali reply.
- **Fallback:** an unrelated question gets a fallback with the ward phone and email.
- **Chips:** 4 at the start and 3 after each answer.
- **Read more:** each answer has a "Read more →" link.
- **Offline:** there are **0 network requests while chatting**. The chat code is preloaded while the browser is idle, and the answer links do not prefetch.
- **Keyboard:** Escape closes the chat and focus returns to the button.
