# GLOBAL FINANCIAL TERMINAL — Product Specification (v1 target)

> The operating system for understanding the world's economy: Bloomberg Terminal ×
> TradingView × Reuters × Perplexity × X, as one real-time web command center.

## Design system
- Dark by default. Palette: black `#0A0A0A`, dark navy panels, white text,
  **green gains / red losses**, gold highlights, blue accents.
- Apple-level minimalism, Stripe-grade polish, glassmorphism where it earns it.
- Live tickers, smooth number transitions, skeleton loaders, hover micro-interactions.

## Surfaces
1. **World (landing)** — interactive 3D Earth (rotate/zoom/click), live country
   indicators, heat overlays (GDP growth, inflation, rates, market perf, risk, sentiment),
   hover intel cards.
2. **Country dashboard** — overview, economy, markets, top companies, news, AI summary,
   sentiment + risk score.
3. **Markets** — indices, stocks, FX, crypto, commodities; gainers/losers/most-active.
4. **Stock page** — live quote, chart, profile, metrics, balanced AI analysis
   (bull case / bear case / catalysts / risks — never a bare "buy/sell").
5. **News** — global feed with per-article AI analysis (sentiment, impact, affected
   industries/countries, confidence).
6. **Universal search (⌘K)** — stocks, countries, pages; natural queries.
7. **Watchlist & alerts** — persisted locally; cloud sync when accounts return.
8. Roadmap: portfolio analytics, screeners, economic calendar+dashboard, heat maps,
   events timeline, community, research hub, compare tool, sector pages, supply-chain
   map, AI copilot, learning center, admin panel.

## Data honesty
Every panel declares its source: `LIVE` (real feed) · `CACHED` · `SIM` (deterministic
synthetic movement seeded from a vetted snapshot). No fake "live".

## Access
**Fully public — zero authentication to view anything.** Accounts only ever gate
user-owned state (watchlists, portfolios), never content.

## Engineering ground rules (lessons already paid for)
- All globe assets ship same-origin (`public/`): no CDN fetch at runtime.
- Natural Earth geojson only; enforce engine winding convention (outer CW) —
  a reversed ring renders as its spherical complement (the historic "green globe").
- Never `WEBGL_lose_context.loseContext()` in React cleanup (StrictMode kills the globe).
- No CSS width/height transitions on layout panels (perpetual-restart freeze);
  drive panel geometry with inline styles.
- Single market-data provider; UI reads only through hooks.
- Build stays `vite build` → `dist` (drop-in for existing Netlify/GH-Actions pipeline).
