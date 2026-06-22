import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import "./styles/index.css";

import Header from "./components/Header/Header";
import Ticker from "./components/Ticker/Ticker";
import Sidebar from "./components/Sidebar/Sidebar";
import GlobeArea from "./components/Globe/GlobeArea";
import StockPanel from "./components/StockPanel/StockPanel";
import "./components/StockPanel/StockPanel.css";

import LoginPage from "./pages/LoginPage";
import PendingPage from "./pages/PendingPage";
import RejectedPage from "./pages/RejectedPage";
import AdminPanel from "./pages/AdminPanel";
import ForumPage from "./pages/Forum/ForumPage";
import ForumCategory from "./pages/Forum/ForumCategory";
import ForumThread from "./pages/Forum/ForumThread";
import SocialPage from "./pages/Social/SocialPage";
import SetupUsername from "./pages/SetupUsername";

import CommandPalette from "./components/CommandPalette/CommandPalette";
import { AlertSystem, AlertPanel } from "./components/Alerts/AlertSystem";
import MacroHeatmap from "./components/MacroHeatmap/MacroHeatmap";
import EconomicCalendar from "./components/EconomicCalendar/EconomicCalendar";
import CorrelationMatrix from "./components/Correlation/CorrelationMatrix";
import FXDashboard from "./components/FXDashboard/FXDashboard";
import PortfolioPanel from "./components/Portfolio/PortfolioPanel";
import useTerminalStore from "./store/terminalStore";

function OverlayViews() {
  const { activeView, setActiveView } = useTerminalStore();
  if (activeView === "globe") return null;
  const onClose = () => setActiveView("globe");
  return (
    <div className="overlay-view">
      {activeView === "heatmap" && <MacroHeatmap onClose={onClose} />}
      {activeView === "calendar" && <EconomicCalendar onClose={onClose} />}
      {activeView === "correlation" && <CorrelationMatrix onClose={onClose} />}
      {activeView === "fx" && <FXDashboard onClose={onClose} />}
      {activeView === "portfolio" && <PortfolioPanel onClose={onClose} />}
    </div>
  );
}

function TerminalApp() {
  return (
    <div className="app-shell">
      <Header />
      <Ticker />
      <Sidebar />
      <GlobeArea />
      <StockPanel />
      <OverlayViews />
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

          {/* Forum — requires approved */}
          <Route
            path="/forum"
            element={
              <ProtectedRoute>
                <ForumPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forum/:categoryId"
            element={
              <ProtectedRoute>
                <ForumCategory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/forum/thread/:threadId"
            element={
              <ProtectedRoute>
                <ForumThread />
              </ProtectedRoute>
            }
          />
          <Route
            path="/social"
            element={
              <ProtectedRoute>
                <SocialPage />
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
