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
import { startStockFeed } from "./lib/feeds/stocks";
import { connectBackend, BACKEND_URL } from "./lib/feeds/backend";
import TopNav from "./components/TopNav";
import Ticker from "./components/Ticker";
import RightRail from "./components/RightRail";
import Search from "./components/Search";
import AlertWatcher from "./components/AlertWatcher";
import Toasts from "./components/Toasts";
import World from "./pages/World";
import Country from "./pages/Country";
import Markets from "./pages/Markets";
import Stock from "./pages/Stock";
import News from "./pages/News";
import Login from "./pages/Login";
import { useAuth, authRequired } from "./lib/auth";
import { useWatchlistSync } from "./lib/syncWatchlist";
import "./styles/theme.css";

function Shell() {
  const { pathname } = useLocation();
  useWatchlistSync();
  const onWorld = pathname === "/";

  // Boot the live data layer once. Prefer the hosted ingest backend (unified
  // SSE, server-side keys, history) when VITE_API_URL is set; otherwise run the
  // in-browser feeds. Either way the UI is fully live with no refreshes.
  useEffect(() => {
    if (BACKEND_URL) return connectBackend();
    startCryptoFeed();
    startFxFeed();
    startQuakeFeed();
    return startStockFeed();   // live US equities when VITE_FINNHUB_API_KEY is set (else no-op)
  }, []);

  return (
    <div className="shell">
      <div className="ambient" aria-hidden />
      <TopNav />
      <div className="shell-main">
        <main className="shell-content" style={{ overflowY: onWorld ? "hidden" : "auto" }}>
          <div className="route-fade" key={pathname}>
          <Routes>
            <Route path="/" element={<World />} />
            <Route path="/country/:code" element={<Country />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/stock/:symbol" element={<Stock />} />
            <Route path="/news" element={<News />} />
            <Route path="*" element={<World />} />
          </Routes>
          </div>
        </main>
        <RightRail />
      </div>
      <Ticker />
      <Search />
      <AlertWatcher />
      <Toasts />
    </div>
  );
}

/**
 * Auth gate. Visitors land on the sign-in screen; the terminal only mounts
 * once there is a session.
 *
 * When Firebase is not configured `authRequired()` is false, so a fresh clone
 * still boots straight into the app instead of a login nobody can pass.
 */
function Gate() {
  const status = useAuth((s) => s.status);
  const init = useAuth((s) => s.init);
  useEffect(() => { init(); }, [init]);

  if (!authRequired()) return <Shell />;

  if (status === "loading") {
    return (
      <div className="auth-wrap">
        <div className="auth-aurora" aria-hidden />
        <div style={{ textAlign: "center" }}>
          <div className="skeleton" style={{ width: 190, height: 9, borderRadius: 5, margin: "0 auto 10px" }} />
          <div className="label">RESTORING SESSION…</div>
        </div>
      </div>
    );
  }
  return status === "signedIn" ? <Shell /> : <Login />;
}

export default function App() {
  // BASE_URL is "/" at root hosting and "/Global-Financial-Terminal/" on
  // GitHub Pages project sites; the router needs it without a trailing slash.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <BrowserRouter basename={basename || undefined}>
      <Gate />
    </BrowserRouter>
  );
}
