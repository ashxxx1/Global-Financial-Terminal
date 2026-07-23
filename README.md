# Global Financial Terminal

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
