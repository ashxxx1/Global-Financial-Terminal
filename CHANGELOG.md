# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2026-06-22

### Added
- Integrated a new **Investment Disclaimer Footer** displaying regulatory warning messages to ensure compliance.
- Created custom `Footer.jsx` React component.
- Added responsive layout grid integration for the new footer component.

### Changed
- **UI Enhancements**:
  - Upgraded sidebar items with dynamic active-glowing left borders and inset glow styling on hover.
  - Implemented glassmorphic visual improvements and inset glow shadows for article cards in the News Panel.
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
