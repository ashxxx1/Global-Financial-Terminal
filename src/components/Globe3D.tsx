/**
 * Globe3D — the interactive Earth. Engineering notes (lessons paid for in v0):
 *  · Texture + geojson ship same-origin from /public — no CDN, no slow first paint.
 *  · Natural Earth 110m only. Its winding matches the engine convention; the old
 *    hand-injected india.geojson was CCW-wound and rendered as a globe-covering
 *    cap (the historic "green globe" bug). India renders from NE like everyone.
 *  · Country caps stay fully transparent — semi-transparent caps stack front+back
 *    into an opaque wash. Indicators are HTML markers instead.
 *  · Hover drives ONLY a React overlay card, never polygon accessors (per-hover
 *    material churn leaked meshes in v0).
 *  · Cleanup disposes the renderer but never calls WEBGL_lose_context.loseContext()
 *    (StrictMode's phantom unmount would kill the context → blank first load).
 */
import { useEffect, useRef, useState, useCallback } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";
import { COUNTRIES, type CountryMeta } from "../lib/market";
import { getCountryStats } from "../data/countryStats";
import type { QuakeEvent } from "../lib/feeds/quakes";
import type { EconCalendarEvent } from "../data/econCalendar";
import { colorForEconKind } from "../data/econCalendar";

export type OverlayMode = "market" | "risk" | "sentiment" | "quakes" | "calendar";

interface Feature { properties: Record<string, unknown>; [k: string]: unknown; }

// ISO_A3 → ISO_A2 for Natural Earth features whose ISO_A2 is "-99"
const A3: Record<string, string> = {
  USA: "US", GBR: "GB", JPN: "JP", DEU: "DE", CHN: "CN", IND: "IN", BRA: "BR", AUS: "AU",
  CAN: "CA", FRA: "FR", SAU: "SA", KOR: "KR", ZAF: "ZA", NGA: "NG", MEX: "MX", SGP: "SG",
  ARE: "AE", RUS: "RU", ESP: "ES", ITA: "IT", NLD: "NL", SWE: "SE", NOR: "NO", CHE: "CH",
  TUR: "TR", ISR: "IL", EGY: "EG", IDN: "ID", MYS: "MY", THA: "TH", PHL: "PH", VNM: "VN",
  PAK: "PK", BGD: "BD", ARG: "AR", COL: "CO", CHL: "CL", PER: "PE", POL: "PL", UKR: "UA",
  GRC: "GR", PRT: "PT", IRL: "IE", DNK: "DK", FIN: "FI", AUT: "AT", BEL: "BE", CZE: "CZ",
  HUN: "HU", ROU: "RO", NZL: "NZ", KAZ: "KZ", QAT: "QA", KWT: "KW", TWN: "TW", HKG: "HK",
};

function isoOf(f: Feature): string {
  const p = f.properties || {};
  const a2 = String(p.ISO_A2 || "");
  if (a2 && a2 !== "-99") return a2;
  return A3[String(p.ISO_A3 || "")] || a2;
}

export interface HoverInfo {
  code: string; name: string; x: number; y: number;
  meta?: CountryMeta;
  stats?: { gdp: string; inflation: string; rate: string; currency: string; riskScore: number };
}

export default function Globe3D({
  overlay = "market",
  quakes = [],
  calendar = [],
  onCountryClick,
  onHover,
}: {
  overlay?: OverlayMode;
  quakes?: QuakeEvent[];
  calendar?: EconCalendarEvent[];
  onCountryClick: (code: string, name: string) => void;
  onHover?: (h: HoverInfo | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<any>(null);
  const [dims, setDims] = useState({ width: 800, height: 600 });
  const [features, setFeatures] = useState<Feature[]>([]);

  // Load country polygons (same-origin, base-path aware for subpath hosting)
  useEffect(() => {
    let alive = true;
    fetch(import.meta.env.BASE_URL + "ne_110m_admin_0_countries.geojson")
      .then((r) => r.json())
      .then((geo) => {
        if (!alive) return;
        setFeatures((geo.features as Feature[]).filter((f) => isoOf(f) !== "AQ"));
      })
      .catch((e) => console.error("geojson load failed", e));
    return () => { alive = false; };
  }, []);

  // Size to container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth || 800, h = el.clientHeight || 600;
      setDims((p) => (Math.abs(p.width - w) < 3 && Math.abs(p.height - h) < 3 ? p : { width: w, height: h }));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Init camera + auto-rotate once controls exist
  useEffect(() => {
    const iv = setInterval(() => {
      const g = globeRef.current;
      if (g?.controls?.() && g?.pointOfView) {
        const c = g.controls();
        c.autoRotate = true;
        c.autoRotateSpeed = 0.25;
        g.pointOfView({ lat: 22, lng: 10, altitude: 1.9 });
        if (import.meta.env.DEV) (window as any).__GLOBE__ = g;
        clearInterval(iv);
      }
    }, 200);
    return () => clearInterval(iv);
  }, []);

  // Dispose GPU resources on unmount — but never force-lose the context.
  useEffect(() => {
    const g = globeRef.current;
    return () => {
      try { g?.renderer?.()?.dispose(); } catch { /* fine */ }
    };
  }, []);

  /**
   * Own the picking. react-globe.gl's built-in polygon events proved
   * unreliable in this setup, so we raycast directly: find the ancestor
   * carrying the bound feature (`__data`) on ConicPolygonGeometry hits.
   * Click = pointerdown+up within 6px (so orbit drags never select).
   */
  const featureOfHit = (obj: THREE.Object3D | null): Feature | null => {
    let o: any = obj;
    while (o) {
      const d = o.__data;
      if (d) {
        if (d.properties) return d as Feature;
        if (d.data && d.data.properties) return d.data as Feature;
      }
      o = o.parent;
    }
    return null;
  };

  const pick = useCallback((clientX: number, clientY: number): Feature | null => {
    const g = globeRef.current;
    const el = containerRef.current;
    const canvas = el?.querySelector("canvas");
    if (!g || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1
    );
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, g.camera());
    const hits = ray.intersectObjects(g.scene().children, true);
    for (const h of hits) {
      if ((h.object as any).geometry?.type === "ConicPolygonGeometry") {
        const f = featureOfHit(h.object);
        if (f) return f;
      }
    }
    return null;
  }, []);

  const downPos = useRef<{ x: number; y: number } | null>(null);
  const hoverThrottle = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDown = (e: PointerEvent) => { downPos.current = { x: e.clientX, y: e.clientY }; };
    const onUp = (e: PointerEvent) => {
      const d = downPos.current;
      downPos.current = null;
      if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return; // drag, not click
      const f = pick(e.clientX, e.clientY);
      if (f) {
        const code = isoOf(f);
        const g = globeRef.current;
        if (g?.controls?.()) g.controls().autoRotate = false;
        onCountryClick(code, String(f.properties?.ADMIN || code));
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!onHover) return;
      const now = performance.now();
      if (now - hoverThrottle.current < 90) return;
      hoverThrottle.current = now;
      const f = pick(e.clientX, e.clientY);
      handleHover(f, e as unknown as MouseEvent);
    };
    const onLeave = () => onHover?.(null);

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick, onCountryClick, onHover]);

  const handleHover = useCallback((f: Feature | null, ev?: MouseEvent) => {
    if (!onHover) return;
    if (!f) { onHover(null); return; }
    const code = isoOf(f);
    const name = String(f.properties?.ADMIN || f.properties?.NAME || code);
    let stats;
    try { stats = getCountryStats(code); } catch { stats = undefined; }
    onHover({
      code, name,
      x: (ev as any)?.clientX ?? 0, y: (ev as any)?.clientY ?? 0,
      meta: COUNTRIES[code],
      stats: stats ? { gdp: stats.gdp, inflation: stats.inflation, rate: stats.rate, currency: stats.currency, riskScore: stats.riskScore } : undefined,
    });
  }, [onHover]);

  // Indicator markers — HTML elements, never polygon caps.
  // "quakes" = USGS; "calendar" = CPI/Fed/earnings; other modes = per-country signals.
  const markers = overlay === "quakes"
    ? quakes.map((q) => ({
        code: q.id, lat: q.lat, lng: q.lng,
        color: q.mag >= 6 ? "var(--down)" : q.mag >= 5 ? "var(--gold)" : "var(--blue)",
        intensity: Math.min(1, q.mag / 7),
      }))
    : overlay === "calendar"
      ? calendar.map((e) => ({
          code: e.id,
          lat: e.lat,
          lng: e.lng,
          color: colorForEconKind(e.kind),
          intensity: e.importance === "high" ? 0.95 : 0.55,
        }))
      : Object.values(COUNTRIES).map((c) => {
          const stats = (() => { try { return getCountryStats(c.code); } catch { return null; } })();
          const risk = stats?.riskScore ?? 40;
          const ret = stats?.marketReturns?.["1D"] ?? 0;
          let color = "var(--blue)";
          let intensity = c.newsIntensity;
          if (overlay === "market") { color = ret >= 0 ? "var(--up)" : "var(--down)"; intensity = Math.min(1, Math.abs(ret) / 2.5 + 0.25); }
          if (overlay === "risk") { color = risk > 60 ? "var(--down)" : risk > 40 ? "var(--gold)" : "var(--up)"; intensity = risk / 100; }
          if (overlay === "sentiment") { color = c.sentiment === "bullish" ? "var(--up)" : c.sentiment === "bearish" ? "var(--down)" : "var(--gold)"; }
          return { code: c.code, lat: c.lat, lng: c.lng, color, intensity };
        });

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <Globe
        ref={globeRef}
        width={dims.width}
        height={dims.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={import.meta.env.BASE_URL + "earth-blue-marble.jpg"}
        showAtmosphere
        atmosphereColor="#3B82F6"
        atmosphereAltitude={0.12}
        polygonsData={features}
        polygonAltitude={0.006}
        polygonCapColor={() => "rgba(0,0,0,0)"}
        polygonSideColor={() => "rgba(0,0,0,0)"}
        polygonStrokeColor={() => "rgba(212,160,23,0.28)"}
        htmlElementsData={markers}
        htmlLat={(d: any) => d.lat}
        htmlLng={(d: any) => d.lng}
        htmlAltitude={0.012}
        htmlElement={(d: any) => {
          const el = document.createElement("div");
          const size = 7 + d.intensity * 9;
          el.style.cssText = `pointer-events:none; transform: translate(-50%,-50%);`;
          el.innerHTML = `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${d.color};opacity:.85;
            box-shadow:0 0 ${6 + d.intensity * 14}px ${d.color};
          "></div>`;
          return el;
        }}
      />
    </div>
  );
}
