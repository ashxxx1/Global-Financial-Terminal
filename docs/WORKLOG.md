# Work log

Dated record of what was added, removed and fixed. Dates are commit dates from
`git log`, not estimates. The user-facing version of this lives at `/changelog`;
this file is the engineering record, including the things users never see.

**Repo:** first commit 21 Jun 2026 · 219 commits total
**This engagement:** 8–12 Aug 2026 · 39 commits · +59,856 / −44,926 lines

---

## 12 Aug 2026

### Added
- **Risk Index is now computed** (`src/lib/countryRisk.ts`) — market dispersion 30%, declining breadth 25%, inflation distance from a 2% target 25%, policy-rate level 20%. Verified US 32, Japan 20, with a per-factor breakdown. *Growth item 3.*
- **News sentiment is now computed** — mean classified score of real published headlines per country, reusing the news feed's own 0–100 scale and 58/42 thresholds.
- **Landing proof block** — 587 instruments / 68 countries / 13 sectors / 5 sources, counted off the registry; plus a signal record computed live from the engine (237 scored, 37 target hits, 89 stops).
- **P&L preview** — a working slice of the Pro portfolio view: real quotes marked against a demo book, animated total, per-row sparklines, green/red.
- **Six upgrade reasons + a fourth plan** (Free / Pro / Team / Embed).
- **New GFT mark** — a globe whose latitude lines step up so the strokes double as a bar chart. Also now the PWA icon.
- **Schema.org JSON-LD** — Organization/WebSite/WebPage graph per route, with SearchAction. *Growth item 97.*
- **Monochrome landing + sign-in** — Swiss Modernism direction, Instrument Serif + JetBrains Mono, pure `#000`.

### Removed
- The "Stock charts" panel on Markets — 54 lines duplicating the header button, the ticker tables and sector nav.
- 244 lines of dead CSS and 2 orphaned components from two superseded landing versions.
- `AI SENTIMENT` label — renamed `NEWS SENTIMENT`; there is no model, and the old name overclaimed.

### Fixed
- **Quote feed was rate-limiting itself into a freeze.** Proxy cached for only 5s, so round-robin sweeps never shared a cache and every extra visitor multiplied upstream calls past Finnhub's 60/min cap. Cache 5s → 30s, 429s cached 20s, client sweep aligned to the TTL. Verified 6/6 calls 200, `x-vercel-cache: HIT`.
- Headline words rendered without real spaces (`inline-block` collapse) — looked correct, read as `Theworld'seconomy` to screen readers and crawlers.
- `.lpx-hero` / `.lpx-section` used the `padding` shorthand, silently resetting side gutters — content would have touched the edge on narrow screens.
- Consent banner rendered in the app's blue/violet over a pure-black page.
- PWA manifest shipped **Vite's default logo** as the app icon.

---

## 11 Aug 2026

### Fixed
- **Production outage.** `RightRail` rendered `<BreadthBar tick={tick} />` after both the prop and the local state were removed — `ReferenceError: tick is not defined` killed every page behind the login. The landing survived because it doesn't mount the rail, which is why the site looked half-alive.
- **Price alerts never fired.** `PriceAlert.price` had been renamed `targetValue`; `AlertWatcher` still compared `alert.price` (undefined), so every crossing check was silently false.
- **Sector heat map had stopped refreshing** — `Markets` passed a stale `tick` prop to components that no longer accepted it.
- **PR #9 could not build** — 15 merge-conflict markers committed as source across 6 files (66 type errors). Rebuilt the Forum feature on a working main and shipped as PR #10; the original would have reverted the nerd-mode, recent-symbols and member-number work.

### Added
- **`npm run typecheck` wired into CI.** `vite build` does not typecheck, which is how a guaranteed runtime crash reached production. Added `src/vite-env.d.ts` + `@types/three` first, since 20+ phantom `import.meta.env` errors were why nobody ran `tsc`.
- **Pre-push hook** (`.githooks/`, no dependencies) — every push runs typecheck → lint → build and is blocked on failure.
- **`docs/MAINTAINER.md`** — reviewing a PR, pulling with `--ff-only`, reverting a bad merge, rebuilding a PR too broken to fix.
- `CODEOWNERS`; CI now takes its Node version from `.nvmrc` instead of a hardcoded 22.

### Removed
- `.cursor/skills` — 235 files, 3.5 MB of vendored third-party skill packs unrelated to the product, and the source of 146 lint errors.
- 4 dead components with no importers.

---

## 10 Aug 2026

### Added
- **Sequential member numbers** — permanent `#N` per account via a Firestore transaction so simultaneous signups cannot collide; founder addresses pinned; existing accounts backfilled.
- **Nerd mode** — dense technical chrome hidden behind a `{ }` toggle. Provenance and freshness badges deliberately excluded: those are an honesty guarantee, not decoration.
- **Alert manager** (*item 72*) — armed alerts were invisible until they fired; now listed, clickable, deletable.
- **Recently viewed** (*item 78*), **weekly metrics ritual** (*item 23*), **signup friction cut** (*item 44*, 3 fields → 2).
- Terms of Service (*9*), Privacy Policy (*10*), `docs/DATA-LICENSING.md` (*6*).
- Per-instrument provenance (*item 2*) — `provenanceFor()`; crypto reads LIVE (Binance), FX ECB DAILY, US equities DELAYED, the rest SIMULATED.

### Fixed
- **CI was red on every push** — 146 lint errors, all from vendored editor tooling being parsed as browser code.
- **Markets and Country pages hardcoded a `SIM` badge while showing live data.**
- **Quote feed gave up permanently** after 3 failures, so adding the API key did nothing until a hard reload. Now backs off and re-probes every 2 min.
- **The symbol on screen was polled once per full sweep** (minutes). Now refreshes every ~2s.
- **`classifyIndex` tested `/USD/` before `/BTC/`** — BTC/USD was filed as FX and showed "ECB DAILY" provenance on a live Binance feed.

### Removed
- Preview deploys for scratch branches (`vercel.json` `git.deploymentEnabled`).

---

## 9 Aug 2026

### Added
- **Account data export + deletion** (*item 13*, GDPR) — JSON export of everything held; type-`DELETE` erasure, reauth-aware.
- **Freshness indicator** (*item 7*) — LIVE / AT FRI CLOSE / PREV CLOSE / SIMULATED from the NYSE session clock, so a real weekend close stops reading as fake.
- **Product tour** (*item 42*) — spotlight coach marks, replayable.
- Firestore rules for the member counter: readable by any signed-in user, but the only legal write is a +1 increment.

### Fixed
- Domain migration — canonicals, OG tags and 667 sitemap URLs repointed after the Vercel account change.

---

## Known-open / needs a decision

| Item | Status |
|---|---|
| PostHog key | Wrong key type was set (`phx_` personal, not `phc_` project). Analytics still collecting nothing. |
| Real-time quotes | Finnhub free tier is delayed **by licence**. Non-US coverage needs a paid plan. |
| Signals hit rate | The demo engine scores **29%** (37 hits / 89 stops). A product problem, not a display bug. |
| Firestore rules | Member-counter rules are written but **not deployed** — `npx firebase deploy --only firestore:rules`. |
| Branch protection | Not enabled; CI gates are advisory until it is. |
| Legal review | Terms and Privacy are solid templates, not legal advice. |
