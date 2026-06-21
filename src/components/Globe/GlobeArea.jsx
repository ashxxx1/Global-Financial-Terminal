import { Suspense, lazy, useState, useEffect } from "react";
import useTerminalStore from "../../store/terminalStore";
import NewsPanel from "../NewsPanel/NewsPanel";
import { COUNTRIES_DATA } from "../../data/mockData";

const GlobeView = lazy(() => import("../Globe/GlobeView"));

function GlobeLoading() {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const id = setInterval(
      () => setDots((d) => (d.length >= 4 ? "." : d + ".")),
      400
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="globe-loading">
      <span className="globe-loading__text">INITIALIZING GLOBE{dots}</span>
    </div>
  );
}

function CoordDisplay() {
  const [coords, setCoords] = useState({ lat: 20.0, lng: 0.0 });
  return (
    <div className="coord-display">
      LAT {coords.lat.toFixed(2)}° · LNG {coords.lng.toFixed(2)}°
    </div>
  );
}

export default function GlobeArea() {
  const { isNewsPanelOpen, globeAutoRotate, setGlobeAutoRotate } =
    useTerminalStore();

  return (
    <div className="globe-area">
      {/* Corner decorations */}
      <div className="corner-decoration top-left">
        GFT · LIVE · GLOBAL VIEW
      </div>
      <div
        className="corner-decoration top-right"
        style={{ display: "flex", gap: 16, alignItems: "center" }}
      >
        <span style={{ color: "var(--accent-green)", fontFamily: "var(--text-mono)", fontSize: 9 }}>
          ● {Object.keys(COUNTRIES_DATA).length} MARKETS TRACKED
        </span>
        <button
          onClick={() => setGlobeAutoRotate(!globeAutoRotate)}
          style={{
            background: "transparent",
            border: "1px solid var(--border-subtle)",
            color: globeAutoRotate
              ? "var(--accent-green)"
              : "var(--text-muted)",
            borderRadius: 3,
            padding: "2px 8px",
            fontFamily: "var(--text-mono)",
            fontSize: 9,
            cursor: "pointer",
            letterSpacing: "0.08em",
          }}
        >
          {globeAutoRotate ? "⟳ AUTO" : "⊡ LOCKED"}
        </button>
      </div>
      <div className="corner-decoration bottom-left">
        CLICK COUNTRY FOR MARKET DATA & NEWS
      </div>

      <CoordDisplay />

      <Suspense fallback={<GlobeLoading />}>
        <GlobeView />
      </Suspense>

      <NewsPanel />
    </div>
  );
}
