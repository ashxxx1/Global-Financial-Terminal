# Research engine — data capabilities

What the research engine can and cannot see, and how to extend it.

Probed against the live Finnhub API on **2026-08-15**. Re-probe before trusting
these rows; `src/lib/research/capabilities.ts` carries the same dates in code
and is the registry the analyzers actually read.

## Available

| Capability | Dataset | Notes |
|---|---|---|
| `quote` | — | Live where the plan covers it; simulated elsewhere and labelled |
| `price-history` | `candles` | Used for realised volatility |
| `fundamentals` | `metrics` | 133 point-in-time metrics |
| `fundamental-history` | `metrics` | 39 annual series (to 42 years), 41 quarterly (to 149 quarters) |
| `earnings-surprises` | `earnings` | Actual vs consensus, last 4 quarters |
| `analyst-ratings` | `recommendations` | Buy/hold/sell counts, 4 periods |
| `company-news` | `news` | ~250 articles, 14-day window |
| `sec-filings` | `filings` | Metadata and links only — **not** the text |
| `insider-transactions` | `insider` | ~116 recent filings |
| `peers` | `peers` | 12 names |

## Paid tier (returns 403 on our plan)

`eps-estimates` · `revenue-estimates` · `price-targets` · `earnings-transcripts`

## Not available from any source we hold

`options-positioning` · `filing-text` · `short-interest` · `institutional-holdings`

Every one of these is declared in the registry with an `absence` explanation and
an `alternative`, so a question that needs one produces a named refusal and the
closest valid substitute — never a silent swap.

## The unit trap

The provider reports **margins and returns as fractions in the series** but as
**percentages in the point-in-time metrics**:

```
series.quarterly.netMargin  →  0.2723
metric.netProfitMarginTTM   →  27.62
```

Mixing them understates every margin and return move by 100×. It shipped once:
NVDA's net margin moved **+16.20pp** over eight quarters and was reported as
**+0.16pp** — a number that reads as "nothing happened".

Two guards:

1. `FRACTIONAL_SERIES` in `src/lib/research/series.ts` lists the affected keys,
   and `hist()` in `analyzers/shared.ts` is the only sanctioned way to read a
   series. Calling `seriesOf()` directly in an analyzer reintroduces the bug.
2. `npm run research:selftest` compares each series against its point-in-time
   twin on live data and fails if they diverge by an order of magnitude.

Ratios (`currentRatio`, `totalDebtToEquity`) and multiples (`peTTM`, `pb`) are
already on the same scale in both places and must **not** be scaled.

## Adding a premium source

The analyzers ask the capability registry, not an endpoint, so adding a source
is a registration rather than a rewrite:

1. Add the dataset to `api/research.ts` with a cache TTL matched to how fast it
   changes.
2. In `capabilities.ts`, flip the capability's `availability` to `"available"`,
   set `dataset`, and update `verifiedAt`.
3. Every analyzer that declared the capability in its `WANTED` list stops
   emitting the absence caveat automatically. Analyzers that should now say more
   need new claims — but nothing needs restructuring.
4. Run `npm run research:selftest`, adding a twin row if the new dataset has one.

## Testing

`npm run research:selftest` hits production and asserts scale invariants. Run it
after any change to `series.ts`, `capabilities.ts` or an analyzer's metric keys.
It is deliberately not in the pre-push hook: it depends on the network and a
live third-party API, and a flaky gate is one people learn to bypass.
