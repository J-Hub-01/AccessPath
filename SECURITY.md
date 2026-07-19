# Security

## Reporting a vulnerability

If you find a security issue in AccessPath, please open a private GitHub
Security Advisory on this repository, or email the maintainer directly rather
than opening a public issue. We'll acknowledge reports within a few days.

## Key handling

AccessPath's Gemini API key is never present in this repository:

- The key is read server-side only, from the `GEMINI_API_KEY` environment
  variable (see `.env.example`).
- No `VITE_`-prefixed environment variable holds the key, so it is never
  inlined into the client-side JavaScript bundle.
- The browser calls this app's own `/api/gemini` serverless function, never
  `generativelanguage.googleapis.com` directly.
- `.env` and `.env.local` are excluded via `.gitignore`.

You can verify no key has ever been committed by running, from a fresh clone:

```bash
git log -p | grep -E "AIza[0-9A-Za-z_-]{35}"
```

This should return no matches.

## Other protections

- All user-generated content (Gemini responses, user text input) is rendered
  as text nodes or via `react-markdown` with `disallowedElements` and
  `skipHtml` — never via `dangerouslySetInnerHTML` or raw `innerHTML`.
- The `/api/gemini` proxy restricts CORS to the production origin and
  `localhost` during development only.
- User input is capped client-side and server-side (2,000 characters for
  text, 4 MB for images) to prevent abuse of the underlying Gemini quota.

## v2 — Firebase / Firestore

AccessPath v2 adds a shared live data layer for the Order and Help Request
queues (see `lib/store.ts`). This uses **Firestore**, not the same key
model as Gemini, and it's worth being explicit about why that's safe:

- The `VITE_FIREBASE_*` values in `.env.example` are **not secrets**. A
  Firebase web app config identifies which project a client talks to; it
  is designed to be public and is visible in every Firebase web app's
  bundle. Do not confuse it with `GEMINI_API_KEY`, which must never be
  `VITE_`-prefixed.
- Actual access control is enforced by **Firestore Security Rules**
  (`firestore.rules`), which must be deployed to the project before going
  live. Without deployed rules, a fresh Firestore project defaults to
  either fully open or fully locked, depending on the mode chosen at
  project creation — check this explicitly; do not assume.
- The included `firestore.rules` allows public read/create (this is an
  unauthenticated hackathon demo — see `lib/session.ts`) but restricts
  writes to well-formed documents and makes every field immutable after
  creation except `status`, so a client cannot rewrite another fan's order
  history or forge a resolved incident.
- If no Firebase project is configured, the app automatically falls back to
  a same-browser, localStorage-based demo mode (see `storeLocalBackend.ts`)
  rather than crashing or silently doing nothing — this fallback is
  visibly labeled in the UI (`demoModeBadge`) so it's never mistaken for a
  real multi-device deploy.
