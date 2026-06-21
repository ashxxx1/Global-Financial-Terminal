import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import useTerminalStore from "../../store/terminalStore";
import { COUNTRIES_DATA, NEWS_MARKERS } from "../../data/mockData";

// ─── ISO & name mappings to handle NaturalEarth quirks ───────────────────────
// NaturalEarth 110m GeoJSON sometimes has wrong/missing ISO_A2 values.
// This map resolves them by ISO_A3 or by country name fallback.
const ISO_A3_MAP = {
  USA: "US", GBR: "GB", JPN: "JP", DEU: "DE", CHN: "CN", IND: "IN",
  BRA: "BR", AUS: "AU", CAN: "CA", FRA: "FR", SAU: "SA", KOR: "KR",
  ZAF: "ZA", NGA: "NG", MEX: "MX", SGP: "SG", ARE: "AE", RUS: "RU",
  // extras
  ESP: "ES", ITA: "IT", NLD: "NL", SWE: "SE", NOR: "NO", ARG: "AR",
  IDN: "ID", MYS: "MY", THA: "TH", PAK: "PK", BGD: "BD", EGY: "EG",
  IRN: "IR", TUR: "TR", POL: "PL", UKR: "UA", ISR: "IL", PHL: "PH",
  VNM: "VN", COL: "CO", CHL: "CL", PER: "PE", KAZ: "KZ", DZA: "DZ",
  MAR: "MA", ETH: "ET", TZA: "TZ", KEN: "KE",
};

const NAME_MAP = {
  "India": "IN",
  "United States of America": "US",
  "United Kingdom": "GB",
  "France": "FR",      // NE sometimes stores as "FX"
  "Norway": "NO",
  "China": "CN",
  "South Korea": "KR",
  "Russia": "RU",
  "Australia": "AU",
  "Brazil": "BR",
  "Canada": "CA",
  "Germany": "DE",
  "Japan": "JP",
  "Mexico": "MX",
  "Saudi Arabia": "SA",
  "Singapore": "SG",
  "South Africa": "ZA",
  "Nigeria": "NG",
  "United Arab Emirates": "AE",
};

/** Resolve a feature to one of our tracked ISO2 codes */
function resolveISO(feat) {
  const p = feat.properties || {};
  // 1) Direct ISO_A2 match
  if (p.ISO_A2 && COUNTRIES_DATA[p.ISO_A2]) return p.ISO_A2;
  // 2) Via ISO_A3 map
  if (p.ISO_A3 && ISO_A3_MAP[p.ISO_A3] && COUNTRIES_DATA[ISO_A3_MAP[p.ISO_A3]])
    return ISO_A3_MAP[p.ISO_A3];
  // 3) Via NAME
  if (p.NAME && NAME_MAP[p.NAME] && COUNTRIES_DATA[NAME_MAP[p.NAME]])
    return NAME_MAP[p.NAME];
  if (p.ADMIN && NAME_MAP[p.ADMIN] && COUNTRIES_DATA[NAME_MAP[p.ADMIN]])
    return NAME_MAP[p.ADMIN];
  return null;
}

// ─── Color helpers ────────────────────────────────────────────────────────────
function getCountryColor(iso) {
  const c = COUNTRIES_DATA[iso];
  if (!c) return "rgba(20, 30, 60, 0.28)";
  if (c.sentiment === "bullish") return "rgba(0, 232, 122, 0.32)";
  if (c.sentiment === "bearish") return "rgba(255, 34, 68, 0.30)";
  return "rgba(245, 166, 35, 0.28)";
}
function getSideColor(iso) {
  const c = COUNTRIES_DATA[iso];
  if (!c) return "rgba(10,16,40,0.7)";
  if (c.sentiment === "bullish") return "rgba(0, 200, 100, 0.50)";
  if (c.sentiment === "bearish") return "rgba(220, 30, 60, 0.50)";
  return "rgba(210, 140, 0, 0.40)";
}
function getStrokeColor(iso) {
  const c = COUNTRIES_DATA[iso];
  if (!c) return "rgba(100,150,255,0.06)";
  if (c.sentiment === "bullish") return "rgba(0,232,122,0.22)";
  if (c.sentiment === "bearish") return "rgba(255,34,68,0.22)";
  return "rgba(245,166,35,0.18)";
}

function buildTooltip(iso, name) {
  const c = COUNTRIES_DATA[iso];
  if (!c) return `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#666688;padding:6px 10px;background:rgba(8,8,16,0.9);border-radius:6px">${name}</div>`;
  const arrow = c.sentiment === "bullish" ? "▲" : c.sentiment === "bearish" ? "▼" : "◆";
  const col = c.sentiment === "bullish" ? "#00e87a" : c.sentiment === "bearish" ? "#ff2244" : "#f5a623";
  const bdr = c.sentiment === "bullish" ? "rgba(0,232,122,0.3)" : c.sentiment === "bearish" ? "rgba(255,34,68,0.3)" : "rgba(245,166,35,0.3)";
  return `
    <div style="background:rgba(5,5,14,0.98);border:1px solid ${bdr};border-radius:10px;padding:13px 16px;font-family:'JetBrains Mono',monospace;min-width:190px;box-shadow:0 10px 40px rgba(0,0,0,0.85)">
      <div style="font-size:8.5px;color:#444460;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:5px">${iso} · MARKET TERMINAL</div>
      <div style="font-size:15px;font-weight:700;color:#eaeaf5;margin-bottom:3px">${c.name}</div>
      <div style="font-size:9.5px;color:#7a7a9a;margin-bottom:9px">${c.marketIndex} · ${c.currency}</div>
      <div style="font-size:19px;font-weight:700;color:#eaeaf5;margin-bottom:5px">${c.indexValue.toLocaleString()}</div>
      <div style="font-size:13px;color:${col};display:flex;align-items:center;gap:6px">
        ${arrow} ${c.indexChange > 0 ? "+" : ""}${c.indexChangePct.toFixed(2)}%
        <span style="font-size:9px;color:#444460">today</span>
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);font-size:8.5px;color:#444460;letter-spacing:0.1em">CLICK · NEWS & ANALYSIS →</div>
    </div>`;
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

    // ── Satellite earth ──────────────────────────────────────────────────────
    globe
      .backgroundColor("rgba(0,0,0,0)")
      .showAtmosphere(true)
      .atmosphereColor("rgba(80,160,255,0.20)")
      .atmosphereAltitude(0.22)
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
      .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
      .showGraticules(true);

    // ── Country polygons ─────────────────────────────────────────────────────
    fetch(
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson"
    )
      .then((r) => r.json())
      .then((worldData) => {
        if (!worldData || !worldData.features) return;

        globe
          .polygonsData(worldData.features)
          .polygonCapColor((feat) => {
            const iso = resolveISO(feat);
            return getCountryColor(iso);
          })
          .polygonSideColor((feat) => {
            const iso = resolveISO(feat);
            return getSideColor(iso);
          })
          .polygonStrokeColor((feat) => {
            const iso = resolveISO(feat);
            return getStrokeColor(iso);
          })
          .polygonAltitude((feat) => {
            const iso = resolveISO(feat);
            const c = iso ? COUNTRIES_DATA[iso] : null;
            return c ? 0.008 + c.newsIntensity * 0.014 : 0.002;
          })
          .polygonLabel((feat) => {
            const iso = resolveISO(feat);
            const name = feat.properties?.NAME || feat.properties?.ADMIN || "";
            return buildTooltip(iso, name);
          })
          .onPolygonClick((feat) => {
            const iso = resolveISO(feat);
            if (iso && COUNTRIES_DATA[iso]) {
              setSelectedCountry(COUNTRIES_DATA[iso]);
              setGlobeAutoRotate(false);
            }
          })
          .onPolygonHover((feat) => {
            const iso = feat ? resolveISO(feat) : null;
            if (globeRef.current) {
              globeRef.current.style.cursor =
                iso && COUNTRIES_DATA[iso] ? "pointer" : "default";
            }
          })
          .polygonsTransitionDuration(500);
      })
      .catch(() => {});

    // ── News rings ───────────────────────────────────────────────────────────
    globe
      .ringsData(NEWS_MARKERS)
      .ringColor((d) => (t) => {
        const alpha = Math.max(0, 1 - t);
        return d.color.startsWith("rgb")
          ? d.color.replace(")", `, ${alpha})`).replace("rgb", "rgba")
          : d.color + Math.round(alpha * 255).toString(16).padStart(2, "0");
      })
      .ringMaxRadius(5)
      .ringPropagationSpeed(1.8)
      .ringRepeatPeriod(1000)
      .ringAltitude(0.012);

    // ── News points ──────────────────────────────────────────────────────────
    globe
      .pointsData(NEWS_MARKERS)
      .pointColor((d) => d.color)
      .pointAltitude(0.025)
      .pointRadius((d) => d.size * 0.5)
      .pointsMerge(false)
      .pointLabel((d) => `<div style="background:rgba(5,5,14,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:5px 10px;font-family:'JetBrains Mono',monospace;font-size:10px;color:#7a7a9a">${d.label}</div>`)
      .onPointClick((d) => {
        const country = COUNTRIES_DATA[d.country];
        if (country) {
          setSelectedCountry(country);
          setGlobeAutoRotate(false);
        }
      });

    // ── Controls ─────────────────────────────────────────────────────────────
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.35;
    globe.controls().enableZoom = true;
    globe.controls().minDistance = 180;
    globe.controls().maxDistance = 650;
    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.08;

    globe.pointOfView({ lat: 20, lng: 60, altitude: 2.3 }, 0);

    // ── Resize ───────────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      if (globeRef.current) {
        globe.width(globeRef.current.clientWidth);
        globe.height(globeRef.current.clientHeight);
      }
    });
    ro.observe(globeRef.current);

    return () => {
      ro.disconnect();
      if (globeRef.current) globeRef.current.innerHTML = "";
      globeInstance.current = null;
    };
  }, []);

  // Sync auto-rotate
  useEffect(() => {
    if (!globeInstance.current) return;
    globeInstance.current.controls().autoRotate = globeAutoRotate;
  }, [globeAutoRotate]);

  return <div ref={globeRef} className="globe-container" />;
}
