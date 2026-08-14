# Global Data Pipeline — automation architecture

The platform is designed as a **live intelligence system**, not a manually-edited
site. This document maps the automation spec to what is live now, what needs a
free key, and what needs a hosted backend — honestly, so nothing is faked.

## Normalized envelope

Every live datum enters through `src/lib/feeds/bus.ts` as an `Envelope`:
`timestamp · received · source · confidence · countryTags · marketTags ·
industryTags · summary · impact`. Feeds **publish**, UI **subscribes** — no
polling the DOM, no refreshes. This is the client-side equivalent of the SSE
layer; a hosted backend re-points these buses at real SSE/WebSocket endpoints
with zero UI changes.

## Status matrix

| Capability | Status | Source | Notes |
|---|---|---|---|
| Crypto prices (BTC/ETH) | ✅ **LIVE** | Binance WebSocket | keyless, CORS-open, streaming |
| FX (EUR/GBP/JPY vs USD) | ✅ **LIVE** | ECB via frankfurter.dev | keyless, 60s poll, d/d change |
| Earthquake events | ✅ **LIVE** | USGS GeoJSON | keyless, 2-min poll, country-tagged, market-impact scored |
| Live-events globe overlay | ✅ **LIVE** | USGS bus | real epicenters + breaking cards |
| Country news wire | 🔑 **key-ready** | GNews | activates on `VITE_GNEWS_API_KEY`; dedupe + entity-link + enrich already coded (`fetchCountryNews`) |
| Equity/index prices | ⚙️ SIM | deterministic engine | honest `SIM` badge; drop-in live override via `setLiveQuote` |
| Knowledge graph | ✅ **LIVE (v1)** | entity dataset | `graph.ts` typed edges on Country/Stock pages |
| AI enrichment (summary/impact) | 🧩 heuristic now | keyword pipeline | LLM backend replaces `scoreSentiment`/`linkEntities` behind same interface |
| AIS ship tracking | 🚧 backend | aisstream.io / MarineTraffic | requires key + server relay (no browser CORS/quota) |
| Flight tracking | 🚧 backend | OpenSky / adsb.fi | OpenSky needs auth + server (browser CORS blocked) |
| Supply-chain graph | 🧩 data-model | — | node/edge schema in `graph.ts`; needs curated supplier dataset |
| Satellite/weather overlays | 🚧 tiles | NASA GIBS / OWM | tile layers; some keyless, some keyed |

Legend: ✅ live · 🔑 flip on with a free key · ⚙️ simulated-but-honest ·
🧩 modeled, needs data · 🚧 needs a hosted backend.

## Activating the live news wire (2 minutes, free)

1. Get a free key at gnews.io (100 req/day).
2. Vercel → Project → Settings → Environment Variables → add
   `VITE_GNEWS_API_KEY` → redeploy.
3. Country → NEWS tab flips from `SIM` to `LIVE`: real headlines, deduped,
   entity-linked to tickers/sectors, sentiment + impact + confidence scored,
   auto-refreshing every 3 minutes.

## What genuinely requires a backend (and why)

Ships (AIS), flights (ADS-B), heavy LLM enrichment, and the persistent
event/article history store cannot run purely in the browser — they need API
keys that must not ship to the client, server-side rate-limit pooling, and
cross-origin relays. The envelope/bus contract means adding a Node/SSE service
later is additive: feeds move server-side and stream in through the same
`subscribeBus` the UI already uses.
