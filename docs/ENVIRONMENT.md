# Environment & data safety (Preview vs Production)

GFT · TERMINAL must not let Preview / `test` deployments mutate production user data or secrets.

## Secrets

- **Never commit** `.env`, `.env.local`, or API keys.
- Browser-exposed vars must use the `VITE_` prefix intentionally.
- Server secrets (`FINNHUB_API_KEY`, `CRON_SECRET`, `GNEWS_API_KEY`, Firebase Admin if added later) stay **server-side only** (Vercel/Render env, not the client bundle).

## Firebase / Firestore

- Client rules already deny writes to signals and most collections; users can only write their own `users/{uid}` (and create-only feedback).
- Preview deployments should use a **separate Firebase project** (or at least separate Firestore) when auth/write features are tested with real accounts.
- Until a dedicated Preview Firebase project exists, treat Preview as **read-mostly / demo** and do not run destructive account scripts against production.

## Signals / backend store

- Demo signals persist in the browser (`localStorage`) or the Render backend file store under `.data/` (gitignored).
- Production Render and Preview must not share the same writable disk volume if live signal generation is enabled.

## Vercel

| Environment | Git branch | Domain | Env vars |
|---|---|---|---|
| **Production** | `main` | `https://global-financial-terminal-eight.vercel.app/` | Production secrets |
| **Preview** | `test`, `feature/*`, PRs | Vercel-generated Preview URL | Preview / non-prod secrets |

Do **not** point the production domain at `test`.
