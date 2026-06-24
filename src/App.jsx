import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./styles/index.css";
import "./index.css";

// Premium Integrated UI Components
import { TopBar } from "./components/Terminal/TopBar";
import { LeftNav } from "./components/Terminal/LeftNav";
import { Sidebar } from "./components/Terminal/Sidebar";
import { RightSidebar } from "./components/Terminal/RightSidebar";
import { GlobeVis } from "./components/Terminal/GlobeVis";
import { GlobalNews } from "./components/Terminal/GlobalNews";
import { CountryPanel } from "./components/Terminal/CountryPanel";
import { SocialModule } from "./components/Terminal/SocialModule";
import PortfolioPanel from "./components/Terminal/PortfolioPanel";

// Global Alerts & Stock panels
import StockPanel from "./components/StockPanel/StockPanel";
import "./components/StockPanel/StockPanel.css";
import { AlertSystem, AlertPanel } from "./components/Alerts/AlertSystem";
import CommandPalette from "./components/CommandPalette/CommandPalette";

// Overlays
import MacroHeatmap from "./components/MacroHeatmap/MacroHeatmap";
import EconomicCalendar from "./components/EconomicCalendar/EconomicCalendar";
import CorrelationMatrix from "./components/Correlation/CorrelationMatrix";
import FXDashboard from "./components/FXDashboard/FXDashboard";

// State
import useTerminalStore from "./store/terminalStore";
import LoginPage from "./pages/LoginPage";
import PendingPage from "./pages/PendingPage";
import RejectedPage from "./pages/RejectedPage";
import AdminPanel from "./pages/AdminPanel";
import SetupUsername from "./pages/SetupUsername";

function OverlayViews() {
  const { activeView, setActiveView } = useTerminalStore();
  if (activeView === "globe" || activeView === "home" || activeView === "social" || activeView === "portfolio") return null;
  const onClose = () => setActiveView("globe");
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div className="bg-[#020617] border border-[#1e293b] rounded-lg p-6 max-w-4xl w-full max-h-[85vh] overflow-y-auto relative shadow-2xl">
        {activeView === "heatmap" && <MacroHeatmap onClose={onClose} />}
        {activeView === "calendar" && <EconomicCalendar onClose={onClose} />}
        {activeView === "correlation" && <CorrelationMatrix onClose={onClose} />}
        {activeView === "fx" && <FXDashboard onClose={onClose} />}
      </div>
    </div>
  );
}

function TerminalApp() {
  const { activeView, setActiveView, selectedCountry, setSelectedCountry } = useTerminalStore();
  const [timeframe, setTimeframe] = useState("1D");
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/social") {
      setActiveView("social");
    } else if (location.pathname === "/") {
      setActiveView("globe");
    }
  }, [location.pathname, setActiveView]);

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-[#030712] font-sans text-slate-100 selection:bg-indigo-500/30">
      {/* Top Navigation */}
      <TopBar currentView={activeView} onSetView={setActiveView} />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Leftmost Navigation */}
        <LeftNav currentView={activeView} onSetView={setActiveView} />

        <main className="relative flex-1 flex min-w-0 bg-transparent overflow-hidden">
          {activeView === 'globe' || activeView === 'home' || activeView === 'markets' ? (
            <>
              {/* Globe is the omnipresent centerpiece */}
              <div className="absolute inset-0 z-0 bg-[#020617] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-[#020617] to-[#020617]">
                <GlobeVis onCountryClick={setSelectedCountry} timeframe={timeframe} />
              </div>

              {/* Glassmorphism Overlays */}
              <div className="absolute inset-0 z-10 flex pointer-events-none w-full h-full">
                
                {/* Left Panel: Market overview & Risk radar */}
                <div className="w-[300px] h-full flex flex-col border-r border-indigo-500/10 glass-panel pointer-events-auto flex-shrink-0 shadow-[40px_0_100px_rgba(0,0,0,0.5)]">
                  <Sidebar />
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
                  <div className="relative h-[240px] w-full border-t border-indigo-500/10 glass-panel pointer-events-auto flex-shrink-0 flex flex-col shadow-[0_-40px_100px_rgba(0,0,0,0.5)]">
                    <GlobalNews />
                  </div>
                </div>

                {/* Right Panel: Intelligence / Social */}
                <div className="w-[360px] h-full flex flex-col border-l border-indigo-500/10 glass-panel pointer-events-auto flex-shrink-0 shadow-[-40px_0_100px_rgba(0,0,0,0.5)]">
                  <RightSidebar onSetView={setActiveView} />
                </div>
              </div>
            </>
          ) : activeView === 'social' ? (
             <div className="flex-1 flex overflow-hidden h-full">
               <SocialModule />
             </div>
          ) : activeView === 'portfolio' ? (
             <div className="flex-1 flex overflow-hidden h-full bg-[#010409]">
                <PortfolioPanel onClose={() => setActiveView('globe')} />
             </div>
          ) : null}
        </main>

        {/* Selected Country Panel Overlay */}
        {(activeView === 'globe' || activeView === 'home' || activeView === 'markets') && selectedCountry && (
          <div className="absolute inset-0 z-50 pointer-events-none flex justify-center items-center bg-black/50 backdrop-blur-sm">
             <div className="pointer-events-auto w-[640px] shadow-[0_0_80px_rgba(30,58,138,0.3)]">
               <div className="bg-[#020617]/95 backdrop-blur-xl border border-[#1e293b] overflow-hidden rounded-lg">
                  <CountryPanel country={selectedCountry} onClose={() => setSelectedCountry(null)} timeframe={timeframe} />
               </div>
             </div>
          </div>
        )}
      </div>

      {/* Global Panels / Overlays */}
      <OverlayViews />
      <StockPanel />
      <AlertSystem />
      <AlertPanel />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CommandPalette />
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/rejected" element={<RejectedPage />} />
          <Route path="/setup-username" element={<SetupUsername />} />

          {/* Admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Forum — legacy redirect to social */}
          <Route path="/forum/*" element={<Navigate to="/social" replace />} />
          
          {/* Social direct route */}
          <Route
            path="/social"
            element={
              <ProtectedRoute>
                <TerminalApp />
              </ProtectedRoute>
            }
          />

          {/* Main terminal */}
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
