# Contributing

## Changelog Requirement (MANDATORY)

**Every commit that introduces changes visible to users or the codebase MUST include a CHANGELOG.md entry.**

This applies to:
- All AI agents (Claude, Sonnet, Opus, Haiku, Fable)
- All human contributors
- All pull requests

### Why

- Maintains a human-readable history of what changed
- Enables quick onboarding for new contributors
- Serves as a release note reference
- Prevents duplicate work (if a feature is in the changelog, it's been done)

### How

1. **Before committing**, edit `CHANGELOG.md` under the current version (or create a new version if releasing).
2. **Use this format**:
   ```markdown
   ### Added
   - [Component] — what was added (one line, terse)
   
   ### Fixed
   - [Component] — what was fixed
   
   ### Changed
   - [Component] — what changed
   
   ### Infrastructure
   - [Item] — deployment, config, or tooling change
   ```

3. **Examples**:
   ```
   - **server/markets.js** — real Yahoo Finance index quotes (S&P, Nifty, Nikkei)
   - **CountryIntel.jsx** — show real economy + markets when backend is live
   - **render.yaml** — one-click deployment config (Render free tier)
   - **ChartTerminal.jsx:1841** — fixed setDrawingsList ReferenceError crash
   ```

4. **Keep it scannable**: Brief, no prose, no internal details. Focus on *what a user or contributor will see*.

5. **Commit message** should reference the changelog:
   ```
   Add intelligence backend + free market data

   - Real news via Google News RSS
   - Markets via Yahoo Finance
   - Economy via World Bank
   
   See CHANGELOG.md for full details.
   ```

### For AI Agents

If you're an agent (Claude Code, or any future AI system) working on this repo:

1. **Always update CHANGELOG.md alongside your code changes.**
2. **Every commit** must have a changelog entry (no exceptions).
3. **Before deploying to production**, ensure the changelog is complete and accurate.
4. **If you revert a change**, remove the corresponding changelog entry.
5. **If a feature requires multiple commits**, combine the changelog entries into one cohesive summary.

This is non-negotiable—it's how we maintain clarity as the codebase grows.

---

## Code Style

- **Frontend**: React 19, Tailwind, terminal-aesthetic (monoface, muted palette)
- **Backend**: Node.js ESM, no external deps (built-in http + global fetch)
- **Format**: 2-space indents, no semicolons in jsx/tsx (React convention)
- **Linting**: `npm run lint` must pass before commit

## Testing

- Browser testing: `/dev` mode with local backend (`npm run server`)
- Production test: live site (Netlify) with deployed backend (Render/Fly/etc.)
- Always verify on both desktop and mobile viewports

## Pull Requests

1. Branch off `main`
2. Commit with changelog entries
3. Push and open PR
4. Ensure CI passes (linting, build)
5. Merge when approved

## Questions?

Check `/CLAUDE.md` for project-specific guidance, or raise an issue.
