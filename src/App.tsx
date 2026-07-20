/**
 * Global Financial Terminal — v1 shell.
 * Fully public: no authentication anywhere. Layout per spec:
 * top nav · content + right rail · bottom live ticker.
 */
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import TopNav from "./components/TopNav";
import Ticker from "./components/Ticker";
import RightRail from "./components/RightRail";
import Search from "./components/Search";
import AlertWatcher from "./components/AlertWatcher";
import World from "./pages/World";
import Country from "./pages/Country";
import Markets from "./pages/Markets";
import Stock from "./pages/Stock";
import News from "./pages/News";
import "./styles/theme.css";

function Shell() {
  const { pathname } = useLocation();
  const onWorld = pathname === "/";

  return (
    <div className="shell">
      <div className="ambient" aria-hidden />
      <TopNav />
      <div className="shell-main">
        <main className="shell-content" style={{ overflowY: onWorld ? "hidden" : "auto" }}>
          <Routes>
            <Route path="/" element={<World />} />
            <Route path="/country/:code" element={<Country />} />
            <Route path="/markets" element={<Markets />} />
            <Route path="/stock/:symbol" element={<Stock />} />
            <Route path="/news" element={<News />} />
            <Route path="*" element={<World />} />
          </Routes>
        </main>
        <RightRail />
      </div>
      <Ticker />
      <Search />
      <AlertWatcher />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
