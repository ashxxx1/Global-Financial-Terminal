# Global Financial Terminal

**🌐 Live site: [global-financial-news.vercel.app](https://global-financial-news.vercel.app)**

A real-time command center for the world's economy — interactive 3D Earth, live
markets, country intelligence dashboards, and balanced AI-style analysis across
60+ countries and ~600 listed equities. Fully public: no login to view anything.

Built with React + TypeScript + Vite · three.js globe · zustand · zero-backend
deterministic data engine (every panel honestly badged `SIM` until live feeds
are keyed in). Full product spec: [SPEC.md](SPEC.md).

## Run locally

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

## Architecture

- **Frontend** (`src/`) — React + Vite SPA. Reads all market data through one
  provider (`src/lib/market.ts`) via hooks; live feeds arrive on an event bus
  (`src/lib/feeds/`). Fully public, no auth.
- **Backend** (`server/`) — optional Node ingest service that continuously pulls
  multiple trusted sources server-side (USGS quakes, ECB FX, Binance crypto,
  GNews), enriches to one `Envelope` contract, keeps searchable history, and
  streams to the frontend over **Server-Sent Events**. Keys live server-side.
  See `SPEC-PIPELINE.md` for the full automation status matrix.

When `VITE_API_URL` is set, the frontend consumes the backend stream; otherwise
it runs equivalent feeds in the browser. Either way the UI is live, no refreshes.

## Deploy

- **Frontend → Vercel:** repo imported at vercel.com; every push to `main`
  auto-deploys. `vercel.json` handles SPA rewrites + caching.
- **Backend → Render (free):** New → Blueprint → this repo (`render.yaml`).
  Then set `VITE_API_URL` in Vercel to the resulting `onrender.com` URL, and
  optionally `GNEWS_API_KEY` on the Render service to enable the live news wire.

```bash
# run the backend locally
cd server && npm install && npm start   # :8787  (GET /health, /api/stream, …)
```

## History

The pre-rebuild application (v0.6, React/Firebase/Netlify era) is archived at
git tag [`legacy-v0.6`](../../releases/tag/legacy-v0.6).

## Accounts

Visitors land on a sign-in screen and need an account to reach the terminal.
Sign-in options: **Google**, **GitHub**, and email + password (with reset).

Accounts are Firebase Auth; each user gets a `users/{uid}` Firestore document
holding their profile and watchlist, so stars follow the account instead of
living in one browser's local storage.

**Setup** — in the [Firebase console](https://console.firebase.google.com):

1. Authentication → Sign-in method → enable **Google**, **GitHub**, and
   **Email/Password**
2. Firestore Database → create a database
3. Deploy the access rules so users can only read and write their own document:
   ```bash
   npx firebase deploy --only firestore:rules
   ```
4. Authentication → Settings → Authorized domains → add your production domain

Copy the web app config into `.env.local` (see `.env.example`).

If the `VITE_FIREBASE_*` keys are absent the gate is skipped and the app runs
open — so a fresh clone works with no setup. Set `VITE_REQUIRE_AUTH=false` to
keep it open even when Firebase *is* configured.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, project layout and the
PR checklist.
