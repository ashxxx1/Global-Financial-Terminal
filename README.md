# 🌐 GlobalFin Terminal

> **Bloomberg-style financial terminal** — a real-time 3D world globe that maps global news and its impact on stock markets across 25+ countries.

![GlobalFin Terminal](./preview.png)

---

## ✨ Features (v0.1)

- 🌍 **Interactive 3D Earth Globe** — WebGL-powered, rotatable, zoomable
- 🔴🟢 **Sentiment heatmap** — countries glow green (bullish) or red (bearish) based on live news
- 📰 **Country drill-down** — click any country for top headlines + local index
- 📈 **Market sparklines** — today's index performance chart per country
- ⚡ **AI sentiment score** — aggregated market confidence score per region
- 📡 **Live ticker** — scrolling global indices, FX, commodities, crypto
- ⏰ **Live clock** — UTC + NYSE market open/close status

## 🗺️ Roadmap

| Version | Feature |
|---------|---------|
| **v0.2** | GNews API — real news for any country |
| **v0.3** | Alpha Vantage — live stock data |
| **v0.4** | Portfolio tracker + watchlist |
| **v0.5** | AI sentiment via OpenAI |
| **v0.6** | WebSocket live price feed |
| **v0.7** | Sector heatmap overlay |
| **v0.8** | Alerts + push notifications |
| **v1.0** | Auth + multi-user dashboards |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/global-financial-terminal.git
cd global-financial-terminal

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your API keys in .env

# 4. Start the dev server
npm run dev
```

The app will be available at **http://localhost:5173**

---

## 🔑 API Keys

All API keys are optional for the MVP — the app runs on rich mock data by default.

| Service | Free Tier | Purpose | Get Key |
|---------|-----------|---------|---------|
| GNews | 100 req/day | Country news | [gnews.io](https://gnews.io) |
| Alpha Vantage | 25 req/day | Stock data | [alphavantage.co](https://www.alphavantage.co) |
| News API | 100 req/day | Broader news | [newsapi.org](https://newsapi.org) |

Add keys to `.env` (copy from `.env.example`). **Never commit `.env` to git.**

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── Globe/          # 3D globe (globe.gl + Three.js)
│   ├── Header/         # Terminal header + clock
│   ├── Ticker/         # Scrolling market ticker
│   ├── Sidebar/        # Global indices sidebar
│   ├── NewsPanel/      # Country news + market data
│   └── Sparkline/      # SVG sparkline charts
├── store/
│   └── terminalStore.js  # Zustand global state
├── data/
│   └── mockData.js       # Mock data for 25+ countries
└── styles/
    └── index.css         # Bloomberg dark terminal theme
```

---

## 🤝 Contributing

1. **Branch**: Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop**: Make your changes and test locally

3. **Commit**: Use conventional commits
   ```bash
   git commit -m "feat: add portfolio tracker"
   git commit -m "fix: globe rotation on mobile"
   git commit -m "docs: update API setup guide"
   ```

4. **Push**: Push your branch
   ```bash
   git push origin feature/your-feature-name
   ```

5. **PR**: Open a Pull Request on GitHub

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vite + React 19 |
| 3D Globe | globe.gl (Three.js) |
| Charts | Recharts + custom SVG |
| State | Zustand |
| HTTP | Axios |
| Fonts | JetBrains Mono + Inter |

---

## 📄 License

MIT — built with 💚 for the team.
