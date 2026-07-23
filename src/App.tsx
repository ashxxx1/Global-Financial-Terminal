/**
 * Global Financial Terminal — v1 shell.
 * Fully public: no authentication anywhere. Layout per spec:
 * top nav · content + right rail · bottom live ticker.
 */
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { startCryptoFeed } from "./lib/feeds/crypto";
import { startFxFeed } from "./lib/feeds/fx";
import { startQuakeFeed } from "./lib/feeds/quakes";
import TopNav from "./components/TopNav";
import Ticker from "./components/Ticker";
import RightRail from "./components/RightRail";
import Search from "./components/Search";
import AlertWatcher from "./components/AlertWatcher";
import World from "./pages/World";
import Country from "./pages/Country";
import Markets from "./pages/Markets";
import Stock from "./pages/Stock";
import News from "./pages/News";
import "./styles/theme.css";

function Shell() {
  const { pathname } = useLocation();
  const onWorld = pathname === "/";

  // Boot the live ingest layer once (each feed is an idempotent singleton).
  useEffect(() => {
    startCryptoFeed();
    startFxFeed();
    startQuakeFeed();
  }, []);

  return (
    <div className="shell">
      <div className="ambient" aria-hidden />
      <TopNav />
      <div className="shell-main">
        <main className="shell-content" style={{ overflowY: onWorld ? "hidden" : "auto" }}>
          <Routes>
            <Route path="/" element={<World />} />
            <Route path="/country/:code" element={<Country />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/stock/:symbol" element={<Stock />} />
            <Route path="/news" element={<News />} />
            <Route path="*" element={<World />} />
          </Routes>
        </main>
        <RightRail />
      </div>
      <Ticker />
      <Search />
      <AlertWatcher />
    </div>
  );
}

export default function App() {
  // BASE_URL is "/" at root hosting and "/Global-Financial-Terminal/" on
  // GitHub Pages project sites; the router needs it without a trailing slash.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <BrowserRouter basename={basename || undefined}>
      <Shell />
    </BrowserRouter>
  );
}
