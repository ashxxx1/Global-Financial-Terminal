/**
 * Global Financial Terminal — v1 shell.
 * Fully public: no authentication anywhere. Layout per spec:
 * top nav · content + right rail · bottom live ticker.
 */
import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { startCryptoFeed } from "./lib/feeds/crypto";
import { startFxFeed } from "./lib/feeds/fx";
import { startQuakeFeed } from "./lib/feeds/quakes";
import { startStockFeed } from "./lib/feeds/stocks";
import { startIntlFeed } from "./lib/feeds/intlLive";
import { connectBackend, BACKEND_URL } from "./lib/feeds/backend";
import TopNav from "./components/TopNav";
import Ticker from "./components/Ticker";
import RightRail from "./components/RightRail";
import EnvBanner from "./components/EnvBanner";

import AlertWatcher from "./components/AlertWatcher";

const Search = lazy(() => import("./components/Search"));
const ContextMenu = lazy(() => import("./components/ContextMenu"));
const ResearchPanel = lazy(() => import("./components/research/ResearchPanel"));
const Toasts = lazy(() => import("./components/Toasts"));
const Onboarding = lazy(() => import("./components/Onboarding"));
const FeedbackWidget = lazy(() => import("./components/FeedbackWidget"));
const PmfSurvey = lazy(() => import("./components/PmfSurvey"));
const ConsentBanner = lazy(() => import("./components/ConsentBanner"));
const ProductTour = lazy(() => import("./components/ProductTour"));
import World from "./pages/World";
const Country = lazy(() => import("./pages/Country"));
const Markets = lazy(() => import("./pages/Markets"));
const Stock = lazy(() => import("./pages/Stock"));
const Compare = lazy(() => import("./pages/Compare"));
const Sector = lazy(() => import("./pages/Sector"));
const News = lazy(() => import("./pages/News"));
const Changelog = lazy(() => import("./pages/Changelog"));
const DataSources = lazy(() => import("./pages/DataSources"));
const SignalsPage = lazy(() => import("./pages/signals/SignalsPage"));
const SignalDetailPage = lazy(() => import("./pages/signals/SignalDetailPage"));
const SignalHistoryPage = lazy(() => import("./pages/signals/SignalHistoryPage"));
const SignalPerformancePage = lazy(() => import("./pages/signals/SignalPerformancePage"));
const SignalCalendarPage = lazy(() => import("./pages/signals/SignalCalendarPage"));
const SignalMethodologyPage = lazy(() => import("./pages/signals/SignalMethodologyPage"));
const SignalBacktestPage = lazy(() => import("./pages/signals/SignalBacktestPage"));
const SignalTrackRecordPage = lazy(() => import("./pages/signals/SignalTrackRecordPage"));
const Forum = lazy(() => import("./pages/Forum"));
const ForumPost = lazy(() => import("./pages/ForumPost"));
const UserProfilePage = lazy(() => import("./pages/UserProfile"));
const Glossary = lazy(() => import("./pages/Glossary"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
import Login from "./pages/Login";
const Landing = lazy(() => import("./pages/Landing"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Calendar = lazy(() => import("./pages/Calendar"));
const Instrument = lazy(() => import("./pages/Instrument"));

const ResearchWorkspace = lazy(() => import("./components/research/Workspace"));
const ImpactCopilot = lazy(() => import("./pages/ImpactCopilot"));

const Macro = lazy(() => import("./pages/Macro"));
import { useAuth, authRequired } from "./lib/auth";
import { useTerminal } from "./store";
import { useWatchlistSync } from "./lib/syncWatchlist";
import { initAnalytics, trackPageview } from "./lib/analytics";
import { onConsentChange } from "./lib/consent";
import "./styles/theme.css";
import "./styles/research.css";
import "./styles/workspace.css";
import "./styles/impact.css";

function ProfileRedirect() {
  const user = useAuth((s) => s.user);
  if (user) return <Navigate to={`/user/${user.uid}`} replace />;
  return <Navigate to="/forum" replace />;
}

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
  /**
   * The research workspace carries its own rail and timeline and needs the full
   * content width. Rendering the shell's rail beside it squeezed the timeline
   * to unreadable and duplicated the watchlist the workspace already covers.
   */
  const onResearch = pathname.startsWith("/research/") || pathname.startsWith("/impact");
  const onboarded = useTerminal((st) => st.onboarded);
  const nerdMode = useTerminal((st) => st.nerdMode);
  const highDensity = useTerminal((st) => st.highDensity);
  useEffect(() => {
    document.body.classList.toggle("nerd", nerdMode);
  }, [nerdMode]);
  useEffect(() => {
    document.body.classList.toggle("high-density", highDensity);
  }, [highDensity]);
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
    const stopStocks = startStockFeed();   // live US equities via /api/quote
    const stopIntl = startIntlFeed();      // non-US local-exchange prices via /api/intl-quotes
    return () => { stopStocks(); stopIntl(); };
  }, []);

  return (
    <div className="shell">
      <div className="ambient" aria-hidden />
      <EnvBanner />
      <TopNav />
      <div className="shell-main">
        <main className="shell-content" style={{ overflowY: onWorld ? "hidden" : "auto" }}>
          <div className="route-fade" key={pathname}>
          <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<World />} />
            <Route path="/country/:code" element={<Country />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/calendar" element={<Calendar />} />
            {/* Programmatic instrument pages — growth-plan items 92, 93, 94. */}
            <Route path="/index/:slug" element={<Instrument kind="index" />} />
            <Route path="/fx/:slug" element={<Instrument kind="fx" />} />
            <Route path="/crypto/:slug" element={<Instrument kind="crypto" />} />


            <Route path="/research/:symbol" element={<ResearchWorkspace />} />
            <Route path="/impact" element={<ImpactCopilot />} />

            <Route path="/stock/:symbol" element={<Stock />} />
            <Route path="/macro" element={<Macro />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/compare/:a" element={<Compare />} />
            <Route path="/compare/:a/:b" element={<Compare />} />
            <Route path="/sector/:slug" element={<Sector />} />
            <Route path="/news" element={<News />} />
            <Route path="/terminal/signals" element={<SignalsPage />} />
            <Route path="/terminal/signals/history" element={<SignalHistoryPage />} />
            <Route path="/terminal/signals/performance" element={<SignalPerformancePage />} />
            <Route path="/terminal/signals/calendar" element={<SignalCalendarPage />} />
            <Route path="/terminal/signals/methodology" element={<SignalMethodologyPage />} />
            <Route path="/terminal/signals/backtest" element={<SignalBacktestPage />} />
            <Route path="/terminal/signals/:id" element={<SignalDetailPage />} />
            <Route path="/signals" element={<SignalsPage />} />
            <Route path="/signals/track-record" element={<SignalTrackRecordPage />} />
            <Route path="/signals/history" element={<SignalHistoryPage />} />
            <Route path="/signals/performance" element={<SignalPerformancePage />} />
            <Route path="/signals/:id" element={<SignalDetailPage />} />
            <Route path="/changelog" element={<Changelog />} />
            <Route path="/data-sources" element={<DataSources />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/post/:postId" element={<ForumPost />} />
            <Route path="/user/:uid" element={<UserProfilePage />} />
            <Route path="/profile" element={<ProfileRedirect />} />
            <Route path="/glossary" element={<Glossary />} />
            <Route path="/glossary/:slug" element={<Glossary />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<World />} />
          </Routes>
          </Suspense>
          </div>
        </main>
        {!onResearch && <RightRail />}
      </div>
      <Ticker />
      <Suspense fallback={null}>
        <Search />
        <ContextMenu />
        <ResearchPanel />
        <Toasts />
      </Suspense>
      <AlertWatcher />
      {/* Suppressed during onboarding — a floating feedback button on top of a
          modal the user has not finished competes for the same decision. */}
      {!showOnboarding && (
        <Suspense fallback={null}>
          <FeedbackWidget />
          <PmfSurvey />
          <ProductTour autoStart={onWorld} />
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
