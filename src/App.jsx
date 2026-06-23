import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import Footer from "./components/Footer/Footer";
import useTerminalStore from "./store/terminalStore";

function TerminalApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isNewsPanelOpen, closeNewsPanel } = useTerminalStore();

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);

  const anySheetOpen = sidebarOpen || isNewsPanelOpen;

  return (
    <div className="app-shell">
      <Header />
      <Ticker />
      <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
      <GlobeArea />
      <Footer />

      {/* ── Mobile-only backdrop ── */}
      <div
        className={`mobile-backdrop${anySheetOpen ? " visible" : ""}`}
        onClick={() => {
          closeSidebar();
          if (isNewsPanelOpen) closeNewsPanel();
        }}
      />

      {/* ── Mobile bottom navigation bar ── */}
      <nav className="mobile-nav" aria-label="Mobile navigation">
        <button
          className={`mobile-nav__btn${sidebarOpen ? " active" : ""}`}
          onClick={toggleSidebar}
          aria-label="Markets"
        >
          <span className="mobile-nav__btn-icon">📊</span>
          MARKETS
        </button>

        <button
          className="mobile-nav__btn"
          style={{ borderLeft: "1px solid rgba(255,255,255,0.04)", borderRight: "1px solid rgba(255,255,255,0.04)" }}
          onClick={() => {
            closeSidebar();
            if (isNewsPanelOpen) closeNewsPanel();
          }}
          aria-label="Globe"
        >
          <span className="mobile-nav__btn-icon">🌍</span>
          GLOBE
        </button>

        <button
          className={`mobile-nav__btn${isNewsPanelOpen ? " active" : ""}`}
          onClick={() => {
            closeSidebar();
            /* news panel opens when user taps a country — this just closes sidebar */
          }}
          aria-label="News"
        >
          <span className="mobile-nav__btn-icon">📡</span>
          NEWS
        </button>
      </nav>
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
