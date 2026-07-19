# Deploying AccessPath

This app needs two things to go live: your own Gemini API key, and a host
that can run the `api/gemini.ts` serverless function (not just static files).

## 1. Get a Gemini API key

1. Go to https://aistudio.google.com/apikey
2. Create a key (free tier is enough for the demo — 1,500 requests/day).
3. **Do not** put it in any file that gets committed. It only ever goes into
   your deploy platform's environment variable settings, or your local
   `.env` (already gitignored).

## 2. v2: Set up Firebase (optional but recommended)

Powers the live, cross-device Order queue and Help Request queue. Skip
this step and AccessPath still works — it automatically falls back to a
same-browser demo mode (see `src/lib/storeLocalBackend.ts`) — but a real
Firebase project is what makes the Fan → Staff link actually cross
devices, which is worth the ~5 minutes on judging day.

1. Go to https://console.firebase.google.com → Add project (free Spark
   plan is enough).
2. In the new project, go to Build → Firestore Database → Create database
   (start in **production mode** — we supply our own rules next).
3. Go to Project settings → General → "Your apps" → add a Web app. Copy
   the six config values it shows you.
4. Paste them into `.env` as `VITE_FIREBASE_*` (see `.env.example`) and
   into your deploy platform's environment variables.
5. Deploy the included security rules so the demo isn't wide open to
   tampering (see SECURITY.md for what they actually restrict):
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore   # point it at this repo's firestore.rules
   firebase deploy --only firestore:rules
   ```

## 3. Primary deploy: Vercel

1. Push this repo to GitHub (public, per the submission requirement).
2. Go to https://vercel.com → New Project → import your GitHub repo.
3. Vercel auto-detects Vite. Before deploying, add environment variables:
   - `GEMINI_API_KEY` = your key from step 1
   - `PRODUCTION_ORIGIN` = your Vercel URL (you can add this *after* the
     first deploy once you know the URL, then redeploy)
   - The six `VITE_FIREBASE_*` values from step 2, if you set up Firebase
4. Deploy. `api/gemini.ts` will automatically become a serverless function
   at `/api/gemini` — no extra config needed, Vercel handles this via the
   `api/` folder convention.
5. Visit the deployed URL and test all three sample persona questions
   before considering it done.

## 4. Backup deploy: Google AI Studio

Per the build spec, submit a second, independent deployment as dead-link
insurance for judging day:

1. In Google AI Studio / Antigravity, use its "Build & Deploy" flow.
2. If AI Studio's deploy target doesn't support the `api/` serverless
   function convention, you'll need to port the logic in `api/gemini.ts`
   into whatever handler format it expects — the key handling, CORS, and
   streaming logic stay the same, only the export shape changes.
3. Add `GEMINI_API_KEY` (and the `VITE_FIREBASE_*` values, if used) as
   environment variables there too.

## 5. Before you submit

Run this checklist from a **fresh clone** (not your working directory —
clone into a new folder to catch anything `.gitignore` missed):

```bash
git clone <your-repo-url> accesspath-fresh-check
cd accesspath-fresh-check

# Confirm no secrets were ever committed
git log -p | grep -E "AIza[0-9A-Za-z_-]{35}"
# should print nothing

# Confirm repo size is under 10MB
du -sh --exclude=.git .

# Confirm it actually installs and runs from scratch
npm install
cp .env.example .env
# add your real key to .env
npm run dev
```

Then:
- [ ] Both live URLs (Vercel + AI Studio) load and respond correctly
- [ ] All 3 sample persona buttons produce a real Gemini answer
- [ ] Language switch (EN/ES/FR) changes both the UI and Gemini's response
- [ ] Voice input works (allow mic permission) and image upload works
- [ ] Kill your Gemini key temporarily (or disconnect wifi) and confirm the
      fallback card appears instead of a blank screen or crash
- [ ] Open the app as Fan in one tab/device and Staff in another; place an
      order and confirm it appears on the Staff queue live
- [ ] Open the app as Fan and Security in two tabs/devices; send a help
      request and confirm it appears on the Security queue with an urgency
      badge, live
- [ ] If using Firestore, confirm `firestore.rules` is actually deployed
      (not just committed) — `firebase deploy --only firestore:rules`
- [ ] If NOT using Firestore, confirm the demo-mode badge is visible on the
      Staff/Security queues, so nobody mistakes it for a real deploy
- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` all
      pass with zero errors
- [ ] README hero screenshot and demo video links are filled in
- [ ] Repo is public
