# Manual GitHub & Vercel setup (required)

The Cloud Agent token **cannot** change repository branch-protection or Vercel project settings (API returns 403 / no access). Complete these once in the UI.

## A. GitHub — protect `main`

Repo → **Settings → Branches → Add branch protection rule** (or **Rules → Rulesets**) for `main`:

1. Require a pull request before merging
2. Require approvals (at least 1)
3. Dismiss stale approvals when new commits are pushed (recommended)
4. Require status checks to pass — select **CI / build**
5. Block force pushes
6. Block deletions
7. Do **not** allow bypass for contributors (admins optional)

Optional but recommended for `test`:

- Require PR (or allow maintainers to push for hotfixes)
- Require CI to pass
- Block force pushes / deletion

## B. GitHub — default PR base (optional)

Settings → General → **Default branch** stays `main` (production).

Tell interns in CONTRIBUTING: open PRs against **`test`**, not `main`.

## C. Vercel — production = `main` only

1. Open the Vercel project that owns **`https://global-financial-terminal-eight.vercel.app/`**
2. Settings → **Git**
   - Production Branch = **`main`**
3. Settings → **Domains**
   - Production domain must stay on Production / `main`
   - Do **not** assign that domain to Preview or `test`
4. Settings → **Environment Variables**
   - Production vars → Production only
   - Preview vars → Preview (and optionally Development)
5. Preview Deployments should already build for every non-production branch (`test`, `feature/*`, PR branches)

## D. Confirm Preview for `test`

After pushing to `test`, open the Vercel dashboard → Deployments → filter branch `test` → copy the Preview URL. That is the staging site.
