import "./styles/index.css";
import Header from "./components/Header/Header";
import Ticker from "./components/Ticker/Ticker";
import Sidebar from "./components/Sidebar/Sidebar";
import GlobeArea from "./components/Globe/GlobeArea";

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <Ticker />
      <Sidebar />
      <GlobeArea />
    </div>
  );
}
