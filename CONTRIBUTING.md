# Contributing

Thanks for helping build the terminal. This guide gets you from clone to pull
request without guesswork.

## Getting set up

```bash
git clone https://github.com/ashxxx1/Global-Financial-Terminal.git
cd Global-Financial-Terminal
npm install
cp .env.example .env.local
npm run dev
```

The app runs at <http://localhost:5173>.

**Every key in `.env.local` is optional.** With none of them set the app still
boots: market data falls back to a deterministic simulation, and because
Firebase is unconfigured the auth gate is skipped entirely. Add keys only for
the parts you are working on.

| Variable | Unlocks | Free? |
|---|---|---|
| `VITE_FIREBASE_*` | Accounts, sign-in, synced watchlists | Yes |
| `VITE_FINNHUB_API_KEY` | Live US equity quotes | Yes |
| `VITE_REQUIRE_AUTH=false` | Browse without signing in (handy locally) | — |

## Project layout

```
api/           Vercel edge functions (RSS proxy)
src/
  components/  Reusable UI — Sparkline, MarketSessions, BreadthBar, RightRail…
  pages/       Route-level screens — World, Markets, Stock, Country, News, Login
  lib/         Data layer. No React in here.
    feeds/     Live sources (crypto, fx, stocks, quakes) + SSE backend client
    market.ts  Quote registry, history, formatting
    auth.ts    Firebase auth store
  styles/      theme.css — the whole design system
  data/        Static country/stock reference data
```

Two rules keep this navigable:

1. **`lib/` never imports React.** It is plain TypeScript so it stays testable
   and reusable.
2. **Firebase is only imported from `lib/firebase.ts` and `lib/auth.ts`.**
   Components use the `useAuth` store instead of the SDK.

## Style

- TypeScript everywhere. `any` needs a comment explaining why.
- Styling goes through the CSS variables in `src/styles/theme.css` — never
  hardcode a hex value. If you need a new colour, add a token.
- Comments explain *why*, not *what*. Skip the ones that restate the code.
- Match the surrounding file. It is more important to look consistent than to
  be individually right.

## Before you open a PR

```bash
npm run build   # must pass — this is what CI runs
npm run lint
```

Check the browser console for errors and click through the pages you touched.

## Commits

Conventional Commits:

```
feat(markets): add sector heatmap
fix(news): scope headline dedupe per batch
chore(deps): bump three to 0.184
```

Explain *why* in the body when the reason is not obvious from the diff.

## Pull requests

- One concern per PR. A bug fix and a refactor should be two PRs.
- Include a before/after screenshot for anything visual.
- Say how you tested it.
- Draft PRs are welcome — open one early if you want direction.

## Reporting bugs

Use the issue templates. A screenshot and the browser console output resolve
most reports in one round trip.
