# Project Cursor Skills

Installed for GFT · TERMINAL agent workflows. Prefer these over inventing a second design system.

| Skill pack | Source | Install method |
|---|---|---|
| **UI UX Pro Max** (`ui-ux-pro-max`, `slides`, `banner-design`) | https://github.com/nextlevelbuilder/ui-ux-pro-max-skill | `npx ui-ux-pro-max-cli init --ai cursor` |
| **UI Skills** (`ui-skills-*`) | https://github.com/ibelick/ui-skills | Vendored from upstream `skills/*` + CLI `npx ui-skills …` |
| **Bundles Forge** (`bundles-forge-*`) | https://github.com/OdradekAI/bundles-forge | Vendored from upstream `skills/*` (Cursor marketplace also available) |

## GFT constraint

When any UI skill is used on this product, **preserve the existing GFT terminal visual identity** (Bloomberg / TradingView / Reuters / Linear energy). Reuse `src/styles/theme.css` tokens. Do not introduce generic SaaS/purple-gradient aesthetics.

See also: `.cursor/rules/gft-ui.mdc` and `CONTRIBUTING.md`.
