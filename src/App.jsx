import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./styles/index.css";

import Header from "./components/Header/Header";
import Ticker from "./components/Ticker/Ticker";
import Sidebar from "./components/Sidebar/Sidebar";
import GlobeArea from "./components/Globe/GlobeArea";
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
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Auth required — pending/rejected go to status pages */}
          <Route path="/pending" element={<PendingPage />} />
          <Route path="/rejected" element={<RejectedPage />} />

          {/* Admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute adminOnly>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          {/* Main terminal — requires approved status */}
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
