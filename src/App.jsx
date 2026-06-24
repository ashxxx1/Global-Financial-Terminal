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
import { MarketBrief }  from "./components/Terminal/MarketBrief";
import { CountryPanel } from "./components/Terminal/CountryPanel";
import { SocialModule } from "./components/Terminal/SocialModule";
import PortfolioPanel   from "./components/Terminal/PortfolioPanel";
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

  // Desktop collapsible panel states — start collapsed so globe fills screen
  const [leftCollapsed, setLeftCollapsed] = useState(true);
  const [rightCollapsed, setRightCollapsed] = useState(true);
  const [bottomCollapsed, setBottomCollapsed] = useState(true);

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
          <div className="flex w-full h-full">
            {/* Left Panel: Market overview & Risk radar */}
            <div className={`sidebar ${mobileSidebarOpen ? "mobile-open" : ""} ${leftCollapsed ? "w-0 border-r-0" : "w-[280px]"} h-full flex flex-col border-r border-indigo-500/10 glass-panel flex-shrink-0 transition-all duration-300 overflow-hidden shadow-[40px_0_100px_rgba(0,0,0,0.5)]`}>
              <Sidebar />
            </div>

            {/* Center Content Space & Bottom Dashboard */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative">
              {/* Floating Left Sidebar Toggle */}
              <button 
                onClick={() => setLeftCollapsed(!leftCollapsed)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-30 w-5 h-16 bg-[#0c1220]/95 border border-l-0 border-[#1e293b]/70 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-r flex items-center justify-center cursor-pointer transition-colors shadow-2xl"
                title={leftCollapsed ? "Expand Markets" : "Collapse Markets"}
              >
                <span className="text-[10px] font-bold">{leftCollapsed ? "▶" : "◀"}</span>
              </button>

              {/* Floating Right Sidebar Toggle */}
              <button 
                onClick={() => setRightCollapsed(!rightCollapsed)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-30 w-5 h-16 bg-[#0c1220]/95 border border-r-0 border-[#1e293b]/70 hover:border-indigo-500 text-indigo-400 hover:text-white rounded-l flex items-center justify-center cursor-pointer transition-colors shadow-2xl"
                title={rightCollapsed ? "Expand Intelligence" : "Collapse Intelligence"}
              >
                <span className="text-[10px] font-bold">{rightCollapsed ? "◀" : "▶"}</span>
              </button>

              {/* Globe centerpiece container */}
              <div className="flex-1 w-full relative">
                {/* Floating Workspace & Control Overlay */}
                {/* Top-left: View title & Timeframe */}
                <div className="absolute top-4 left-8 z-20 pointer-events-auto flex items-center gap-3 bg-[#080f1e]/90 backdrop-blur-md border border-[#1e293b] px-4 py-2 rounded-lg shadow-2xl">
                  <span className="font-bold text-[11px] text-white tracking-widest">🌍 GLOBAL MARKET MAP</span>
                  <div className="h-4 w-px bg-slate-700" />
                  <div className="flex items-center bg-black/40 border border-white/10 p-0.5 rounded">
                    {["1D", "1W", "1M", "YTD"].map((tf) => (
                      <button 
                        key={tf}
                        onClick={() => setTimeframe(tf)}
                        className={`px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-wider rounded transition-all cursor-pointer ${timeframe === tf ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                        {tf}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bottom-center: Panel Toggles — large, clearly labeled */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center gap-3 bg-[#080f1e]/95 backdrop-blur-xl border border-[#1e293b] px-5 py-2.5 rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.8)]">
                  <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mr-1">PANELS</span>
                  
                  <button
                    onClick={() => setLeftCollapsed(!leftCollapsed)}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all border cursor-pointer flex items-center gap-2 ${
                      !leftCollapsed 
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                        : 'bg-white/5 text-slate-400 border-white/10 hover:border-indigo-500/50 hover:text-indigo-300'
                    }`}
                  >
                    📊 <span>Markets</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${!leftCollapsed ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-500'}`}>
                      {leftCollapsed ? 'OFF' : 'ON'}
                    </span>
                  </button>

                  <button
                    onClick={() => setRightCollapsed(!rightCollapsed)}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all border cursor-pointer flex items-center gap-2 ${
                      !rightCollapsed 
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                        : 'bg-white/5 text-slate-400 border-white/10 hover:border-indigo-500/50 hover:text-indigo-300'
                    }`}
                  >
                    🧠 <span>Intel</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${!rightCollapsed ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-500'}`}>
                      {rightCollapsed ? 'OFF' : 'ON'}
                    </span>
                  </button>

                  <button
                    onClick={() => setBottomCollapsed(!bottomCollapsed)}
                    className={`px-4 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all border cursor-pointer flex items-center gap-2 ${
                      !bottomCollapsed 
                        ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]' 
                        : 'bg-white/5 text-slate-400 border-white/10 hover:border-indigo-500/50 hover:text-indigo-300'
                    }`}
                  >
                    📡 <span>News</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${!bottomCollapsed ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-500'}`}>
                      {bottomCollapsed ? 'OFF' : 'ON'}
                    </span>
                  </button>
                </div>

                <div className="absolute inset-0 z-0 bg-[#020617] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-[#020617] to-[#020617]">
                  <GlobeVis onCountryClick={setSelectedCountry} timeframe={timeframe} />
                </div>
              </div>
              
              {/* Bottom Panel: AI Brief + Global News */}
              <div className={`hidden md:flex relative ${bottomCollapsed ? "h-[44px]" : "h-auto max-h-[320px]"} w-full border-t border-indigo-500/10 glass-panel flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden shadow-[0_-40px_100px_rgba(0,0,0,0.5)]`}>
                {!bottomCollapsed && (
                  <div className="p-3 border-b border-white/5">
                    <MarketBrief />
                  </div>
                )}
                <GlobalNews isCollapsed={bottomCollapsed} onToggle={() => setBottomCollapsed(!bottomCollapsed)} />
              </div>
            </div>

            {/* Right Panel: Intelligence / Social */}
            <div className={`hidden md:flex ${rightCollapsed ? "w-0 border-l-0" : "w-[320px]"} h-full flex-col border-l border-indigo-500/10 glass-panel flex-shrink-0 transition-all duration-300 overflow-hidden shadow-[-40px_0_100px_rgba(0,0,0,0.5)]`}>
              <RightSidebar onSetView={setActiveView} />
            </div>
          </div>
        ) : (
          <>
            {activeView === "news"        && <GlobalNews />}
            {activeView === "social"      && <SocialModule />}
            {activeView === "portfolio"   && <PortfolioPanel onClose={() => setActiveView('globe')} />}
            {activeView === "heatmap"     && <MacroHeatmap />}
            {activeView === "calendar"    && <EconomicCalendar />}
            {activeView === "fx"          && <FXDashboard />}
            {activeView === "correlation" && <CorrelationMatrix />}
          </>
        )}

        {/* Selected Country Panel Overlay */}
        {selectedCountry && (
          <div 
            onClick={() => setSelectedCountry(null)}
            className="absolute inset-0 z-50 flex justify-center items-center bg-black/60 backdrop-blur-sm cursor-pointer"
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
