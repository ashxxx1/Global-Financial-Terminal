# Maintainer guide — reviewing and pulling contributor work

For the repo owner. Contributors follow [CONTRIBUTING.md](../CONTRIBUTING.md);
this is the other half — how work reaches production without breaking it.

---

## The one rule

**Nothing reaches `main` except through a green pull request.** Every outage in
this repo so far came from code that reached `main` without a passing check:

| Date | What broke | Would protection have caught it? |
|---|---|---|
| 10 Aug 2026 | `tick is not defined` — whole terminal down | ✅ typecheck now fails the PR |
| 10 Aug 2026 | Price alerts silently never fired | ✅ typecheck |
| 9 Aug 2026 | 146 lint errors, red ✗ on every push | ✅ lint gate |
| PR #9 | Merge-conflict markers committed as source | ✅ build fails outright |

---

## Turn on branch protection (once, ~2 minutes)

This is the only step that cannot be done from the codebase — GitHub does not
read protection rules from a file.

1. **Settings → Rules → Rulesets → New branch ruleset**
2. Name it `main`, set **Enforcement: Active**
3. **Target branches → Add target → Include default branch**
4. Tick these rules:
   - **Require a pull request before merging** → Required approvals: **1**
   - **Require status checks to pass** → search and add **`build`**
     *(the job name in `ci.yml`)* → also tick **Require branches to be up to
     date before merging**
   - **Block force pushes**
5. **Create**

After this, a broken PR physically cannot be merged.

> Leave *"Do not allow bypassing"* unticked so you keep an emergency override
> for a production hotfix.

---

## Reviewing a contributor PR

```bash
git fetch origin
git checkout -b review-pr-<N> origin/<their-branch>
npm ci
npm run verify        # typecheck + lint + build — the same gates CI runs
npm run dev           # click through what they changed
```

Check, in this order:

1. **Does it build and typecheck?** If not, stop — send it back.
2. **Are there conflict markers?** `grep -rn "^<<<<<<<" src/` must print nothing.
   This has happened before.
3. **Does it revert anything?** Look for deletions in files they did not set out
   to touch. A bad merge silently rolls back other people's work.
4. **Does it touch data honesty?** Anything that displays a number must keep its
   provenance badge — see `src/lib/marketStatus.ts` and `/data-sources`.
5. **Does it add a dependency?** Ask why. Every one is a permanent liability.

Clean up when done:

```bash
git checkout main && git branch -D review-pr-<N>
```

---

## Pulling merged work into your local copy

```bash
git checkout main
git pull --ff-only origin main    # --ff-only refuses to create a surprise merge
npm ci                            # only if package-lock.json changed
npm run verify
```

If `--ff-only` errors, your local `main` has commits that aren't on the remote.
Do not force anything — move them somewhere safe first:

```bash
git branch backup-local-main      # keep them
git reset --hard origin/main      # match the remote exactly
```

---

## When a bad merge reaches main

1. **Revert first, diagnose second.** Production comes back immediately:
   ```bash
   git revert -m 1 <merge-commit-sha>
   git push origin main
   ```
2. Then reproduce locally, fix properly, and open a normal PR.
3. Add whatever check would have caught it. That is what turned the 10 Aug
   outage into a permanent `typecheck` gate rather than a story.

---

## Rebuilding a PR that is too broken to fix

Sometimes a branch has conflict markers committed, or is based on a main so old
that merging would revert current work. Do not untangle it — rebuild it:

```bash
git checkout -b <feature>-fixed main          # start from good code
git checkout <their-branch> -- <new files>    # take only the additive files
# re-apply the integration points by hand (routes, nav, styles)
npm run verify
git push -u origin <feature>-fixed
```

Then open a fresh PR and close the old one. **Never force-push over someone
else's branch** — it destroys their history.

---

## Keeping deploys quiet

Only `main` should deploy to production. Scratch branches are muted in
`vercel.json` under `git.deploymentEnabled`. Add new ones there rather than
letting every experiment build.
