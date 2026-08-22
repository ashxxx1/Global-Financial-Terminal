import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Globe3D, { type HoverInfo, type OverlayMode } from "../components/Globe3D";
import { globalNews } from "../lib/news";
import { fetchBreakingNews, timeAgo, type LiveArticle } from "../lib/newsFeed";
import type { QuakeEvent } from "../lib/feeds/quakes";
import { subscribeBus, recentEnvelopes, relativeTime, type Envelope } from "../lib/feeds/bus";
import { track } from "../lib/analytics";
import { useSeo } from "../lib/seo";

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

import { getEconCalendar, colorForEconKind, formatEconStamp } from "../data/econCalendar";

const OVERLAYS: { id: OverlayMode; label: string; live?: boolean; demo?: boolean }[] = [
  { id: "market", label: "MARKET PERF" },
  { id: "calendar", label: "CALENDAR", live: true },
  { id: "quakes", label: "LIVE EVENTS", live: true },
  // Items 3/4: both are computed from real inputs now (market dispersion +
  // published macro; classified real headlines), so the DEMO tag is retired.
  { id: "risk", label: "RISK INDEX" },
  { id: "sentiment", label: "NEWS SENTIMENT" },
];

export default function World() {
  const navigate = useNavigate();
  useSeo({
    title: "Live World Markets Map",
    description: "Watch the global economy move in real time on an interactive 3D map — live indices, FX, crypto and the news moving 68 countries.",
    path: "/",
  });
  const [overlay, setOverlay] = useState<OverlayMode>("market");
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [events, setEvents] = useState<Envelope[]>(() => recentEnvelopes("event", 40));
  const simBreaking = useMemo(() => globalNews(1).filter((a) => a.impact === "High").slice(0, 5), []);

  // Live breaking news from RSS feeds
  const [liveNews, setLiveNews] = useState<LiveArticle[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchBreakingNews(60).then((articles) => {
      if (!cancelled && articles.length) setLiveNews(articles);
    });
    const iv = setInterval(() => {
      fetchBreakingNews(60).then((articles) => {
        if (!cancelled && articles.length) setLiveNews(articles);
      });
    }, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

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
  const calendar = useMemo(() => getEconCalendar(), []);
  // Always surface 5 breaking cards: live news first, then real events, then SIM
  const BREAKING_MAX = 5;
  const liveEvents = events.slice(0, BREAKING_MAX);

  // Merge live news headlines with event bus entries
  const newsCards = liveNews.slice(0, 3);
  const eventCards = liveEvents.slice(0, Math.max(0, BREAKING_MAX - newsCards.length));
  const simFill = simBreaking.slice(0, Math.max(0, BREAKING_MAX - newsCards.length - eventCards.length));

  return (
    <div data-tour="globe" style={{ position: "absolute", inset: 0 }}>
      <Globe3D
        overlay={overlay}
        quakes={quakes}
        articles={liveNews}
        calendar={calendar}
        onHover={setHover}
        onCountryClick={(code) => navigate(`/country/${code}`)}
      />

      {/* Title + overlay selector */}
      <div style={{ position: "absolute", top: 16, left: 18, zIndex: 10, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: "-0.01em" }}>
            <span className="hero-shine">The world's economy,</span> <span className="live-glow">live</span>.
          </h1>
          <p style={{ margin: "3px 0 0", fontSize: 12, color: "var(--muted)" }}>
            Rotate · zoom · click any country for its dashboard
          </p>
        </div>
        <div data-tour="overlays" style={{ display: "flex", gap: 6, pointerEvents: "auto", flexWrap: "wrap" }}>
          {OVERLAYS.map((o) => (
            <button key={o.id} className={`chip ${overlay === o.id ? "active" : ""}`} onClick={() => { setOverlay(o.id); track("overlay_switched", { overlay: o.id }); }}>
              {o.live && <span className="pulse-dot" style={{ background: "var(--up)", marginRight: 6, boxShadow: "0 0 5px var(--up)" }} />}
              {o.label}
              {o.demo && <span className="demo-tag">DEMO</span>}
              {o.id === "quakes" && quakes.length > 0 && <span style={{ marginLeft: 6, color: "var(--faint)" }}>{quakes.length}</span>}
              {o.id === "calendar" && <span style={{ marginLeft: 6, color: "var(--faint)" }}>{calendar.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Breaking strip OR calendar agenda (bottom sheet on mobile) */}
      <div className={`world-side-rail${overlay === "calendar" ? " cal-active" : ""}`}>
        {overlay === "calendar" ? (
          <>
            <div className="cal-sheet-handle" aria-hidden="true" />
            <div className="panel" style={{ padding: "10px 12px" }}>
              <div className="label" style={{ color: "var(--gold)" }}>ECONOMIC CALENDAR</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4, lineHeight: 1.4 }}>
                CPI and jobs dates follow official BLS, ONS and Eurostat calendars. Other pins are published schedules. Times are shown in the release timezone.
              </div>
            </div>
            {calendar.slice(0, 8).map((e) => (
              <button
                key={e.id}
                type="button"
                className="panel fade-in card-int"
                onClick={() => navigate(`/country/${e.country}`)}
                style={{ textAlign: "left", padding: "10px 12px", cursor: "pointer" }}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                  <span className="label" style={{ color: colorForEconKind(e.kind) }}>● {e.kind}</span>
                  <span className="label">{e.country}</span>
                  <span className="label" style={{ marginLeft: "auto" }}>
                    {formatEconStamp(e)}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>{e.title}</div>
                <div className="label" style={{ marginTop: 4 }}>{e.detail}</div>
              </button>
            ))}
          </>
        ) : (
          <>
        {/* Live news cards */}
        {newsCards.map((a) => (
          <a
            key={a.id}
            href={a.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className={`panel fade-in card-int ${a.impact === "High" ? "glow-edge" : ""}`}
            style={{
              textAlign: "left", padding: "10px 12px", cursor: "pointer", textDecoration: "none", color: "inherit", display: "block",
              borderColor: a.impact === "High" ? "var(--down)" : "var(--line)",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
              <span className="label" style={{ color: "var(--up)" }}>● LIVE · {a.source}</span>
              <span className="label">{timeAgo(a.minutesAgo)}</span>
              <span className="label" style={{ marginLeft: "auto", color: a.impact === "High" ? "var(--down)" : "var(--faint)" }}>{a.impact}</span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35 }}>{a.title}</div>
            {a.url && (
              <div className="label" style={{ marginTop: 4, color: "var(--blue)", fontSize: 8.5 }}>
                READ ARTICLE ↗
              </div>
            )}
          </a>
        ))}

        {/* Event bus cards */}
        {eventCards.map((e) => (
          <button
            key={e.id}
            className={`panel fade-in card-int ${e.impact === "High" ? "glow-edge" : ""}`}
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

        {/* SIM fill */}
        {simFill.map((a) => (
          <button
            key={a.id}
            className="panel fade-in card-int"
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
          </>
        )}
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
