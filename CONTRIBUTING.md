# Contributing to GFT · TERMINAL

Thanks for helping build the terminal. This guide covers local setup, the
**feature → test → main** workflow, Vercel previews, and UI skills.

## Branch architecture

```
feature/*  ──PR──►  test  ──review──►  main  ──►  Vercel Production
                       │                              │
                       └─ Preview URL                 └─ https://global-financial-terminal-eight.vercel.app/
```

| Branch | Purpose | Deploy |
|---|---|---|
| `main` | **Production only.** Stable, approved code. No direct contributor pushes. | Production domain |
| `test` | Staging / integration. All contributor work lands here first. | Vercel Preview |
| `feature/*` | Individual work (interns & contributors). | Vercel Preview |

**Never push directly to `main`.** Never point the production domain at `test`.

---

## Getting set up

```bash
git clone https://github.com/ashxxx1/Global-Financial-Terminal.git
cd Global-Financial-Terminal
npm ci
cp .env.example .env.local
npm run dev
```

App: <http://localhost:5173>

**Every key in `.env.local` is optional.** With none set, the app boots on
deterministic SIM market data and skips the auth gate. See
[docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) for Preview vs Production safety.

| Variable | Unlocks |
|---|---|
| `VITE_FIREBASE_*` | Accounts, synced watchlists |
| `VITE_FINNHUB_API_KEY` | Live US equity quotes (dev) |
| `FINNHUB_API_KEY` | Live quotes via `/api/quote` (server / production) |
| `VITE_REQUIRE_AUTH=false` | Browse without signing in |
| `VITE_SIGNALS_DEMO_MODE` | GFT Signals demo track record (default true) |

---

## Intern / contributor workflow

```bash
# 1. Start from the staging branch
git fetch origin
git checkout test
git pull origin test

# 2. Create your feature branch
git checkout -b feature/my-feature

# 3. Make changes, then verify
npm run lint
npm run build

# 4. Commit (Conventional Commits)
git add .
git commit -m "feat(scope): short description"

# 5. Push and open a PR into test (NOT main)
git push -u origin feature/my-feature
```

Open a Pull Request:

**base:** `test` ← **compare:** `feature/my-feature`

Vercel creates a **Preview Deployment** on the PR. Share that URL for review.

### After review

1. Merge `feature/*` → `test`
2. Re-test on the `test` Preview URL
3. Maintainer opens / merges **`test` → `main`**
4. Production auto-deploys from `main` to  
   https://global-financial-terminal-eight.vercel.app/

---

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs on:

- every pull request
- pushes to `main` and `test`

Checks (existing project commands only):

```bash
npm ci
npm run build
npm run lint --if-present
```

PRs should be green before merge.

---

## Commits

```
feat(markets): add sector heatmap
fix(news): scope headline dedupe per batch
chore(deps): bump three to 0.184
docs(contributing): document test branch workflow
```

Explain *why* in the body when it is not obvious from the diff.

## Pull requests

- One concern per PR.
- Target **`test`** unless you are a maintainer promoting staging → production.
- Include before/after screenshots for UI changes.
- Say how you tested it (Preview URL + local).
- Draft PRs are welcome for early feedback.

---

## UI / UX skills (Cursor)

This repo vendors Cursor skills under `.cursor/skills/`. Use them for **new UI
work**; do **not** redesign the whole terminal.

| Pack | How it was installed | When to use |
|---|---|---|
| **UI UX Pro Max** | `npx ui-ux-pro-max-cli init --ai cursor` | Layouts, typography, spacing, dashboards, charts, hierarchy, a11y review |
| **UI Skills** | Vendored from [ibelick/ui-skills](https://github.com/ibelick/ui-skills); CLI `npx ui-skills start` | Components, interactions, polish, motion, accessibility |
| **Bundles Forge** | Vendored from [OdradekAI/bundles-forge](https://github.com/OdradekAI/bundles-forge) | Skill/plugin scaffolding & audits — **not** for product UI redesign |

**Identity lock:** preserve the GFT dark terminal look (see `.cursor/rules/gft-ui.mdc`).
Reuse `src/styles/theme.css`. Think Bloomberg / TradingView / Reuters / Linear —
not generic SaaS or purple-gradient AI templates.

### UI quality checklist (every new surface)

- [ ] Typography & spacing
- [ ] Hierarchy & data readability
- [ ] Accessibility (focus, labels, contrast)
- [ ] Responsive / mobile
- [ ] Hover & focus states
- [ ] Loading / empty / error states
- [ ] Subtle motion only; `prefers-reduced-motion`

---

## Project layout

```
api/              Vercel edge functions
src/
  components/     Reusable UI
  pages/          Route screens (incl. signals/)
  lib/            Data layer (no React)
  styles/         theme.css — design system
.cursor/skills/   Agent UI / workflow skills
docs/             Workflow & environment docs
```

Rules:

1. **`lib/` never imports React.**
2. **Firebase only via `lib/firebase.ts` / `lib/auth.ts`.**
3. Styling through CSS variables in `theme.css` — no hard-coded one-off palettes.

---

## Protecting production

Branch protection must be configured by a repo admin. Exact checklist:
[docs/BRANCH-PROTECTION.md](docs/BRANCH-PROTECTION.md).

Environment separation: [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

---

## Reporting bugs

Use the issue templates. A screenshot and browser console output resolve most
reports in one round trip.
