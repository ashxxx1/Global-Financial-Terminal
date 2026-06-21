import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import useTerminalStore from "../../store/terminalStore";
import { COUNTRIES_DATA, NEWS_MARKERS } from "../../data/mockData";

// Country ISO-2 → polygon color based on sentiment
function getCountryColor(isoA2, opacity = 0.7) {
  const c = COUNTRIES_DATA[isoA2];
  if (!c) return `rgba(30, 30, 50, ${opacity})`;
  if (c.sentiment === "bullish") return `rgba(0, 255, 136, ${opacity * 0.45})`;
  if (c.sentiment === "bearish") return `rgba(255, 34, 68, ${opacity * 0.45})`;
  return `rgba(255, 170, 0, ${opacity * 0.35})`;
}

function getSideColor(isoA2) {
  const c = COUNTRIES_DATA[isoA2];
  if (!c) return "rgba(20,20,35,0.9)";
  if (c.sentiment === "bullish") return "rgba(0, 180, 90, 0.6)";
  if (c.sentiment === "bearish") return "rgba(200, 20, 50, 0.6)";
  return "rgba(200, 130, 0, 0.5)";
}

export default function GlobeView() {
  const globeRef = useRef(null);
  const globeInstance = useRef(null);
  const setSelectedCountry = useTerminalStore((s) => s.setSelectedCountry);
  const globeAutoRotate = useTerminalStore((s) => s.globeAutoRotate);
  const setGlobeAutoRotate = useTerminalStore((s) => s.setGlobeAutoRotate);

  useEffect(() => {
    if (!globeRef.current || globeInstance.current) return;

    const globe = Globe()(globeRef.current);
    globeInstance.current = globe;

    // ── Config ──
    globe
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("rgba(0, 120, 255, 0.12)")
      .atmosphereAltitude(0.18)
      .globeImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-dark.jpg"
      )
      .bumpImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-topology.png"
      )

    // ── Country polygons ──
    fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
      .then((r) => r.json())
      .then((data) => {
        globe
          .polygonsData(data.features)
          .polygonCapColor((feat) =>
            getCountryColor(feat.properties.ISO_A2)
          )
          .polygonSideColor((feat) => getSideColor(feat.properties.ISO_A2))
          .polygonStrokeColor(() => "rgba(0,255,136,0.08)")
          .polygonAltitude((feat) => {
            const c = COUNTRIES_DATA[feat.properties.ISO_A2];
            return c ? 0.006 + c.newsIntensity * 0.012 : 0.004;
          })
          .polygonLabel((feat) => {
            const iso = feat.properties.ISO_A2;
            const c = COUNTRIES_DATA[iso];
            if (!c) return feat.properties.NAME;
            const arrow = c.sentiment === "bullish" ? "▲" : c.sentiment === "bearish" ? "▼" : "◆";
            const color = c.sentiment === "bullish" ? "#00ff88" : c.sentiment === "bearish" ? "#ff2244" : "#ffaa00";
            return `
              <div style="background:rgba(10,10,20,0.95);border:1px solid rgba(0,255,136,0.2);border-radius:6px;padding:10px 14px;font-family:'JetBrains Mono',monospace;min-width:160px">
                <div style="font-size:13px;font-weight:700;color:#e8e8f0;margin-bottom:6px">${c.name}</div>
                <div style="font-size:11px;color:#8888aa;margin-bottom:4px">${c.marketIndex}</div>
                <div style="font-size:16px;font-weight:700;color:#e8e8f0">${c.indexValue.toLocaleString()}</div>
                <div style="font-size:12px;color:${color};margin-top:4px">${arrow} ${c.indexChange > 0 ? "+" : ""}${c.indexChangePct.toFixed(2)}% today</div>
                <div style="font-size:9px;color:#555566;margin-top:8px;text-transform:uppercase;letter-spacing:0.1em">Click for news & market data</div>
              </div>
            `;
          })
          .onPolygonClick((feat) => {
            const iso = feat.properties.ISO_A2;
            const country = COUNTRIES_DATA[iso];
            if (country) {
              setSelectedCountry(country);
              setGlobeAutoRotate(false);
            }
          })
          .polygonsTransitionDuration(600);
      })
      .catch(() => {
        // Fallback: just use points if geojson fails
      });

    // ── News marker rings ──
    globe
      .ringsData(NEWS_MARKERS)
      .ringColor((d) => (t) => {
        const c = d.color;
        const alpha = Math.max(0, 1 - t);
        return c.replace(")", `, ${alpha})`).replace("rgb", "rgba");
      })
      .ringMaxRadius(4)
      .ringPropagationSpeed(1.5)
      .ringRepeatPeriod(1200)
      .ringAltitude(0.01)

    // ── News points ──
    globe
      .pointsData(NEWS_MARKERS)
      .pointColor((d) => d.color)
      .pointAltitude(0.02)
      .pointRadius((d) => d.size * 0.4)
      .pointsMerge(false)
      .pointLabel((d) => d.label)
      .onPointClick((d) => {
        const country = COUNTRIES_DATA[d.country];
        if (country) {
          setSelectedCountry(country);
          setGlobeAutoRotate(false);
        }
      });

    // ── Auto-rotate ──
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.4;
    globe.controls().enableZoom = true;
    globe.controls().minDistance = 200;
    globe.controls().maxDistance = 700;

    // ── Initial POV ──
    globe.pointOfView({ altitude: 2.5 }, 0);

    // ── Star field ──
    const starCount = 4000;
    const starPositions = new Float32Array(starCount * 3);
    const R = 1200;
    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      starPositions[i * 3] = R * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = R * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = R * Math.cos(phi);
    }

    const THREE = globe.renderer().domElement.__three;
    if (globe.scene && typeof globe.scene === "function") {
      // Stars via custom layer would go here in a more complex setup
    }

    // ── Resize ──
    const ro = new ResizeObserver(() => {
      if (globeRef.current) {
        globe.width(globeRef.current.clientWidth);
        globe.height(globeRef.current.clientHeight);
      }
    });
    ro.observe(globeRef.current);

    return () => {
      ro.disconnect();
    };
  }, []);

  // Sync auto-rotate state
  useEffect(() => {
    if (!globeInstance.current) return;
    globeInstance.current.controls().autoRotate = globeAutoRotate;
  }, [globeAutoRotate]);

  return <div ref={globeRef} className="globe-container" />;
}
