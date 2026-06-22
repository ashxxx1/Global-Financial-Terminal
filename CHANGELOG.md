# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-06-22

### Added
- **Social Trading Hub** — Added trader profiles, user bios, direct direct-messages with active friends, community feed to publish updates, like updates, and reputation badges.
- **Brokerage Sync Integration** — Added Alpaca, Interactive Brokers, and Robinhood connectivity. Supports direct sync of paper trade positions or manually allocating portfolios.
- **AI Portfolio recommendations** — Real-time Beta calculation, tech sector concentration alert, and portfolio hedging advice.
- **Geopolitical News Aggregator** — Connected 10 national news channels per country (US, IN, CN, DE, JP) and integrated an AI geopolitical risk typewriter summary inside the News Panel.
- **Support for Virtual Category All** — Displays all forum threads across all categories combined under `/forum/all`.
- **Trader Redirect Flow** — Clicking `$TICKER` inside the forum now automatically navigates back to the main terminal dashboard and opens the stock panel instantly.

### Changed
- **Version Tracking**: Updated active shell version to `v0.3.0-alpha`.
- **UI Harmonization**: Removed neon colors in place of slate overlays and standardized panel borders for a more editorial human feel.

## [0.2.0] - 2026-06-22

### Added
- **Satellite Earth Globe** — Switched to NASA Blue Marble high-resolution earth texture for a photorealistic 3D globe.
- **Globe Graticules Grid** — Added geographic latitude/longitude grid lines for a professional navigation feel.
- **Globe Physics Damping** — Smooth orbit damping (dampingFactor: 0.08) for a premium, weighty globe movement experience.
- **Space Grotesk Font** — Added modern geometric sans-serif font for a more premium typographic feel.
- **Glassmorphism Header** — Header now uses `backdrop-filter: blur` for a frosted-glass transparent effect.
- **Glassmorphism Sidebar** — Sidebar upgraded with glass blur layering for depth.
- **Nebula Space Background** — Globe area now has a multi-layer radial nebula gradient (blue/green deep space) behind the earth.
- **Pixel-Perfect Corner Badges** — Corner labels now styled as frosted glass badge chips with borders.
- **Cursor Interactivity** — Globe now changes cursor to pointer when hovering over tracked countries.
- **Premium Country Tooltips** — Globe hover tooltip redesigned with ISO code badge, full market data, and sentiment border color.

### Changed
- **Color Palette Refined**: Switched from neon green to a more balanced `#00e87a` with proper glow tokens.
- **Ticker Strip Redesigned**: Gradient background (dark → slightly lighter → dark), smaller font, bolder values with border tags.
- **News Panel Deepened**: Background deepened to near-black with stronger glassmorphism and directional glow shadow.
- **Globe Atmosphere**: Upgraded atmosphere color to `rgba(80,160,255,0.20)` for a blue ionosphere effect.
- **Loading Screen**: Loading screen now uses space gradient background and glowing text.
- Responsive sidebar breakpoints updated (1024px → 200px sidebar).

---

## [0.1.1] - 2026-06-22

### Added
- Integrated a new **Investment Disclaimer Footer** displaying regulatory warning messages to ensure compliance.
- Created custom `Footer.jsx` React component.
- Added responsive layout grid integration for the new footer component.
- Patched 3D Globe visualization to display the **official map boundary of India** (Jammu, Kashmir, and Ladakh represented accurately) using Survey of India / land-simplified GIS coordinates.

### Changed
- **UI Enhancements**:
  - Upgraded sidebar items with dynamic active-glowing left borders and inset glow styling on hover.
  - Implemented glassmorphic visual improvements and inset glow shadows for article cards in the News Panel.
- **Performance Optimizations**:
  - Resolved WebGL context memory leaks by cleaning up the Three.js/Globe.gl canvas instances upon component unmount.
- Updated project metadata configuration.

---

## [0.1.0] - 2026-06-21

### Added
- **Initial Release** of the simulated Global Financial Terminal.
- Core 3D Globe visualization (`GlobeView`, `GlobeArea`) utilizing WebGL/Three.js showing real-time market data across tracked countries.
- Sidebar panel displaying live Equity, FX, Commodities, and Crypto indices.
- News Panel with AI sentiment analysis scoring (Bullish/Bearish/Neutral tags) and index performance sparkline SVGs.
- User Authentication (Firebase Auth) with a secure routing system.
- Administrative Panel with user access management capabilities.
- Dynamic scrolling header ticker.
- Configured Vercel and Firebase hosting deployment variables.
