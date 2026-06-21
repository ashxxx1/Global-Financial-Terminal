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

function TerminalApp() {
  return (
    <div className="app-shell">
      <Header />
      <Ticker />
      <Sidebar />
      <GlobeArea />
      {/* Global Stock Panel — renders as fixed overlay above everything */}
      <StockPanel />
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
