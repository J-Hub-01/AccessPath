# AccessPath

**A role-based stadium operations platform for FIFA World Cup 2026 — built with Google AI Studio + Gemini 2.5 Flash.**

<!-- TODO (you): replace this line with a hero screenshot once deployed.
     ![AccessPath screenshot](docs/hero-screenshot.png) -->

[**Live demo**](#) &middot; [**Demo video**](#) *(add links once deployed — see DEPLOY.md)*

---

## The problem statement (PromptWars Challenge 4)

> Build a GenAI-enabled solution that enhances stadium operations and the
> overall tournament experience for fans, organizers, volunteers, or venue
> staff during the FIFA World Cup 2026. The solution must leverage
> Generative AI to improve navigation, crowd management, accessibility,
> transportation, sustainability, multilingual assistance, operational
> intelligence, or real-time decision support during the FIFA World Cup 2026.

## Why AccessPath v2

v1 was a single-purpose Gemini Q&A tool — useful, but it read as "a
chatbot," not something that visibly enhances *operations*. v2 keeps
everything v1 did (unchanged, tested, working) and wraps it in a
role-based platform with a live, shared backend, so the same app now
serves **fans, staff, and security** with a real fan → staff feedback
loop, not just a fan → AI one:

- **Fan**: the original AccessPath Concierge (accessibility + wayfinding
  Q&A), plus **Lost & Found** wayfinding, **Order from your seat**, and
  **Request help / report a disturbance** — all from one seat, no app
  switching.
- **Staff**: a live order queue, updating the instant a fan orders.
- **Security**: a live help/incident queue, triaged and sorted by urgency
  the instant a fan requests help.

## Built for these people

| Persona | Role | Need | How AccessPath helps |
| --- | --- | --- | --- |
| **Priya** | Fan (wheelchair user), MetLife Stadium | Step-free route to her seat | Concierge tab: stepped, ramp/elevator-aware route with accessibility notes |
| **Diego** | Fan (Spanish speaker), Mexico City Fan Festival | Find his way back after getting separated | Lost & Found tab, in Español — same engine, a "lost" intent |
| **Amara** | Fan (visually impaired), BC Place | Order water without leaving her seat; report a disturbance nearby | Order tab (voice-friendly, one form); Help tab (one-tap, alerts security with her section) |
| *(any)* | Staff | See incoming concession orders as they happen | Live order queue, mark fulfilled in one tap |
| *(any)* | Security | Triage incoming help requests by urgency, not arrival order | Live help queue, Gemini-assigned urgency badges, acknowledge/resolve |

## Problem → feature → code

| Sub-problem from the brief | AccessPath feature | Where in the code |
| --- | --- | --- |
| Accessibility | Route + accessibility-notes in every Concierge/Lost & Found answer | `src/lib/prompts.ts` (`buildSystemPrompt`, `buildLostPersonSystemPrompt`), `src/components/ResponsePanel.tsx` |
| Multilingual assistance | EN/ES/FR UI + Gemini responses + on-demand translation, across every v1 and v2 screen | `src/lib/i18n.ts`, `src/components/LanguageSelector.tsx`, `translateSummary()` in `src/lib/gemini.ts` |
| Navigation | Step-by-step route generation grounded in real 2026 venues; lost-person wayfinding back to a known point | `src/lib/prompts.ts` (`HOST_CITIES_2026`, `buildLostPersonSystemPrompt`) |
| Operational intelligence | Gemini triages help requests by urgency and writes a staff-facing one-line summary; suggests order upsells | `src/lib/prompts.ts` (`buildTriagePrompt`, `buildUpsellPrompt`), `src/components/HelpQueue.tsx` |
| Real-time decision support | Live, shared order + help queues (Firestore or same-browser demo fallback); streaming Concierge responses with timeout + retry + graceful fallback | `src/lib/store.ts`, `src/lib/storeFirestoreBackend.ts`, `src/lib/storeLocalBackend.ts`, `src/lib/gemini.ts`, `src/components/FallbackCard.tsx` |
| Crowd management | Fan-reported disturbances routed live to the nearest security queue, with seat/section location attached | `src/components/HelpRequestPanel.tsx`, `src/components/HelpQueue.tsx` |

## Try it

Pick a role — **Fan**, **Staff**, or **Security** — and a section/zone, then:

- As a **Fan**: ask an accessibility question, try Lost & Found, place a
  concession order, or send a help request. Everything you submit appears
  live on the matching Staff/Security queue.
- As **Staff**: watch orders arrive in real time and mark them fulfilled.
- As **Security**: watch help requests arrive, already sorted by urgency,
  and acknowledge/resolve them.

Open a second browser tab as a different role to see the live link for
yourself without needing two devices.

## Tech stack

- **Gemini 2.5 Flash** via `@google/genai`, called server-side only from a
  serverless function (`api/gemini.ts`) — the API key never reaches the
  browser (see [`SECURITY.md`](./SECURITY.md)). Five prompt modes: `ask`,
  `lost`, `translate`, `triage`, `upsell` — every prompt string lives in
  exactly one place, `src/lib/prompts.ts`.
- **Firestore** (`firebase` client SDK) for the shared, real-time Order and
  Help Request queues — with an automatic same-browser localStorage
  fallback (`src/lib/storeLocalBackend.ts`) so the app is still fully
  demoable with zero external setup. See "Known limitations" below.
- **React 19 + TypeScript** (strict mode), **Vite**, **Tailwind CSS**.
- **Zod** for runtime validation of every Gemini response, including the
  new triage and upsell shapes.
- **Vitest + Testing Library + vitest-axe** — 61 tests, including an
  automated accessibility audit with zero violations.
- Browser **Web Speech API** for voice input and text-to-speech playback —
  no extra API cost, works independently of Gemini entirely.

## Known limitations

Documented deliberately rather than discovered by a judge:

- **No real authentication.** Role/section is a self-reported, unauthenticated
  session (`src/lib/session.ts`) — appropriate for a same-day hackathon demo,
  not for a production deployment handling real fan data.
- **Demo-mode fallback is same-browser only.** When no Firebase project is
  configured, the live Fan ↔ Staff/Security link only syncs across tabs in
  *one* browser, not across real devices. The UI labels this explicitly
  (a "demo mode" badge on the Staff/Security queues) so it's never mistaken
  for the real, cross-device deploy. Configure Firebase (see `DEPLOY.md`)
  to remove this limitation.
- **Firestore rules are demo-scale, not production-scale.** They stop
  malformed writes and post-creation tampering, but do not provide real
  per-fan access control — that requires Firebase Auth, which was out of
  scope for this build window. See the comments in `firestore.rules`.

## Accessibility statement

AccessPath was built accessibility-first, not accessibility-retrofitted:
WCAG AA color contrast, full keyboard navigation, a skip-to-content link,
`aria-live` regions for streaming responses, an accessible tablist for the
Fan dashboard, and screen-reader-tested labels on every control. See the
17-item checklist in [`accesspath_build_prompt.md`](./accesspath_build_prompt.md)
section 3 for the full list this app was built against, and
`src/components/__tests__/accessibility.test.tsx` for the automated axe
audit that enforces it.

## Running locally

```bash
git clone <your-repo-url>
cd accesspath
npm install
cp .env.example .env
# edit .env and add your own Gemini API key from https://aistudio.google.com/apikey
# (optional) add your Firebase web app config for cross-device live sync — see DEPLOY.md
npm run dev
```

Open http://localhost:5173.

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the local dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | ESLint, including `jsx-a11y` rules, zero warnings allowed |
| `npm run typecheck` | TypeScript strict-mode check only |
| `npm test` | Run the full Vitest suite once |
| `npm run test:watch` | Run tests in watch mode |

## License

MIT — see [`LICENSE`](./LICENSE).

## Built with

Google AI Studio + Gemini 2.5 Flash, for the Hack2Skill PromptWars Virtual
Challenge 4 (Smart Stadiums & Tournament Operations), FIFA World Cup 2026.
