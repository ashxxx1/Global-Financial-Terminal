import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import useTerminalStore from "../../store/terminalStore";
import { COUNTRIES_DATA, NEWS_MARKERS } from "../../data/mockData";

// Country ISO-2 → polygon color based on sentiment
function getCountryColor(isoA2, opacity = 0.7) {
  const c = COUNTRIES_DATA[isoA2];
  if (!c) return `rgba(20, 30, 60, ${opacity * 0.5})`;
  if (c.sentiment === "bullish") return `rgba(0, 255, 136, ${opacity * 0.35})`;
  if (c.sentiment === "bearish") return `rgba(255, 34, 68, ${opacity * 0.35})`;
  return `rgba(255, 170, 0, ${opacity * 0.28})`;
}

function getSideColor(isoA2) {
  const c = COUNTRIES_DATA[isoA2];
  if (!c) return "rgba(15,20,45,0.8)";
  if (c.sentiment === "bullish") return "rgba(0, 200, 100, 0.55)";
  if (c.sentiment === "bearish") return "rgba(220, 30, 60, 0.55)";
  return "rgba(210, 140, 0, 0.45)";
}

function getStrokeColor(isoA2) {
  const c = COUNTRIES_DATA[isoA2];
  if (!c) return "rgba(100,150,255,0.06)";
  if (c.sentiment === "bullish") return "rgba(0,255,136,0.18)";
  if (c.sentiment === "bearish") return "rgba(255,34,68,0.18)";
  return "rgba(255,170,0,0.14)";
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

    // ── Config: Satellite Earth Texture ──
    globe
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("rgba(80, 160, 255, 0.20)")
      .atmosphereAltitude(0.22)
      // Satellite / Blue Marble earth textures
      .globeImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
      )
      .bumpImageUrl(
        "https://unpkg.com/three-globe/example/img/earth-topology.png"
      )
      .showGraticules(true);

    // ── Country polygons with correct India map ──
    Promise.all([
      fetch("https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson")
        .then((r) => r.json()),
      fetch("https://raw.githubusercontent.com/datameet/maps/master/Country/india-land-simplified.geojson")
        .then((r) => r.json())
        .catch(() => null)
    ])
      .then(([worldData, indiaData]) => {
        if (worldData && worldData.features) {
          // Patch India with official boundaries
          if (indiaData && indiaData.features && indiaData.features.length > 0) {
            const worldIndiaIdx = worldData.features.findIndex(
              (feat) => feat.properties.ISO_A2 === "IN" || feat.properties.ISO_A3 === "IND"
            );
            if (worldIndiaIdx !== -1) {
              worldData.features[worldIndiaIdx].geometry = indiaData.features[0].geometry;
            }
          }

          globe
            .polygonsData(worldData.features)
            .polygonCapColor((feat) => getCountryColor(feat.properties.ISO_A2))
            .polygonSideColor((feat) => getSideColor(feat.properties.ISO_A2))
            .polygonStrokeColor((feat) => getStrokeColor(feat.properties.ISO_A2))
            .polygonAltitude((feat) => {
              const c = COUNTRIES_DATA[feat.properties.ISO_A2];
              return c ? 0.008 + c.newsIntensity * 0.015 : 0.003;
            })
            .polygonLabel((feat) => {
              const iso = feat.properties.ISO_A2;
              const c = COUNTRIES_DATA[iso];
              if (!c) return `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8888aa;padding:4px 8px;background:rgba(10,10,20,0.85);border-radius:4px">${feat.properties.NAME}</div>`;
              const arrow = c.sentiment === "bullish" ? "▲" : c.sentiment === "bearish" ? "▼" : "◆";
              const color = c.sentiment === "bullish" ? "#00ff88" : c.sentiment === "bearish" ? "#ff2244" : "#ffaa00";
              const bgBorder = c.sentiment === "bullish" ? "rgba(0,255,136,0.25)" : c.sentiment === "bearish" ? "rgba(255,34,68,0.25)" : "rgba(255,170,0,0.25)";
              return `
                <div style="background:rgba(6,6,12,0.97);border:1px solid ${bgBorder};border-radius:8px;padding:12px 16px;font-family:'JetBrains Mono',monospace;min-width:180px;box-shadow:0 8px 32px rgba(0,0,0,0.8)">
                  <div style="font-size:9px;color:#555566;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:6px">${iso} · MARKET DATA</div>
                  <div style="font-size:14px;font-weight:700;color:#e8e8f0;margin-bottom:4px">${c.name}</div>
                  <div style="font-size:10px;color:#8888aa;margin-bottom:8px">${c.marketIndex} · ${c.currency}</div>
                  <div style="font-size:18px;font-weight:700;color:#e8e8f0;margin-bottom:6px">${c.indexValue.toLocaleString()}</div>
                  <div style="font-size:13px;color:${color};display:flex;align-items:center;gap:6px">
                    <span>${arrow} ${c.indexChange > 0 ? "+" : ""}${c.indexChangePct.toFixed(2)}%</span>
                    <span style="font-size:10px;opacity:0.7">today</span>
                  </div>
                  <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);font-size:9px;color:#555566;letter-spacing:0.1em">CLICK FOR NEWS & ANALYSIS →</div>
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
            .onPolygonHover((feat) => {
              globeRef.current.style.cursor = feat && COUNTRIES_DATA[feat.properties?.ISO_A2] ? "pointer" : "default";
            })
            .polygonsTransitionDuration(500);
        }
      })
      .catch(() => {});

    // ── News marker rings ──
    globe
      .ringsData(NEWS_MARKERS)
      .ringColor((d) => (t) => {
        const c = d.color;
        const alpha = Math.max(0, 1 - t);
        return c.replace(")", `, ${alpha})`).replace("rgb", "rgba");
      })
      .ringMaxRadius(5)
      .ringPropagationSpeed(1.8)
      .ringRepeatPeriod(1000)
      .ringAltitude(0.012);

    // ── News points ──
    globe
      .pointsData(NEWS_MARKERS)
      .pointColor((d) => d.color)
      .pointAltitude(0.025)
      .pointRadius((d) => d.size * 0.5)
      .pointsMerge(false)
      .pointLabel((d) => `<div style="background:rgba(6,6,12,0.95);border:1px solid rgba(255,255,255,0.1);border-radius:6px;padding:6px 10px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#8888aa">${d.label}</div>`)
      .onPointClick((d) => {
        const country = COUNTRIES_DATA[d.country];
        if (country) {
          setSelectedCountry(country);
          setGlobeAutoRotate(false);
        }
      });

    // ── Auto-rotate ──
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableZoom = true;
    globe.controls().minDistance = 180;
    globe.controls().maxDistance = 650;
    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.08;

    // ── Initial POV centered on Asia-Europe ──
    globe.pointOfView({ lat: 20, lng: 60, altitude: 2.3 }, 0);

    // ── Resize handler ──
    const ro = new ResizeObserver(() => {
      if (globeRef.current) {
        globe.width(globeRef.current.clientWidth);
        globe.height(globeRef.current.clientHeight);
      }
    });
    ro.observe(globeRef.current);

    return () => {
      ro.disconnect();
      if (globeRef.current) {
        globeRef.current.innerHTML = "";
      }
      globeInstance.current = null;
    };
  }, []);

  // Sync auto-rotate state
  useEffect(() => {
    if (!globeInstance.current) return;
    globeInstance.current.controls().autoRotate = globeAutoRotate;
  }, [globeAutoRotate]);

  return <div ref={globeRef} className="globe-container" />;
}
