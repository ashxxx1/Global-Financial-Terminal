# Intelligence Service

An independent, event-driven backend that continuously collects news, analyzes it,
predicts market impact, and pushes updates to the frontend live. Dependency-free
(built-in Node `http` + global `fetch`).

## Run

```bash
npm run server          # starts on http://localhost:8787
# optional env:
GNEWS_API_KEY=xxx POLL_MS=8000 PORT=8787 npm run server
```

Without `GNEWS_API_KEY` it runs in **SAMPLE mode** (generated events) so it works
immediately. With a key it fetches real GNews business headlines, rotating one
supported country per tick to respect the free-tier limit.

## Architecture (maps to the spec)

| File | Responsibility |
|------|----------------|
| `sources.js` | **Step 1** — real-time collection (GNews or sample stream) |
| `engine.js`  | **Steps 2–5** — classify → AI analysis → historical correlation → weighted prediction |
| `store.js`   | **Step 6/7** — append-only knowledge DB + self-learning accuracy stats |
| `index.js`   | background worker + SSE live push + REST API |

## Endpoints

- `GET /stream` — Server-Sent Events; pushes each new event live (no polling)
- `GET /api/country/:code` — stored intelligence for a country
- `GET /api/recent?limit=40` — most recent processed events
- `GET /api/stats` — prediction accuracy stats
- `GET /health` — worker ticks, event count, connected clients

## Notes / roadmap

- Every AI-derived field is labeled `generated: "ai"` and carries confidence +
  reasoning, so the frontend can clearly separate facts from forecasts.
- **Not yet always-on**: static hosting can't run this 24/7. Deploy to a real host
  (Render / Fly.io / a VPS / Firebase Blaze) for continuous operation.
- **Self-learning (Step 7)** needs the market-outcome feedback loop (compare
  predictions to actual price moves) — scaffolded in `store.recordOutcome`, not yet
  wired to a price feed.
- Replace `aiAnalyze()` in `engine.js` with a real LLM call (server-side, key kept
  secret) for richer analysis.
