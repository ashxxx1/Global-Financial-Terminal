/**
 * Global Financial Terminal — v1 shell.
 * Fully public: no authentication anywhere. Layout per spec:
 * top nav · content + right rail · bottom live ticker.
 */
import { useEffect, useState, lazy, Suspense } from "react";
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
const Onboarding = lazy(() => import("./components/Onboarding"));
const FeedbackWidget = lazy(() => import("./components/FeedbackWidget"));
const PmfSurvey = lazy(() => import("./components/PmfSurvey"));
const ConsentBanner = lazy(() => import("./components/ConsentBanner"));
import World from "./pages/World";
const Country = lazy(() => import("./pages/Country"));
const Markets = lazy(() => import("./pages/Markets"));
const Stock = lazy(() => import("./pages/Stock"));
const News = lazy(() => import("./pages/News"));
const Changelog = lazy(() => import("./pages/Changelog"));
const DataSources = lazy(() => import("./pages/DataSources"));
import Login from "./pages/Login";
const Landing = lazy(() => import("./pages/Landing"));
import { useAuth, authRequired } from "./lib/auth";
import { useTerminal } from "./store";
import { useWatchlistSync } from "./lib/syncWatchlist";
import { initAnalytics, trackPageview } from "./lib/analytics";
import { onConsentChange } from "./lib/consent";
import "./styles/theme.css";

/** Shown while a lazily-loaded route chunk is in flight. */
function RouteFallback() {
  return (
    <div style={{ padding: 24, display: "grid", gap: 12, maxWidth: 900 }}>
      <div className="skeleton" style={{ height: 26, width: "38%", borderRadius: 6 }} />
      <div className="skeleton" style={{ height: 180, borderRadius: 10 }} />
      <div className="skeleton" style={{ height: 180, borderRadius: 10 }} />
    </div>
  );
}

/** Full-screen boundary for the landing chunk, before any shell exists. */
function BootFallback() {
  return (
    <div className="auth-wrap">
      <div className="auth-aurora" aria-hidden />
      <div style={{ textAlign: "center" }}>
        <div className="skeleton" style={{ width: 190, height: 9, borderRadius: 5, margin: "0 auto 10px" }} />
        <div className="label">LOADING…</div>
      </div>
    </div>
  );
}

function Shell() {
  const { pathname } = useLocation();
  useWatchlistSync();
  useEffect(() => { trackPageview(pathname); }, [pathname]);
  const onWorld = pathname === "/";
  const onboarded = useTerminal((st) => st.onboarded);
  const watchlistEmpty = useTerminal((st) => st.watchlist.length === 0);
  const showOnboarding = !onboarded && watchlistEmpty;

  // Boot the live data layer once. Prefer the hosted ingest backend (unified
  // SSE, server-side keys, history) when VITE_API_URL is set; otherwise run the
  // in-browser feeds. Either way the UI is fully live with no refreshes.
  useEffect(() => {
    if (BACKEND_URL) return connectBackend();
    startCryptoFeed();
    startFxFeed();
    startQuakeFeed();
    return startStockFeed();   // live US equities via /api/quote proxy (prod) or VITE_FINNHUB_API_KEY (dev)
  }, []);

  return (
    <div className="shell">
      <div className="ambient" aria-hidden />
      <TopNav />
      <div className="shell-main">
        <main className="shell-content" style={{ overflowY: onWorld ? "hidden" : "auto" }}>
          <div className="route-fade" key={pathname}>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<World />} />
            <Route path="/country/:code" element={<Country />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/stock/:symbol" element={<Stock />} />
            <Route path="/news" element={<News />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/data-sources" element={<DataSources />} />
            <Route path="*" element={<World />} />
          </Routes>
          </Suspense>
          </div>
        </main>
        <RightRail />
      </div>
      <Ticker />
      <Search />
      <AlertWatcher />
      <Toasts />
      {/* Suppressed during onboarding — a floating feedback button on top of a
          modal the user has not finished competes for the same decision. */}
      {!showOnboarding && (
        <Suspense fallback={null}>
          <FeedbackWidget />
          <PmfSurvey />
        </Suspense>
      )}
      {showOnboarding && (
        <Suspense fallback={null}>
          <Onboarding />
        </Suspense>
      )}
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
  // Anonymous visitors land on the marketing page, not the login form — the
  // pitch comes before the wall. `authView` flips to the form when they act.
  const [authView, setAuthView] = useState<null | "signin" | "signup">(null);
  useEffect(() => {
    initAnalytics();
    init();
    // Boot analytics the moment consent is granted, without a reload.
    return onConsentChange((v) => { if (v === "granted") initAnalytics(); });
  }, [init]);

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
  if (status === "signedIn") return <Shell />;
  if (authView) return <Login initialMode={authView} onBack={() => setAuthView(null)} />;
  return (
    <Suspense fallback={<BootFallback />}>
      <Landing onGetStarted={(mode = "signup") => setAuthView(mode)} />
    </Suspense>
  );
}

export default function App() {
  // BASE_URL is "/" at root hosting and "/Global-Financial-Terminal/" on
  // GitHub Pages project sites; the router needs it without a trailing slash.
  const basename = import.meta.env.BASE_URL.replace(/\/$/, "");
  return (
    <BrowserRouter basename={basename || undefined}>
      <Gate />
      <Suspense fallback={null}>
        <ConsentBanner />
      </Suspense>
    </BrowserRouter>
  );
}
