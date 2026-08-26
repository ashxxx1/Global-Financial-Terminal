# The SSR decision — growth-plan item 85

**Decision: do not migrate to Next.js. Prerender the Vite build instead.**
Taken 26 August 2026. Reversible; the conditions that would reverse it are at
the bottom.

---

## The problem, measured before deciding

Every public URL served byte-identical HTML:

```
$ curl -s .../stock/AAPL | grep -o '<title>[^<]*</title>'
<title>Global Financial Terminal — The World's Economy, Live</title>
$ # characters of text inside <body>: 0
```

Two separate faults, and only one of them was the one the plan named.

**Fault 1 — no content in the HTML.** `<div id="root"></div>` and nothing else,
across all ~1,000 URLs. Googlebot renders JavaScript and would eventually see
the app. The crawlers that matter most for a research product do not run
JavaScript at all: GPTBot, PerplexityBot, ClaudeBot, Bingbot's non-render tier,
and every social scraper that builds a link preview. To all of them the entire
site was one untitled page.

**Fault 2 — the pages were not public.** Found while fixing fault 1. The auth
gate rendered the marketing page for anyone without a session, whatever URL they
asked for. So even a crawler that *does* execute JavaScript saw the same landing
page a thousand times — and a human arriving from a search result for "Apple
share price" got a signup wall instead of the page they clicked.

Fault 2 is the one that mattered more, and no amount of SSR would have fixed it.

## Why not Next.js

The plan assumed the migration. Having measured the problem, it buys less than
it costs.

**What it would cost.** Rewriting 50+ routes from react-router to the app
router; every `useEffect` data path; SSR guards for three.js, globe.gl,
lightweight-charts and Firebase; restructuring the edge functions; and a long
tail of regressions in a product whose whole claim is that its numbers are
right. Weeks, during which nothing else ships.

**What it would buy.** Server-rendered HTML for the static layer — which
prerendering already gives us — plus server-rendered *live market data*, which
is the part we must not have. A price rendered on the server and cached is stale
the moment the market moves. The terminal's one promise is that a number on
screen says where it came from and how old it is. Baking quotes into cached HTML
breaks precisely that. The headline feature of the migration is a feature this
product would have to switch off.

**What it would not fix.** The auth gate. That was a routing policy, and it was
a twelve-line change.

## What was built instead

`scripts/prerender.mjs` runs after `vite build` and writes a real document per
route: its own title, description, canonical, Open Graph tags, JSON-LD, and a
content shell with a heading, durable facts and internal links. The SPA boots
over it and removes the shell on mount, so a human sees what they saw before.

`scripts/lib/pages.mjs` is the single catalogue behind both the prerenderer and
the sitemap, built by importing the app's own registries. A URL cannot be
advertised without having a document, and a document cannot exist outside the
index.

**The rule that governs the output:** no price, no change, no index level, no
return may appear in prerendered HTML. `scripts/prerender-tests.mjs` scans the
output for anything price-shaped and fails the build. A page may opt out only by
declaring `staticFigures` in the catalogue, which today covers dated market notes
and glossary worked examples — figures that do not decay.

Access is now decided per route: content is public, personal and social routes
require a session, and `/` stays the marketing page for anonymous visitors.

## What this does not give us

Honest limits, so nobody assumes more than is there:

- **No server-rendered live data.** Deliberate, per above.
- **No per-request personalisation.** The HTML is identical for everyone until
  the app boots. Fine here — nothing public is personalised.
- **Build time scales with page count.** 1,045 pages add about a second. At
  10,000 it needs revisiting.
- **The shell is a floor, not the page.** It carries what a search result cannot
  and the app carries the rest. If a template's shell is thinner than a search
  snippet, that template is not worth publishing.

## What would reverse this

Any one of these makes the Next.js case again:

1. A licence to serve delayed quotes in cached HTML, making server-rendered
   market data legitimate.
2. Per-user server-rendered pages becoming a product requirement.
3. Page count past ~10,000, where per-request ISR beats a build-time sweep.
4. Evidence that prerendered shells are not indexing — measured in Search
   Console, not assumed.

Until one of those is true, this is where it stands.
