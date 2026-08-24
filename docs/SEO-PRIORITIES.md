# Which SEO templates to ship, and why

Growth-plan item 99. Written to decide sequencing, not to look thorough.

## The honest constraint first

We have **no keyword tool**. Ahrefs, Semrush and Moz all require a paid account,
so any volume figure here would be invented, and an invented number that drives
a roadmap is worse than no number. What follows ranks templates by **evidence we
actually have**, and says which column is a judgement.

Three things we can observe without a subscription:

1. **What we can serve well.** A template we cannot fill with real data should
   not ship at all — see item 100. This is the hard gate.
2. **Search intent shape.** "AAPL stock price" is navigational; "AAPL vs MSFT"
   is comparative; "why is AAPL down" is informational. Intent predicts whether
   a click can convert, regardless of volume.
3. **Competition we can see.** Whether Yahoo, Google Finance and Investing.com
   already own the first page for a query pattern — checkable by looking.

## Ranking

| Template | Data we can serve | Intent | Competition | Ship |
|---|---|---|---|---|
| `/stock/:sym` | Live price, fundamentals, research workspace | Navigational | **Brutal** — Yahoo/Google own it | Shipped, do not invest further |
| `/research/:sym` | Full evidence workspace, unique to us | Informational | **Weak** — nobody serves auditable claims | **1st priority** |
| `/compare/:a/:b` | Real side-by-side valuation with sources | Comparative | Moderate, mostly thin affiliate pages | **2nd priority** |
| `/country/:code` | Live benchmark, currency, top names, news | Informational | Moderate | 3rd |
| `/index/:slug` | Live proxy price, range, constituents | Navigational | Heavy | Shipped, low ceiling |
| `/fx/:pair`, `/crypto/:sym` | Live ECB/Binance | Navigational | **Brutal** | Shipped, low ceiling |
| `/sector/:slug` | Live constituent moves | Browse | Light | 4th |
| `/glossary/:term` | Definitions with JSON-LD | Informational | Heavy but long-tail | Shipped |

## Why research and compare rank first

They are the only two templates where **we have something the incumbents do
not**. Yahoo will always win "AAPL stock price" — they have the domain, the
backlinks and twenty years. They cannot easily win *"is AAPL expensive
compared to its own history"*, because their pages do not answer it and ours
computes it from 40 quarters with the arithmetic shown.

That is the whole strategy: compete where the answer is the product, not where
the quote is the product.

## The blocker that outranks all of this

**None of it indexes properly today.** The app is a client-rendered SPA, so
crawlers see an empty shell. Item 85 — the SSR decision — gates every row in
that table. Shipping more templates before it is building inventory for a
warehouse with no doors.

Recommended order:

1. Item 85: decide on SSR (Next.js migration, or prerendering the public routes)
2. Then research + compare templates, which is where the differentiated answer is
3. Only then breadth

## What would change this

Getting a keyword tool for one month would replace the judgement column with
measured volume, and could reorder rows 3–8. It would not change the top two,
because those are ranked on differentiation rather than volume — and it would
not change the SSR blocker, which is structural.
