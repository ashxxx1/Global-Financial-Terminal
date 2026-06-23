import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./styles/index.css";
import "./index.css";

// ── Terminal UI (pulled from merge) ──────────────────────────────────────────
import { TopBar }       from "./components/Terminal/TopBar";
import { LeftNav }      from "./components/Terminal/LeftNav";
import { Sidebar }      from "./components/Terminal/Sidebar";
import { RightSidebar } from "./components/Terminal/RightSidebar";
import { GlobeVis }     from "./components/Terminal/GlobeVis";
import { GlobalNews }   from "./components/Terminal/GlobalNews";
import { CountryPanel } from "./components/Terminal/CountryPanel";
import { SocialModule } from "./components/Terminal/SocialModule";
import PortfolioPanel   from "./components/Terminal/PortfolioPanel";

// ── Global overlays ──────────────────────────────────────────────────────────
import StockPanel               from "./components/StockPanel/StockPanel";
import "./components/StockPanel/StockPanel.css";
import { AlertSystem, AlertPanel } from "./components/Alerts/AlertSystem";
import CommandPalette            from "./components/CommandPalette/CommandPalette";
import MacroHeatmap              from "./components/MacroHeatmap/MacroHeatmap";
import EconomicCalendar          from "./components/EconomicCalendar/EconomicCalendar";
import CorrelationMatrix         from "./components/Correlation/CorrelationMatrix";
import FXDashboard               from "./components/FXDashboard/FXDashboard";

// ── Pages ────────────────────────────────────────────────────────────────────
import LoginPage      from "./pages/LoginPage";
import PendingPage    from "./pages/PendingPage";
import RejectedPage   from "./pages/RejectedPage";
import AdminPanel     from "./pages/AdminPanel";
import SetupUsername  from "./pages/SetupUsername";

// ── State ────────────────────────────────────────────────────────────────────
import useTerminalStore from "./store/terminalStore";

// ─────────────────────────────────────────────────────────────────────────────
// Main Terminal Application
// ─────────────────────────────────────────────────────────────────────────────
function TerminalApp() {
  const {
    activeView,
    setActiveView,
    selectedCountry,
    isNewsPanelOpen,
    closeNewsPanel,
    selectedStock,
    isStockPanelOpen,
    closeStockPanel,
    alertPanelOpen,
    setAlertPanelOpen,
  } = useTerminalStore();

  // Mobile sidebar sheet state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setMobileSidebarOpen((v) => !v), []);

  const anySheetOpen = mobileSidebarOpen || isNewsPanelOpen || isStockPanelOpen;

  return (
    <div className="app-shell">
      {/* Top bar — header with nav, search, alerts, user */}
      <TopBar currentView={activeView} onSetView={setActiveView} />

      {/* Left nav — icon sidebar for view switching */}
      <LeftNav currentView={activeView} onSetView={setActiveView} />

      {/* Left data sidebar — indices, watchlist */}
      <Sidebar />

      {/* Main content area — Globe / Heatmap / Calendar / Portfolio / FX / Correlation */}
      <main className="globe-area" style={{ position: "relative", overflow: "hidden" }}>
        {activeView === "globe"       && <GlobeVis />}
        {activeView === "news"        && <GlobalNews />}
        {activeView === "social"      && <SocialModule />}
        {activeView === "portfolio"   && <PortfolioPanel />}
        {activeView === "heatmap"     && <MacroHeatmap />}
        {activeView === "calendar"    && <EconomicCalendar />}
        {activeView === "fx"          && <FXDashboard />}
        {activeView === "correlation" && <CorrelationMatrix />}

        {/* Country detail panel (slides over globe on country click) */}
        {isNewsPanelOpen && selectedCountry && (
          <CountryPanel country={selectedCountry} onClose={closeNewsPanel} />
        )}
      </main>

      {/* Right sidebar — intelligence feed */}
      <RightSidebar />

      {/* Stock detail panel */}
      {isStockPanelOpen && selectedStock && (
        <StockPanel stock={selectedStock} onClose={closeStockPanel} />
      )}

      {/* Alert panel */}
      {alertPanelOpen && (
        <AlertPanel onClose={() => setAlertPanelOpen(false)} />
      )}

      {/* Background alert watcher */}
      <AlertSystem />

      {/* ── Mobile-only: backdrop + bottom nav ─────────────────────────── */}
      <div
        className={`mobile-backdrop${anySheetOpen ? " visible" : ""}`}
        onClick={() => {
          closeMobileSidebar();
          if (isNewsPanelOpen) closeNewsPanel();
          if (isStockPanelOpen) closeStockPanel();
        }}
      />

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button
          className={`mobile-nav__btn${activeView === "globe" ? " active" : ""}`}
          onClick={() => setActiveView("globe")}
          aria-label="Globe"
        >
          <span className="mobile-nav__btn-icon">🌍</span>
          GLOBE
        </button>

        <button
          className={`mobile-nav__btn${mobileSidebarOpen ? " active" : ""}`}
          style={{ borderLeft: "1px solid rgba(255,255,255,0.04)", borderRight: "1px solid rgba(255,255,255,0.04)" }}
          onClick={toggleMobileSidebar}
          aria-label="Markets"
        >
          <span className="mobile-nav__btn-icon">📊</span>
          MARKETS
        </button>

        <button
          className={`mobile-nav__btn${activeView === "news" ? " active" : ""}`}
          onClick={() => setActiveView("news")}
          aria-label="News"
        >
          <span className="mobile-nav__btn-icon">📡</span>
          NEWS
        </button>
      </nav>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root App with Router
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Command palette lives outside Routes so it works app-wide */}
        <CommandPalette />

        <Routes>
          {/* ── Public / Auth pages ── */}
          <Route path="/login"          element={<LoginPage />} />
          <Route path="/pending"        element={<PendingPage />} />
          <Route path="/rejected"       element={<RejectedPage />} />

          {/* ── Username setup (after first Google login + approval) ── */}
          <Route path="/setup-username" element={<SetupUsername />} />

          {/* ── Admin panel ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* ── Legacy forum redirect ── */}
          <Route path="/forum/*" element={<Navigate to="/social" replace />} />

          {/* ── Main terminal (all other paths) ── */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <TerminalApp />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
