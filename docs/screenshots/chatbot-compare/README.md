# Chatbot comparison: preview branches

Two preview branches restore earlier chatbot interactions on top of current `main`. Everything added since is kept: Nani's look, greeting and avatars, the Mhepi questions and answers, the "Sorry, I can't help with that…" fallback with the ward phone and email, the honest "not known yet" answers, both languages, and no network requests while chatting. Only the way visitors reach an answer differs. **Not for merging as they are.**

| Branch | Interaction | Screenshots |
|---|---|---|
| `preview/chatbot-tap` | The first tap-only style (`f85bcc1`). One topic per site, "Getting there" and "Contact the ward office", then questions, then the answer with related questions. No quick-question chips; "My question isn't here" ends every list. | `tap-*` |
| `preview/chatbot-typed` | The original Phase 8 style (`bbaf1da`). Visitors type in English or Nepali; Fuse.js finds the closest prepared question. Suggested-question chips at the start and after each answer; no match → the fallback reply. | `typed-*` |
| `main` (for reference) | "Visiting {site}" / "About {site}" topics, quick questions, answers ordered by priority. | `../phase-9/chat-*` |

The files cover English and Nepali at 375 and 1440 px. Each pair has the opening view (`-start`) and one answered question, "How old is Nanak Math?" (`-answer`).

Each branch holds its own screenshots; this README is the same on both.
