# Open questions

Things that are known-unfinished, with what has already been ruled out, so the
next attempt does not repeat the last one.

---

## Per-page share cards need a raster generator

**Status:** blocked. `og:image` points at the static `/og.png` for every page.

**Why it matters.** Growth-plan item 96 wanted a card per page, and the wiring
now works: the prerenderer writes `og:image` into the HTML, which is what card
scrapers actually read. What is missing is a card in a format they will render.

**The constraint.** Facebook, X, LinkedIn and Slack whitelist raster formats for
`og:image` and ignore SVG. Our card endpoint renders SVG, which is correct for
the embed badge — browsers render SVG images natively — and useless for a
social card. Pointing `og:image` at it would produce *no* card, which is worse
than a generic one that renders.

**What was tried, 26 August 2026.** `@vercel/og` (satori + resvg-wasm), the
standard answer, in three configurations:

| Attempt | Result |
|---|---|
| Edge runtime, Web handler | **Build failed.** The resvg and yoga wasm will not fit an edge function bundle. |
| Node runtime, Web handler | Built, then `FUNCTION_INVOCATION_FAILED` on every request. Vercel's Node functions take `(req, res)`; a Web `Response` fails the invocation before the handler is entered. |
| Node runtime, `(req, res)` handler, `api/package.json` set to CommonJS | Built, still `FUNCTION_INVOCATION_FAILED`, and `?debug=1` never returned — so the module is failing to load, not the render. |

The remaining hypothesis, untested: `@vercel/og`'s Node build loads its font and
wasm from disk, and Vercel's file tracing does not carry those assets into the
bundle for a non-Next project. That would need `includeFiles`, and verifying it
costs a production deploy each time because preview deployments here are
behind Vercel authentication and the Vercel MCP is not authorised on this
account.

**Cheaper paths worth considering before retrying that:**
1. Generate PNGs at build time with Playwright — already a devDependency — for
   a bounded set (68 countries, 14 sectors, the largest few hundred companies),
   and fall back to the static card elsewhere. Costs repository weight and CI
   minutes, buys certainty and zero runtime risk.
2. A separate scheduled job that regenerates those PNGs weekly and commits
   them, keeping the deploy build fast.
3. Identity-only cards, which is what a build-time card must be anyway: a price
   written into a static image is stale the moment the market moves.

Option 3 is not a compromise — it is the honest form of the artifact. The live
price belongs in the page, not in a cached image.

**One line to flip when this is solved:** `ogImage` in `scripts/prerender.mjs`.
The catalogue already carries the per-page URL.

---

## api/ was never typechecked until 26 August 2026

Fixed by `tsconfig.api.json`, now run by `npm run typecheck`. Recorded here
because it is the reason the share-card work took three deploys to diagnose:
the endpoint that serves quotes, candles and research had no static checking of
any kind, so a handler with the wrong signature could only be caught by
deploying it.
