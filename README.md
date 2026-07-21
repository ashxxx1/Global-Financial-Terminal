# Global Financial Terminal

A real-time command center for the world's economy — interactive 3D Earth, live
markets, country intelligence dashboards, and balanced AI-style analysis across
60+ countries and ~600 listed equities. Fully public: no login to view anything.

Built with React + TypeScript + Vite · three.js globe · zustand · zero-backend
deterministic data engine (every panel honestly badged `SIM` until live feeds
are keyed in). Full product spec: [SPEC.md](SPEC.md).

## Run locally

```bash
npm ci
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

## Deploy

Hosted on **Vercel**: the repo is imported at vercel.com and every push to
`main` auto-deploys. `vercel.json` configures SPA rewrites + asset caching.

## History

The pre-rebuild application (v0.6, React/Firebase/Netlify era) is archived at
git tag [`legacy-v0.6`](../../releases/tag/legacy-v0.6).
