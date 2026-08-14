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
| **Finnhub** | US equity quotes (`/api/quote`) + OHLCV candles (`/api/candles`) | ⚠️ Free tier is **personal/non-commercial** | Not permitted in bulk | ⚠️ **Must upgrade before charging** |
| **Binance** | Crypto prices (public WebSocket) | Permitted, attribution expected | Display permitted; no bulk resale | ✅ OK |
| **European Central Bank** | FX reference rates | Permitted | Permitted with attribution | ✅ OK |
| **USGS** | Earthquake / live events | Public domain (US Government work) | Permitted | ✅ OK |
| **Tracking ETFs (Finnhub)** | Index levels + commodities (`/api/quote`) | ⚠️ Same free-tier limit as equities | Display only | ⚠️ **Paid plan needed before charging** |
| **Alpha Vantage** | Non-US daily closes (`/api/intl-quote`) | ⚠️ Free tier is personal use; 25 req/day | Display only, no bulk | ⚠️ **Paid plan needed before charging** |
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

### Index & commodity proxies — ⚠️
- **Why:** index levels (S&P 500, FTSE 100) and commodity spot are licensed
  products; no free tier carries them. Each instrument is therefore priced from
  the US-listed ETF that tracks it, which is an ordinary Finnhub symbol.
- **What is real:** the ETF's price and its daily change.
- **What is not:** the ETF price is not the index level, and we do not rescale
  it into one — a synthesised number that looks official is worse than an honest
  proxy. Every row names its ETF inline.
- **Caveats carried in the UI:** international funds are USD-denominated, so
  their change includes FX. MOEX has no accessible ETF; VIX futures funds decay
  and do not track the index. Both stay simulated rather than being faked.
- **Before monetizing:** covered by the same Finnhub upgrade already flagged.

### Alpha Vantage — ⚠️
- **Used for:** previous-day closes on selected non-US exchanges, server-side via
  `api/intl-quote.ts`, cached 12h at the edge.
- **Verified working:** `.LON`, `.BSE`. **Not supported:** Tokyo (`.TYO`/`.T`)
  returns an empty quote on the free tier.
- **Hard limit:** 25 requests per day. This is why the feed rotates a handful of
  symbols per session rather than polling — and why it is presented as a daily
  close, never as live data.
- **Key handling:** read from `ALPHAVANTAGE_KEY`, with a disposable free key as
  a fallback default so the feature works without dashboard configuration. It
  carries no billing and is regenerable, but **rotate it if this repository is
  made public**, and move it to project settings when convenient.
- **Before monetizing:** the free tier is personal-use. A paid plan is required,
  alongside the Finnhub upgrade.

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
