import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Globe3D, { type HoverInfo, type OverlayMode } from "../components/Globe3D";
import { globalNews } from "../lib/news";
import type { QuakeEvent } from "../lib/feeds/quakes";
import { subscribeBus, recentEnvelopes, relativeTime, type Envelope } from "../lib/feeds/bus";

/** Earthquake envelopes (from either the backend SSE or the in-browser feed)
 *  carry lat/lng/mag in their payload — derive globe markers from them so both
 *  data paths light up the same overlay. */
function quakesFromEvents(events: Envelope[]): QuakeEvent[] {
  return events
    .filter((e) => e.source === "USGS" && (e.payload as any)?.lat != null)
    .map((e) => {
      const p = e.payload as any;
      return { id: e.id, mag: p.mag, place: p.place, time: e.timestamp, lat: p.lat, lng: p.lng, depthKm: p.depthKm ?? 0, countries: e.countryTags, url: p.url };
    });
}

const OVERLAYS: { id: OverlayMode; label: string; live?: boolean }[] = [
  { id: "market", label: "MARKET PERF" },
  { id: "risk", label: "RISK INDEX" },
  { id: "sentiment", label: "AI SENTIMENT" },
  { id: "quakes", label: "LIVE EVENTS", live: true },
];

export default function World() {
  const navigate = useNavigate();
  const [overlay, setOverlay] = useState<OverlayMode>("market");
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [events, setEvents] = useState<Envelope[]>(() => recentEnvelopes("event", 40));
  const simBreaking = useMemo(() => globalNews(1).filter((a) => a.impact === "High").slice(0, 3), []);

  // Real-time: re-read the event bus whenever a new event/news envelope lands
  // (works identically for the backend SSE and the in-browser feeds).
  useEffect(() => {
    const refresh = () => setEvents([...recentEnvelopes("event", 40), ...recentEnvelopes("news", 10)]
      .sort((a, b) => b.timestamp - a.timestamp));
    refresh();
    const unsub = subscribeBus((e) => { if (e.kind === "event" || e.kind === "news") refresh(); });
    const iv = setInterval(refresh, 60000);
    return () => { unsub(); clearInterval(iv); };
  }, []);

  const quakes = useMemo(() => quakesFromEvents(events), [events]);
  const liveEvents = events.slice(0, 4);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <Globe3D
        overlay={overlay}
        quakes={quakes}
        onHover={setHover}
        onCountryClick={(code) => navigate(`/country/${code}`)}
      />

      {/* Title + overlay selector */}
      <div style={{ position: "absolute", top: 16, left: 18, zIndex: 10, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em" }}>
            The world's economy, <span style={{ color: "var(--gold)" }}>live</span>.
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted)" }}>
            Rotate · zoom · click any country for its dashboard
          </p>
        </div>
        <div style={{ display: "flex", gap: 6, pointerEvents: "auto", flexWrap: "wrap" }}>
          {OVERLAYS.map((o) => (
            <button key={o.id} className={`chip ${overlay === o.id ? "active" : ""}`} onClick={() => setOverlay(o.id)}>
              {o.live && <span className="pulse-dot" style={{ background: "var(--up)", marginRight: 6, boxShadow: "0 0 5px var(--up)" }} />}
              {o.label}
              {o.id === "quakes" && quakes.length > 0 && <span style={{ marginLeft: 6, color: "var(--faint)" }}>{quakes.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Breaking strip: REAL events (USGS) first, then high-impact wire items */}
      <div style={{ position: "absolute", right: 18, top: 16, zIndex: 10, width: 300, display: "flex", flexDirection: "column", gap: 8 }}>
        {liveEvents.map((e) => (
          <button
            key={e.id}
            className="panel fade-in"
            onClick={() => e.countryTags[0] && navigate(`/country/${e.countryTags[0]}`)}
            style={{ textAlign: "left", padding: "10px 12px", cursor: "pointer", borderColor: e.impact === "High" ? "var(--down)" : "var(--line)" }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <span className="label" style={{ color: "var(--up)" }}>● LIVE · {e.source}</span>
              <span className="label">{relativeTime(e.timestamp)}</span>
              <span className="label" style={{ marginLeft: "auto", color: e.impact === "High" ? "var(--down)" : "var(--faint)" }}>{e.impact}</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>{e.summary}</div>
            {e.countryTags.length > 0 && (
              <div className="label" style={{ marginTop: 4, color: "var(--gold)" }}>{e.countryTags.join(" · ")}</div>
            )}
          </button>
        ))}
        {simBreaking.map((a) => (
          <button
            key={a.id}
            className="panel fade-in"
            onClick={() => navigate(`/country/${a.country}`)}
            style={{ textAlign: "left", padding: "10px 12px", cursor: "pointer" }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <span className="label" style={{ color: "var(--down)" }}>● {a.countryName}</span>
              <span className="label">{a.minutesAgo}m ago</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>{a.headline}</div>
          </button>
        ))}
      </div>

      {/* Hover intel card */}
      {hover && (
        <div
          className="panel"
          style={{
            position: "fixed", zIndex: 60, pointerEvents: "none",
            left: Math.min(hover.x + 16, window.innerWidth - 280),
            top: Math.min(hover.y + 14, window.innerHeight - 190),
            width: 260, padding: "12px 14px", boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <strong style={{ fontSize: 14 }}>{hover.name}</strong>
            <span className="label">{hover.code}</span>
          </div>
          {hover.stats ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px", marginTop: 9 }}>
              <Stat k="GDP" v={`$${hover.stats.gdp}T`} />
              <Stat k="Inflation" v={`${hover.stats.inflation}%`} />
              <Stat k="Rate" v={`${hover.stats.rate}%`} />
              <Stat k="Risk" v={String(hover.stats.riskScore)} tone={hover.stats.riskScore > 60 ? "var(--down)" : hover.stats.riskScore > 40 ? "var(--gold)" : "var(--up)"} />
              <div style={{ gridColumn: "1 / -1" }}>
                <Stat k="FX" v={hover.stats.currency} />
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--faint)" }}>No coverage yet.</div>
          )}
          {hover.meta && (
            <div style={{ marginTop: 8, fontSize: 10.5, color: "var(--muted)" }}>
              {hover.meta.marketIndex} · {hover.meta.exchange}
            </div>
          )}
          <div className="label" style={{ marginTop: 8, color: "var(--blue)" }}>Click for full dashboard →</div>
        </div>
      )}
    </div>
  );
}

function Stat({ k, v, tone }: { k: string; v: string; tone?: string }) {
  return (
    <div>
      <div className="label" style={{ fontSize: 8.5 }}>{k}</div>
      <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: tone || "var(--text)" }}>{v}</div>
    </div>
  );
}
