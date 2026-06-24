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
import { CountryLeftPanel } from "./components/Terminal/CountryLeftPanel";
import { CountryRightPanel } from "./components/Terminal/CountryRightPanel";
import Ticker           from "./components/Ticker/Ticker";
import Footer           from "./components/Footer/Footer";

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
    setSelectedCountry,
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
  const [timeframe, setTimeframe] = useState("1D");
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setMobileSidebarOpen((v) => !v), []);

  const anySheetOpen = mobileSidebarOpen || isNewsPanelOpen || isStockPanelOpen;

  return (
    <div className="app-shell">
      {/* Top bar — header with nav, search, alerts, user */}
      <TopBar currentView={activeView} onSetView={setActiveView} />

      {/* Ticker scrolling strip */}
      <Ticker />

      {/* Left nav — icon sidebar for view switching */}
      <LeftNav currentView={activeView} onSetView={setActiveView} />

      {/* Main content area */}
      <main className="globe-area" style={{ position: "relative", overflow: "hidden" }}>
        {activeView === "globe" ? (
          <>
            {/* Globe is the omnipresent centerpiece */}
            <div className="absolute inset-0 z-0 bg-[#020617] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-[#020617] to-[#020617]">
              <GlobeVis selectedCountry={selectedCountry} onCountryClick={setSelectedCountry} timeframe={timeframe} />
            </div>

            {/* Glassmorphism Overlays */}
            <div className="absolute inset-0 z-10 flex pointer-events-none w-full h-full">
              
              {/* Left Panel: Market overview & Risk radar */}
              <div className={`sidebar ${mobileSidebarOpen ? "mobile-open" : ""} w-[350px] h-full flex flex-col border-r border-indigo-500/10 glass-panel pointer-events-auto flex-shrink-0 shadow-[40px_0_100px_rgba(0,0,0,0.5)] overflow-y-auto`}>
                {selectedCountry ? (
                  <CountryLeftPanel country={selectedCountry} onClose={() => setSelectedCountry(null)} timeframe={timeframe} />
                ) : (
                  <Sidebar />
                )}
              </div>

              {/* Center Content Space & Bottom Dashboard */}
              <div className="flex-1 flex flex-col min-w-0 h-full relative">
                <div className="flex-1 w-full pointer-events-none flex flex-col justify-end">
                    <div className="w-full flex justify-center mb-6 pointer-events-auto">
                      <div className="flex items-center bg-[#0c1220]/90 backdrop-blur-md border border-[#1e293b] p-1 rounded shadow-2xl">
                        {["1D", "1W", "1M", "YTD"].map((tf) => (
                            <button 
                              key={tf}
                              onClick={() => setTimeframe(tf)}
                              className={`px-4 py-1.5 text-[11px] font-bold font-mono uppercase tracking-widest rounded transition-colors cursor-pointer ${timeframe === tf ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                            >
                              {tf}
                            </button>
                        ))}
                      </div>
                    </div>
                </div> 
                
                {/* Bottom Panel: Global News / Flows */}
                <div className="hidden md:flex relative h-[240px] w-full border-t border-indigo-500/10 glass-panel pointer-events-auto flex-shrink-0 flex flex-col shadow-[0_-40px_100px_rgba(0,0,0,0.5)]">
                  <GlobalNews />
                </div>
              </div>

              {/* Right Panel: Intelligence / Social */}
              <div className="hidden md:flex w-[380px] h-full flex-col border-l border-indigo-500/10 glass-panel pointer-events-auto flex-shrink-0 shadow-[-40px_0_100px_rgba(0,0,0,0.5)] overflow-y-auto">
                {selectedCountry ? (
                  <CountryRightPanel country={selectedCountry} timeframe={timeframe} />
                ) : (
                  <RightSidebar onSetView={setActiveView} />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 z-10 flex flex-col w-full h-full bg-[#020617] overflow-hidden">
            {activeView === "news"        && <GlobalNews />}
            {activeView === "social"      && <SocialModule />}
            {activeView === "portfolio"   && <PortfolioPanel onClose={() => setActiveView('globe')} />}
            {activeView === "heatmap"     && <MacroHeatmap />}
            {activeView === "calendar"    && <EconomicCalendar />}
            {activeView === "fx"          && <FXDashboard />}
            {activeView === "correlation" && <CorrelationMatrix />}
          </div>
        )}

        {/* Selected Country Panel Overlay */}
        {selectedCountry && (
          <div className="absolute inset-0 z-50 pointer-events-none flex justify-center items-center bg-black/50 backdrop-blur-sm md:hidden">
             <div className="pointer-events-auto w-full max-w-[640px] px-4 md:px-0 shadow-[0_0_80px_rgba(30,58,138,0.3)]">
               <div className="bg-[#020617]/95 backdrop-blur-xl border border-[#1e293b] overflow-hidden rounded-lg">
                  <CountryPanel country={selectedCountry} onClose={() => setSelectedCountry(null)} timeframe={timeframe} />
               </div>
             </div>
          </div>
        )}
      </main>

      {/* Footer — disclaimer strip at bottom */}
      <Footer />

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
