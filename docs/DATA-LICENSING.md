# Data licensing & redistribution review

**Growth-plan item 6.** Reviewed 10 August 2026.

Every provider we pull from, what their terms allow, and what that means for
charging money. This is the single highest-severity risk in the plan's risk
register — a licensing violation is the one mistake that can end the product
rather than merely slow it down.

> **This is an engineering review, not a legal opinion.** Before taking payment,
> a lawyer must confirm the two items marked ⚠️ below. See `YOUR-TASKS.md` item 5.

---

## Summary table

| Provider | What we use | Free-tier commercial use | Redistribution | Verdict |
|---|---|---|---|---|
| **Finnhub** | US equity quotes (`/api/quote`) | ⚠️ Free tier is **personal/non-commercial** | Not permitted in bulk | ⚠️ **Must upgrade before charging** |
| **Binance** | Crypto prices (public WebSocket) | Permitted, attribution expected | Display permitted; no bulk resale | ✅ OK |
| **European Central Bank** | FX reference rates | Permitted | Permitted with attribution | ✅ OK |
| **USGS** | Earthquake / live events | Public domain (US Government work) | Permitted | ✅ OK |
| **Google News RSS** | Headlines + links | Grey area for commercial products | ⚠️ Headline+link only; never full text | ⚠️ **Confirm or replace** |

---

## Provider detail

### Finnhub — ⚠️ the blocking one
- **Used for:** real US equity quotes, server-side via `api/quote.ts`.
- **Risk:** Finnhub's free tier is intended for personal, non-commercial use.
  The moment we charge for a subscription, a free-tier key is very likely a
  terms breach — and equity data is precisely what a paying user is paying for.
- **Mitigation already in place:** the key lives server-side only, we return
  just `{c, dp}` (no bulk series), and responses are cached — so we are not
  redistributing a dataset, only displaying quotes.
- **Required before Phase 4 (monetization):** move to a paid Finnhub plan, or
  switch to a provider whose licence explicitly permits commercial display
  (Twelve Data, Polygon and Alpaca all sell display-rights tiers).

### Binance — ✅
- **Used for:** live crypto prices from the public market-data WebSocket.
- Public market data, no key required. Displaying prices is fine; systematically
  redistributing or reselling the feed is not. We display only.

### European Central Bank — ✅
- **Used for:** daily FX reference rates.
- Published for public reuse with attribution, which `/data-sources` gives.
  Note these are a **once-daily fix**, not intraday — the UI now says so
  (item 2), which also protects us from implying more than the licence covers.

### USGS — ✅
- **Used for:** earthquake events on the globe.
- US Government work, public domain. No restriction on reuse.

### Google News RSS — ⚠️
- **Used for:** headlines, via our own `api/rss.ts` proxy.
- **What we do:** show headline, source name and a link to the publisher. We do
  **not** reproduce article bodies, and we must never start.
- **Risk:** RSS aggregation for a commercial product sits in a grey area, and
  publishers have historically been litigious about it.
- **Before monetizing:** either confirm acceptability with counsel, or move to a
  licensed news API (NewsAPI, Marketaux and Benzinga sell commercial tiers).

---

## Standing rules for this codebase

1. **Never cache a provider's data into a dataset we serve as our own.** Quotes
   are fetched, displayed and discarded; the 5s cache in `api/quote.ts` is
   rate-limit protection, not a datastore.
2. **Never display a number without its provenance.** `provenanceFor()` in
   `src/lib/marketStatus.ts` is the one place this is decided, and every label
   it emits has a matching row on `/data-sources`.
3. **Never reproduce third-party article text** — headline, source and link only.
4. **Keys stay server-side.** Any provider key must be read from `process.env`
   in an `api/*` function, never a `VITE_`-prefixed client variable.
5. **Re-run this review before launching billing** (plan item 120).
