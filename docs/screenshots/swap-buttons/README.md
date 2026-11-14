# Swap floating buttons: before and after

Nani and the chatbot moved from bottom-left to **bottom-right**; the 3D Map button moved from bottom-right to **bottom-left**. Captured on 14 Nov 2026 in Microsoft Edge from `npm run build` (both sites published). `before-*` is `main` at `aff548a`; `after-*` is branch `feat/swap-floating-buttons`.

| File (before-… / after-…) | What it shows |
|---|---|
| `en-320-open`, `en-375-open`, `en-768-open`, `en-1024-open`, `en-1440-open` | The chat open at each width, with the page scrolled to the footer |
| `en-375-top`, `en-1440-top` | Top of the home page, chat closed |
| `en-768-hover`, `en-1440-hover`, `ne-768-hover` | Mouse over Nani: the big figure and her speech bubble (touch screens never show them) |
| `en-320-footer`, `en-1440-footer` | Bottom of the page with the footer in view |
| `ne-375-open`, `ne-1440-open` | The chat open in Nepali |
| `map-1440` | The map page: the map's attribution line (bottom-right of the map) stays readable |

## Checks (same script for before and after)

At 320, 375, 768, 1024 and 1440 px, in English and Nepali:
- Nani and the 3D Map button never overlap, and both stay on screen.
- The open chat panel stays on screen and clear of both buttons.
- While hovered (mouse widths only), the big figure and bubble stay on screen and clear of the 3D Map button.
- On the map page (375, 1024, 1440 px), Nani never covers the map attribution.

Results: 65 of 65 checks passed before the swap and 65 of 65 after, with no page errors.
