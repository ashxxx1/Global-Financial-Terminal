import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { X } from "lucide-react";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./styles/index.css";
import "./styles/nexus-theme.css";
import "./index.css";

// ── Terminal UI (pulled from merge) ──────────────────────────────────────────
import { TopBar }       from "./components/Terminal/TopBar";
import { LeftNav }      from "./components/Terminal/LeftNav";
import { Sidebar }      from "./components/Terminal/Sidebar";
import { RightSidebar } from "./components/Terminal/RightSidebar";
import { GlobeVis }     from "./components/Terminal/GlobeVis";
import { GlobalNews }   from "./components/Terminal/GlobalNews";
import { MarketBrief }  from "./components/Terminal/MarketBrief";
import { CountryPanel } from "./components/Terminal/CountryPanel";
import SocialPage from "./pages/Social/SocialPage";
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
import ChartTerminal             from "./components/Charts/ChartTerminal";
import FXDashboard               from "./components/FXDashboard/FXDashboard";
import CorrelationMatrix         from "./components/Correlation/CorrelationMatrix";
import CausalChainMap            from "./components/Terminal/CausalChainMap";
import SignalDesk                from "./components/Terminal/SignalDesk";
import GravityFieldGrid          from "./components/Terminal/GravityFieldGrid";
import ComparePanel              from "./components/Terminal/ComparePanel";

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
    causalChainEventId,
    causalChainEventTitle,
    closeCausalChain,
    scrubStep,
    isScrubPlaying,
    setScrubStep,
    setScrubPlaying,
    compareCountry,
    setCompareCountry,
    closeCompareMode,
  } = useTerminalStore();

  // Time-scrub playback tick
  useEffect(() => {
    let interval = null;
    if (isScrubPlaying) {
      interval = setInterval(() => {
        setScrubStep((scrubStep + 4) % 104);
      }, 350);
    }
    return () => clearInterval(interval);
  }, [isScrubPlaying, scrubStep, setScrubStep]);

  // Mobile sidebar sheet state
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileViewsOpen, setMobileViewsOpen] = useState(false);
  const [timeframe, setTimeframe] = useState("1D");
  const closeMobileSidebar = useCallback(() => setMobileSidebarOpen(false), []);
  const toggleMobileSidebar = useCallback(() => setMobileSidebarOpen((v) => !v), []);

  // Desktop collapsible panel states — start collapsed so globe fills screen
  const [leftCollapsed, setLeftCollapsed] = useState(true);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);

  useEffect(() => {
    if (selectedCountry) {
      if (leftCollapsed) setLeftCollapsed(false);
      if (rightCollapsed) setRightCollapsed(false);
    }
  }, [selectedCountry, leftCollapsed, rightCollapsed]);

  const handleCountryClick = useCallback((country, event) => {
    if (event && event.shiftKey && selectedCountry) {
      if (compareCountry && compareCountry.properties?.ISO_A2 === country.properties?.ISO_A2) {
        closeCompareMode();
      } else {
        setCompareCountry(country);
      }
    } else {
      setSelectedCountry(country);
    }
  }, [selectedCountry, compareCountry, setSelectedCountry, setCompareCountry, closeCompareMode]);

  const anySheetOpen = mobileSidebarOpen || isNewsPanelOpen || isStockPanelOpen;

  return (
    <div className="app-shell nexus">
      <div className="nexus-ambient" aria-hidden="true">
        <div className="nexus-ambient__grid" />
        <div className="nexus-ambient__aurora nexus-ambient__aurora--1" />
        <div className="nexus-ambient__aurora nexus-ambient__aurora--2" />
        <div className="nexus-ambient__aurora nexus-ambient__aurora--3" />
      </div>

      <TopBar currentView={activeView} onSetView={setActiveView} />

      {/* Ticker scrolling strip */}
      <Ticker />

      {/* Left nav — icon sidebar for view switching */}
      <LeftNav currentView={activeView} onSetView={setActiveView} />

      {/* Main content area */}
      <main className="globe-area" style={{ 
        position: "relative", 
        overflow: activeView === "globe" ? "hidden" : "auto",
        touchAction: activeView === "globe" ? "none" : "auto"
      }}>
        {activeView === "globe" ? (
          <div className="flex w-full h-full">
            {/* Left Panel: Market overview & Risk radar OR Country Info */}
            <div className={`sidebar nx-panel nx-scanlines ${mobileSidebarOpen ? "mobile-open" : ""} ${leftCollapsed ? "w-0 border-r-0" : "w-[350px]"} h-full flex flex-col border-r flex-shrink-0 transition-all duration-300 overflow-y-auto`} style={{ borderColor: "var(--nx-border)" }}>
              {selectedCountry ? (
                <CountryLeftPanel country={selectedCountry} onClose={() => setSelectedCountry(null)} timeframe={timeframe} />
              ) : (
                <Sidebar />
              )}
            </div>

            {/* Center Content Space & Bottom Dashboard */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
              {/* Floating Left Sidebar Toggle */}
              <button
                onClick={() => setLeftCollapsed(!leftCollapsed)}
                className="nx-rail-toggle nx-rail-toggle--left"
                title={leftCollapsed ? "Expand Markets" : "Collapse Markets"}
              >
                {leftCollapsed ? "▶" : "◀"}
              </button>

              <button
                onClick={() => setRightCollapsed(!rightCollapsed)}
                className="nx-rail-toggle nx-rail-toggle--right"
                title={rightCollapsed ? "Expand Intelligence" : "Collapse Intelligence"}
              >
                {rightCollapsed ? "◀" : "▶"}
              </button>

              {/* Globe centerpiece container */}
              <div className="flex-1 w-full relative">
                {/* ── Top-left: Atlas View title + Timeframe selector ── */}
                <div
                  className="absolute top-4 left-8 z-20 pointer-events-auto flex items-center gap-3"
                  style={{
                    background: "rgba(10,14,26,0.92)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(212,175,55,0.35)",
                    padding: "6px 14px",
                    borderRadius: "2px",
                    boxShadow: "0 4px 24px rgba(0,0,0,0.6), 0 0 0 1px rgba(212,175,55,0.08)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontStyle: "italic",
                      fontSize: "12px",
                      letterSpacing: "0.04em",
                      color: "#f0e6d2",
                      fontWeight: 500,
                    }}
                  >
                    Atlas View
                  </span>
                  <div style={{ width: "1px", height: "14px", background: "rgba(212,175,55,0.25)" }} />
                  <div
                    className="flex items-center p-0.5 rounded-sm"
                    style={{
                      background: "rgba(5,7,13,0.7)",
                      border: "1px solid rgba(212,175,55,0.18)",
                    }}
                  >
                    {["1D", "1W", "1M", "YTD"].map((tf) => (
                      <button
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className="transition-all cursor-pointer rounded-sm"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "9px",
                          fontWeight: 700,
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          padding: "4px 10px",
                          ...(timeframe === tf
                            ? {
                                background: "#d4af37",
                                color: "#05070d",
                                boxShadow: "0 0 10px rgba(212,175,55,0.4)",
                              }
                            : {
                                background: "transparent",
                                color: "#a89c84",
                              }),
                        }}
                        onMouseEnter={e => {
                          if (timeframe !== tf) {
                            e.currentTarget.style.color = "#f0e6d2";
                            e.currentTarget.style.background = "rgba(212,175,55,0.1)";
                          }
                        }}
                        onMouseLeave={e => {
                          if (timeframe !== tf) {
                            e.currentTarget.style.color = "#a89c84";
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Top-right: AI Market Brief floating card ── */}
                <div className="absolute top-4 right-8 z-20 pointer-events-auto w-72">
                  <MarketBrief />
                </div>

                {/* ── Bottom-center: Panel Toggles ── */}
                <div
                  className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3"
                  style={{
                    background: "rgba(10,14,26,0.96)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    padding: "8px 18px",
                    borderRadius: "2px",
                    boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.06)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "8px",
                      fontWeight: 700,
                      letterSpacing: "0.16em",
                      color: "#5c5546",
                      marginRight: "2px",
                    }}
                  >
                    PANELS
                  </span>
                  {[
                    { on: !leftCollapsed,   icon: "📊", label: "Markets", toggle: () => setLeftCollapsed(!leftCollapsed)   },
                    { on: !rightCollapsed,  icon: "🧠", label: "Intel",   toggle: () => setRightCollapsed(!rightCollapsed) },
                    { on: !bottomCollapsed, icon: "📡", label: "News",    toggle: () => setBottomCollapsed(!bottomCollapsed) },
                  ].map(panel => (
                    <button
                      key={panel.label}
                      onClick={panel.toggle}
                      className="flex items-center gap-2 transition-all cursor-pointer rounded-sm"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "10px",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        padding: "6px 14px",
                        border: panel.on
                          ? "1px solid #f0c84a"
                          : "1px solid rgba(212,175,55,0.2)",
                        background: panel.on
                          ? "#d4af37"
                          : "rgba(212,175,55,0.05)",
                        color: panel.on ? "#05070d" : "#a89c84",
                        boxShadow: panel.on ? "0 0 14px rgba(212,175,55,0.3)" : "none",
                      }}
                    >
                      <span>{panel.icon}</span>
                      <span>{panel.label}</span>
                      <span
                        className="rounded-sm font-bold"
                        style={{
                          fontSize: "7px",
                          padding: "1px 5px",
                          letterSpacing: "0.08em",
                          background: panel.on ? "rgba(5,7,13,0.2)" : "rgba(212,175,55,0.1)",
                          color: panel.on ? "#05070d" : "#6b6354",
                        }}
                      >
                        {panel.on ? "ON" : "OFF"}
                      </span>
                    </button>
                  ))}
                </div>

                {/* ── Bottom-left coordinate watermark ── */}
                <div
                  className="absolute bottom-8 left-8 z-10 pointer-events-none hidden lg:flex items-center gap-1.5"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "8px",
                    letterSpacing: "0.12em",
                    color: "#6b6354",
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" style={{ color: "rgba(212,175,55,0.5)" }}>
                    <path d="M5 0v10M0 5h10" stroke="currentColor" strokeWidth="0.6" />
                  </svg>
                  20.0°N · 0.0°E
                </div>

                {/* ── Bottom-right live status watermark ── */}
                <div
                  className="absolute bottom-8 right-8 z-10 pointer-events-none hidden lg:flex items-center gap-1.5"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "8px",
                    letterSpacing: "0.12em",
                    color: "#6b6354",
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: "#4fd1a5", boxShadow: "0 0 4px #4fd1a5" }}
                  />
                  MERIDIAN · LIVE
                </div>

                {/* ── Globe background ── */}
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    background: "radial-gradient(ellipse 70% 60% at 50% 45%, rgba(22,49,79,0.28) 0%, #05070d 65%)",
                  }}
                >
                  <GlobeVis selectedCountry={selectedCountry} onCountryClick={handleCountryClick} timeframe={timeframe} />
                </div>

                {/* Gravity Field Grid Layer */}
                <GravityFieldGrid />

                {/* Central AI Signal Desk */}
                {selectedCountry && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto">
                    <SignalDesk country={selectedCountry} />
                  </div>
                )}
              </div>
              
              {/* Bottom Panel: Global News */}
              <div className={`hidden md:flex relative nx-panel nx-scanlines ${bottomCollapsed ? "h-[44px]" : "h-[220px]"} w-full border-t flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden`} style={{ borderColor: "var(--nx-border)" }}>
                <GlobalNews isCollapsed={bottomCollapsed} onToggle={() => setBottomCollapsed(!bottomCollapsed)} />
              </div>
            </div>

            {/* Right Panel: Intelligence / Social OR Country Feed */}
            <div className={`hidden md:flex nx-panel nx-scanlines ${rightCollapsed ? "w-0 border-l-0" : "w-[380px]"} h-full flex-col border-l flex-shrink-0 transition-all duration-300 overflow-y-auto`} style={{ borderColor: "var(--nx-border)" }}>
              {selectedCountry ? (
                <CountryRightPanel country={selectedCountry} timeframe={timeframe} />
              ) : (
                <RightSidebar onSetView={setActiveView} />
              )}
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 z-10 flex flex-col w-full h-full overflow-hidden" style={{ background: "var(--nx-void)" }}>
            {activeView === "news"        && <GlobalNews />}
            {activeView === "social"      && <SocialPage />}
            {activeView === "portfolio"   && <PortfolioPanel onClose={() => setActiveView('globe')} />}
            {activeView === "heatmap"     && <div className="nexus-module h-full"><MacroHeatmap /></div>}
            {activeView === "calendar"    && <div className="nexus-module h-full"><EconomicCalendar /></div>}
            {activeView === "fx"          && <div className="nexus-module h-full"><FXDashboard /></div>}
            {activeView === "correlation" && <div className="nexus-module h-full"><CorrelationMatrix /></div>}
            {activeView === "charts"      && <ChartTerminal />}
          </div>
        )}

        {/* Selected Country Panel Overlay */}
        {selectedCountry && (
          <div 
            onClick={() => setSelectedCountry(null)}
            className="absolute inset-0 z-50 flex justify-center items-center bg-black/60 backdrop-blur-sm cursor-pointer md:hidden"
          >
             <div 
               onClick={(e) => e.stopPropagation()}
               className="w-full max-w-[640px] px-4 md:px-0 shadow-[0_0_80px_rgba(30,58,138,0.3)] cursor-default"
             >
                <div className="bg-[#020617]/95 backdrop-blur-xl border border-[#1e293b] overflow-hidden rounded-lg">
                   <CountryPanel country={selectedCountry} onClose={() => setSelectedCountry(null)} timeframe={timeframe} />
                </div>
             </div>
          </div>
        )}

        {causalChainEventId && (
          <CausalChainMap 
            eventId={causalChainEventId} 
            eventTitle={causalChainEventTitle} 
            onClose={closeCausalChain} 
          />
        )}

        {compareCountry && (
          <ComparePanel />
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

      <nav className="mobile-nav nexus-mobile-nav" aria-label="Mobile navigation">
        <button
          className={`mobile-nav__btn${activeView === "globe" ? " active" : ""}`}
          onClick={() => { setActiveView("globe"); setMobileViewsOpen(false); }}
          aria-label="Globe"
        >
          <span className="mobile-nav__btn-icon">🌍</span>
          GLOBE
        </button>

        <button
          className={`mobile-nav__btn${mobileSidebarOpen ? " active" : ""}`}
          style={{ borderLeft: "1px solid rgba(255,255,255,0.04)" }}
          onClick={toggleMobileSidebar}
          aria-label="Markets"
        >
          <span className="mobile-nav__btn-icon">📊</span>
          MARKETS
        </button>

        <button
          className={`mobile-nav__btn${activeView === "news" ? " active" : ""}`}
          style={{ borderRight: "1px solid rgba(255,255,255,0.04)" }}
          onClick={() => { setActiveView("news"); setMobileViewsOpen(false); }}
          aria-label="News"
        >
          <span className="mobile-nav__btn-icon">📡</span>
          NEWS
        </button>

        <button
          className={`mobile-nav__btn${mobileViewsOpen ? " active" : ""}`}
          onClick={() => setMobileViewsOpen(true)}
          aria-label="More views"
        >
          <span className="mobile-nav__btn-icon">☰</span>
          VIEWS
        </button>
      </nav>
      {/* Mobile Views Menu Sheet */}
      {mobileViewsOpen && (
        <div className="fixed inset-0 z-[400] flex flex-col justify-end bg-black/60 backdrop-blur-sm pointer-events-auto" onClick={() => setMobileViewsOpen(false)}>
          <div className="bg-[#080f1e] border-t border-[#1e293b] rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <span className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Terminal Modules</span>
              <button onClick={() => setMobileViewsOpen(false)} className="text-slate-500 hover:text-white p-1 cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 pb-8">
              {[
                { label: "Terminal Map", val: "globe", icon: "🌍" },
                { label: "Candle Charts", val: "charts", icon: "📊" },
                { label: "FX Dashboard", val: "fx", icon: "💱" },
                { label: "Global News", val: "news", icon: "📡" },
                { label: "Social Intel", val: "social", icon: "💬" },
                { label: "Portfolio Dev", val: "portfolio", icon: "💼" },
                { label: "Economic Calendar", val: "calendar", icon: "📅" },
                { label: "Macro Heatmap", val: "heatmap", icon: "🔥" }
              ].map(view => (
                <button
                  key={view.val}
                  onClick={() => {
                    setActiveView(view.val);
                    setMobileViewsOpen(false);
                  }}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${
                    activeView === view.val
                      ? "bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold"
                      : "bg-[#0c1220] border-[#1e293b]/70 text-slate-300 hover:border-slate-700"
                  }`}
                >
                  <span className="text-2xl mb-1.5">{view.icon}</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-center">{view.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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
