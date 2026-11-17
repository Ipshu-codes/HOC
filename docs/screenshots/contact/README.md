# Contact page without a form

Captured on 17 Nov 2026 in Microsoft Edge from the strict `npm run build`, branch `feature/contact-email-only`. Files: `contact-<en|ne>-<375|768|1440>.jpg` (full page).

The Web3Forms contact form is gone. The page now shows:
- a short welcoming message inviting questions, stories, memories and heritage information;
- a **Write to us** card with an "Email the ward office" button and the address `ward16@kathmandu.gov.np`. Both are `mailto:` links with a subject ("Ward 16 heritage website" / "वडा १६ सम्पदा वेबसाइट");
- the **Ward Office** card, unchanged: address, View on 3D Map, phone, email.

The home page's contact button now reads "Contact the ward office".

**Checks:**
- In EN + NE at 375, 768 and 1440 px:
  - there's no form and no input;
  - the email links are `mailto:` with a subject;
  - the page makes no requests to other sites and doesn't scroll sideways.
- The alignment audit finds 0 issues on every page.
- The built site contains no Web3Forms code.
