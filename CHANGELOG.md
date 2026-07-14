# Changelog

All notable changes to this project will be documented in this file.
Format: [ISO date] | [SemVer] | [type] | description

---

## [0.0.2-dev] - 2026-07-14 (Meridian UI — Complete)

### Added
- **MERIDIAN UI Framework** — premium terminal layout from Claude Design handoff
  - HUD corner brackets (idle-fade, cyan) ✅
  - MERIDIAN wordmark + "GLOBAL INTELLIGENCE TERMINAL" subtitle ✅
  - UTC clock + animated LIVE indicator ✅
  - Breaking ticker with marquee animation (market data, macro, risk) ✅
  - Orbit lens selector (5 rotating lenses: MARKETS, FX, MACRO, RISK, NEWS) ✅
  - Global Wire widget (expandable headlines pill, bottom-right) ✅
  - Command palette dock (country/index search, bottom-center) ✅
  - Hover tooltip (country name + market change) ✅
  - Full glassmorphism styling (backdrop-filter blur, rgba, borders) ✅
  - Smooth animations (idle-fade, marquee, orbit, fade-up) ✅

- **MeridianPanel.jsx** — redesigned right panel with 4 tabs
  - Overview tab: index + FX + AI sentiment
  - News tab: market narrative + news cards with confidence scoring
  - Markets tab: sector performance + top gainers/losers
  - Economy tab: macro indicators (GDP, inflation, rate) + latest headlines
  - Real backend data integration (markets/economy APIs)
  - Glassmorphism styling matching MERIDIAN design
  - Slide-in animation on panel open
  - Close button and lens tab switching

- **Lens Selector Wiring** ✅
  - Clicking lenses triggers panel tab switching
  - Visual feedback (active lens highlighted in cyan)
  - 5 rotating lenses in orbit around globe center
  - Smooth animations on hover

- **Command Palette Integration** ✅
  - Search box for country selection
  - Opens country panel on result selection
  - Real-time search filtering
  - Keyboard shortcut indicator (⌘K)

- **Global Wire Real Headlines** ✅
  - Connected to intelApi.recent() for live news
  - Updates every 12 seconds from backend
  - Expandable pill widget (bottom-right)
  - Fallback sample headlines if backend unavailable

### Fixed
- z-index layering: globe visible under HUD chrome (z:1 < HUD:50)
- Full-screen overlay positioning for MeridianLayout
- Pointer events routing for interactive lens selector

---

## [0.0.1] - 2026-07-13

### Added
- **Intelligence Backend (server/)** — independent Node.js event-driven service
  - Real-time news collection via Google News RSS (free, no key; GNews API optional)
  - AI analysis pipeline: sentiment → sector → historical correlation → weighted predictions
  - Append-only knowledge database (server/data/*.json)
  - Server-Sent Events (SSE) live push to frontend
  - REST API: `/api/country/:code`, `/api/economy/:code`, `/api/markets/:code`, `/api/recent`, `/api/stats`, `/health`
  - Background poll worker (configurable interval, default 8s)
  - Self-learning accuracy tracking (Step 7 scaffold)
  - **Free data sources**: Google News RSS, World Bank macroeconomic data, Yahoo Finance indices
  - Deployment configs: `render.yaml` (Render), `Procfile` (Heroku), `Dockerfile` (any host)

- **Frontend ↔ Backend Integration**
  - `src/services/intelApi.js` — fail-soft client (VITE_INTEL_API env, localhost:8787 default)
  - SSE subscription in CountryIntel
  - Real Live Markets panel (S&P, Nifty, Nikkei, etc.)
  - Real Economy panel (GDP, growth, inflation, unemployment — World Bank)
  - Both panels hidden when backend absent (safe fallback on live site)

- **News Signals for All 68 Countries**
  - Sector-aware sample news generation derived from stock price movement
  - Consistent signal engine across all supported countries
  - Self-sufficient (no API key required to run)

- **Error Boundary Component**
  - Prevents white-screen crashes
  - User-friendly fallback UI with reload button
  - Graceful degradation of individual component failures

- **npm run server** — simplified backend startup
- **npm run start** — production backend start (via package.json)

### Fixed
- **ChartTerminal.jsx:1841** — ReferenceError crash on text-label Enter (undefined `setDrawingsList`)
- **AuthContext.jsx** — Playwright test-login hook now dev-only (stripped from production build)
- **GlobeVis.jsx** — attempted fixes to bump map / specular sheen (partial; needs visual verification)

### Changed
- `server/sources.js` — priority: GNews (if key) → Google News RSS (free) → sample fallback
- `CountryIntel.jsx` — added real markets/economy fetch from backend
- Package.json — added `start` script, engines constraint (Node >=18)
- `.gitignore` — server/data/*.json (runtime DB, excluded from git)

### Infrastructure
- `render.yaml` — one-click free Render deployment (blueprint)
- `server/README.md` — backend architecture, endpoints, free data sources, roadmap

---

## What's Implemented (Spec Coverage)

| Spec Step | Status | Notes |
|-----------|--------|-------|
| Step 1: Real-time collection | ✅ | Google News RSS + optional GNews API |
| Step 2: News processing | ✅ | Country, sectors, sentiment, importance, urgency detection |
| Step 3: AI analysis | ✅ | Heuristic (labeled `generated:"ai"`); LLM upgrade pending |
| Step 4: Correlation patterns | ✅ | Historical knock-on effects (oil→energy↑/airlines↓) |
| Step 5: Stock predictions | ✅ | Weighted multi-factor (prob up/down, confidence, reasoning) |
| Step 6: Knowledge DB | ✅ | Append-only, persistent, historical intelligence |
| Step 7: Self-learning | ⚠️ | Scaffold ready; outcome feedback loop not yet wired to price feed |
| Economy panel | ✅ | Real World Bank data |
| Markets panel | ✅ | Real Yahoo Finance indices |
| Real-time push (SSE) | ✅ | Live updates, no refresh needed |
| Facts vs forecasts | ✅ | Labeled `generated:"fact"` (verified) vs `generated:"ai"` (forecast) |
| Premium globe | ❌ | Pending UI/cinematic redesign |
| Glassmorphism panels | ❌ | Pending UI/animation pass |

---

## Known Limitations / Roadmap

- **Backend not always-on yet** — requires deployment to Render/Fly.io/Koyeb/Oracle (free tier options available)
  - After deploy: set VITE_INTEL_API env var in Netlify to enable live markets/economy/headlines
- **Command palette needs country data** — currently empty array; needs to pull from GlobeVis countries list
- **Self-learning feedback loop** — needs live price feed integration to score predictions vs actual moves
- **LLM analysis** — currently heuristic; needs Claude API key for deeper "why it matters" essays (server-side)
- **Globe rendering** — bumpScale/specular adjustments attempted; needs visual verification on live site
- **Mobile responsiveness** — tested on desktop; mobile layout dead-space noted but deferred
- **Lens selector data binding** — MARKETS/FX/MACRO/RISK/NEWS tabs should filter data by lens (currently always shows MARKETS)

---

## How to Contribute

**All commits must include a CHANGELOG entry** in this file before merging. See [CONTRIBUTING.md](CONTRIBUTING.md) for the process.

Format:
```
- [Component] — brief description
```

Keep entries terse, scannable, and focused on *what changed* (not internal details).
