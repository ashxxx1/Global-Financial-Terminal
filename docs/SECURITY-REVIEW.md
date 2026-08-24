# Security review — 2026-08-24

Findings from a review of the deployed client bundle, dependency tree and
response headers. Everything below was verified against the actual build
output, not inferred from the source.

## CRITICAL — API key published in the client bundle (fixed)

`VITE_FINNHUB_API_KEY` and `VITE_ADMIN_EMAIL` were inlined into the production
JavaScript, readable by anyone who opened devtools.

**Cause.** Nine call sites read env vars as `(import.meta as any).env?.X`. That
is a *dynamic* property lookup, and Vite can only statically replace the literal
form `import.meta.env.VITE_X`. Faced with a dynamic access it falls back to
emitting the **entire `import.meta.env` object** — publishing every `VITE_`
variable defined at build time, whether or not the code uses it.

The `as any` cast was added to silence a TypeScript error. It silenced a leak.

**Fix.** All nine converted to the static form. The Finnhub dev-fallback key is
additionally gated behind `import.meta.env.DEV`, so the production build drops
the reference entirely rather than shipping a key that merely happens to be
unused. Verified: 0 occurrences of the key or the admin email in `dist/`.

**Action still required — rotate the Finnhub key.** It was public for as long as
the bundle was deployed. Regenerate it at finnhub.io, update
`FINNHUB_API_KEY` (server-side, no `VITE_` prefix) in Vercel, and remove
`VITE_FINNHUB_API_KEY` from the Vercel environment entirely.

## HIGH — no security headers (fixed)

The site sent only HSTS. Added in `vercel.json`:

| Header | Why |
|---|---|
| `Content-Security-Policy` | Restricts script, connect and frame sources to the origins the app actually uses |
| `X-Frame-Options: DENY` | Clickjacking; `frame-ancestors` covers modern browsers, this covers the rest |
| `X-Content-Type-Options: nosniff` | Stops a browser second-guessing a declared type |
| `Referrer-Policy` | Do not leak the page being read to third parties |
| `Permissions-Policy` | Camera, mic, geolocation, payment all denied — we ask for none |
| `Cross-Origin-Opener-Policy` | Isolates the browsing context; popups still work for OAuth |

`style-src` keeps `'unsafe-inline'` because the app uses React inline style
props throughout. Removing it means rewriting every component, so it is a known
gap rather than an oversight.

**A CSP breaks things quietly, so verify it in production.** The first version
of this policy blocked Google Fonts — the site rendered, no error was visible to
a user, and the display typeface silently fell back. Only the browser console on
the deployed site showed it. `fonts.googleapis.com` is now allowed in
`style-src` and `fonts.gstatic.com` in `font-src`. Check the console after any
change to this header.

## MEDIUM — 5 dependency vulnerabilities (fixed)

Five advisories in `tar`, reached through `@tailwindcss/oxide`. Resolved by
`npm audit fix`; the tree now reports 0.

## Remaining, by design

- **`VITE_GNEWS_API_KEY` is client-side.** Any `VITE_` variable is public by
  definition. If that key is ever set in production it will ship in the bundle.
  It should move behind a server route the way Finnhub did.
- **Firebase web API key is in the bundle.** This is correct and intended —
  Firebase web keys are public identifiers, not secrets. Access is controlled by
  Firestore rules, which is why deploying them (growth-plan item 24) matters.
- **One `dangerouslySetInnerHTML`.** Reviewed: it renders our own JSON-LD, not
  user input.

## How to re-run this

```bash
npm audit --omit=dev
npm run build && grep -rE "VITE_[A-Z_]*(KEY|SECRET|TOKEN|EMAIL)" dist/assets/*.js
curl -sI https://global-financial-terminal-eight.vercel.app | grep -iE "content-security|x-frame|referrer"
```

The middle command is the one that matters. Run it before every release: a
`VITE_`-prefixed secret is one careless env var away from being public again.
