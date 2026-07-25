import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "../lib/hooks";
import { topMovers } from "../lib/market";
import { useTerminal } from "../store";
import { fetchBreakingNews, timeAgo, type LiveArticle } from "../lib/newsFeed";

function Row({ symbol, name, price, changePct, onClick }: {
  symbol: string; name: string; price: string; changePct: number; onClick: () => void;
}) {
  const up = changePct >= 0;
  return (
    <button
      onClick={onClick}
      style={{
        display: "grid", gridTemplateColumns: "1fr auto", gap: 2, width: "100%",
        textAlign: "left", padding: "7px 12px", background: "none",
        border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer",
      }}
    >
      <span style={{ fontFamily: "var(--mono)", fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{symbol}</span>
      <span className="mono" style={{ fontSize: 12, color: "var(--text)", textAlign: "right" }}>{price}</span>
      <span style={{ fontSize: 10.5, color: "var(--faint)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
      <span className="mono" style={{ fontSize: 10.5, color: up ? "var(--up)" : "var(--down)", textAlign: "right" }}>
        {up ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
      </span>
    </button>
  );
}

export default function RightRail() {
  const navigate = useNavigate();
  const watchlist = useTerminal((s) => s.watchlist);
  const notices = useTerminal((s) => s.notices);
  const clearNotices = useTerminal((s) => s.clearNotices);
  const watchQuotes = useQuotes(watchlist.map((w) => w.symbol));
  const movers = useMemo(() => topMovers(5), []);

  // Live news feed
  const [news, setNews] = useState<LiveArticle[]>([]);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchBreakingNews(5).then((articles) => {
        if (!cancelled) setNews(articles);
      }).catch(() => {});
    };
    load();
    const iv = setInterval(load, 5 * 60 * 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

  return (
    <aside
      className="right-rail"
      style={{
        width: "var(--rail-w)", minWidth: "var(--rail-w)",
        borderLeft: "1px solid var(--line)", background: "rgba(13,20,32,0.6)",
        overflowY: "auto", display: "flex", flexDirection: "column",
      }}
    >
      {/* Watchlist */}
      <div className="panel-head"><span className="panel-title">Watchlist</span>
        <span className="label">{watchlist.length}</span></div>
      {watchQuotes.length === 0 ? (
        <div style={{ padding: "12px 14px", fontSize: 11.5, color: "var(--faint)" }}>
          Star any stock to track it here. Saved on this device.
        </div>
      ) : (
        watchQuotes.map((q) => (
          <Row key={q.symbol} symbol={q.symbol} name={q.name} price={q.display}
            changePct={q.changePct} onClick={() => navigate(`/stock/${q.symbol}`)} />
        ))
      )}

      {/* Alerts inbox */}
      {notices.length > 0 && (
        <>
          <div className="panel-head"><span className="panel-title">Alerts fired</span>
            <button className="chip" style={{ padding: "2px 8px", fontSize: 9 }} onClick={clearNotices}>CLEAR</button></div>
          {notices.slice(0, 5).map((n) => (
            <div key={n.id} style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--gold)" }}>
              🔔 {n.text}
              <div style={{ color: "var(--faint)", fontSize: 9.5, marginTop: 2 }}>{n.time}</div>
            </div>
          ))}
        </>
      )}

      {/* ─── Latest News ─── */}
      <div className="panel-head">
        <span className="panel-title">Latest News</span>
        <span className="pulse-dot" style={{ background: "var(--up)", boxShadow: "0 0 5px var(--up)" }} />
      </div>
      {news.length === 0 ? (
        <div style={{ padding: "12px 14px", fontSize: 11, color: "var(--faint)" }}>
          Loading latest headlines…
        </div>
      ) : (
        news.slice(0, 5).map((a) => (
          <a
            key={a.id}
            href={a.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block", padding: "9px 12px",
              borderBottom: "1px solid var(--line)", textDecoration: "none",
              cursor: "pointer", transition: "background .13s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "rgba(79,141,255,0.06)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
              <span
                style={{
                  fontFamily: "var(--mono)", fontSize: 8.5, fontWeight: 700,
                  color: a.sentiment === "Bullish" ? "var(--up)" : a.sentiment === "Bearish" ? "var(--down)" : "var(--muted)",
                }}
              >
                {a.sentiment === "Bullish" ? "▲" : a.sentiment === "Bearish" ? "▼" : "●"}
              </span>
              <span
                className="label"
                style={{ fontSize: 8.5, color: "var(--gold)" }}
              >
                {a.source}
              </span>
              <span className="label" style={{ fontSize: 8.5, marginLeft: "auto" }}>
                {timeAgo(a.minutesAgo)}
              </span>
            </div>
            <div style={{
              fontSize: 11.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {a.title}
            </div>
            {a.url && (
              <div style={{
                fontFamily: "var(--mono)", fontSize: 8, fontWeight: 700,
                color: "var(--blue)", marginTop: 3, letterSpacing: "0.1em",
              }}>
                READ ↗
              </div>
            )}
          </a>
        ))
      )}
      <button
        className="chip"
        onClick={() => navigate("/news")}
        style={{
          margin: "8px 12px", fontSize: 10, padding: "5px 10px",
          textAlign: "center", display: "block",
        }}
      >
        VIEW ALL NEWS →
      </button>

      {/* Movers */}
      <div className="panel-head"><span className="panel-title">Top gainers</span></div>
      {movers.gainers.map((q) => (
        <Row key={q.symbol} symbol={q.symbol} name={q.name} price={q.display}
          changePct={q.changePct} onClick={() => navigate(`/stock/${q.symbol}`)} />
      ))}
      <div className="panel-head"><span className="panel-title">Top losers</span></div>
      {movers.losers.map((q) => (
        <Row key={q.symbol} symbol={q.symbol} name={q.name} price={q.display}
          changePct={q.changePct} onClick={() => navigate(`/stock/${q.symbol}`)} />
      ))}
    </aside>
  );
}
