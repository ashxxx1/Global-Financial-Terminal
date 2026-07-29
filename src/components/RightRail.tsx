import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "../lib/hooks";
import { topMovers, subscribe } from "../lib/market";
import { useTerminal } from "../store";
import { fetchBreakingNews, timeAgo, type LiveArticle } from "../lib/newsFeed";
import Sparkline from "./Sparkline";
import AnimatedNumber from "./AnimatedNumber";
import MarketSessions from "./MarketSessions";
import BreadthBar from "./BreadthBar";
import { track } from "../lib/analytics";

/** Market row: symbol + name, a sparkline of where it has been, and the number. */
function Row({ symbol, name, price, changePct, rank, onClick }: {
  symbol: string; name: string; price: string; changePct: number;
  rank?: number; onClick: () => void;
}) {
  const up = changePct >= 0;
  return (
    <button className="mrow" onClick={onClick} aria-label={`${symbol}, ${name}, ${price}, ${changePct.toFixed(2)} percent`}>
      <span style={{ minWidth: 0 }}>
        <span className="mrow-sym">
          {rank != null && <span className="rank">{rank}</span>}
          {symbol}
        </span>
        <span className="mrow-name">{name}</span>
      </span>
      <Sparkline symbol={symbol} tone={up ? "var(--up)" : "var(--down)"} />
      <span className="mrow-right">
        <span className="mrow-price mono">{price}</span>
        <span className="mrow-chg mono" style={{ color: up ? "var(--up)" : "var(--down)" }}>
          {up ? "▲" : "▼"} {Math.abs(changePct).toFixed(2)}%
        </span>
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

  // Re-derive movers on the shared market clock so the rail actually moves.
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  const movers = useMemo(() => topMovers(5), [tick]);

  const [news, setNews] = useState<LiveArticle[]>([]);
  const [newsFailed, setNewsFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      fetchBreakingNews(5)
        .then((articles) => {
          if (cancelled) return;
          if (articles.length) setNews(articles);
          else setNewsFailed(true);
        })
        .catch(() => { if (!cancelled) setNewsFailed(true); });
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
      {/* Sessions and breadth answer "what is the market doing right now",
          which belongs above anything instrument-specific. */}
      <MarketSessions />
      <BreadthBar tick={tick} />

      {/* Watchlist */}
      <div className="sec-head">
        <span className="panel-title">Watchlist</span>
        <span className="label">{watchlist.length}</span>
      </div>
      {watchQuotes.length === 0 ? (
        <div className="empty-state">
          <span className="es-icon">☆</span>
          <span className="es-text">Star any stock to track it here.<br />Saved on this device.</span>
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
          <div className="sec-head">
            <span className="panel-title">Alerts fired</span>
            <button className="chip" style={{ padding: "2px 8px", fontSize: 9 }} onClick={clearNotices}>CLEAR</button>
          </div>
          {notices.slice(0, 5).map((n) => (
            <div key={n.id} className="fade-in" style={{ padding: "8px 12px", borderBottom: "1px solid var(--line)", fontSize: 11, color: "var(--gold)" }}>
              🔔 {n.text}
              <div style={{ color: "var(--faint)", fontSize: 9.5, marginTop: 2 }}>{n.time}</div>
            </div>
          ))}
        </>
      )}

      {/* Latest news */}
      <div className="sec-head">
        <span className="panel-title">Latest news</span>
        <span className="pulse-dot" style={{ background: news.length ? "var(--up)" : "var(--faint)", boxShadow: news.length ? "0 0 5px var(--up)" : "none" }} />
      </div>
      {news.length === 0 ? (
        newsFailed ? (
          <div className="empty-state">
            <span className="es-icon">⚠</span>
            <span className="es-text">Headlines unavailable right now.<br />Retrying every 5 minutes.</span>
          </div>
        ) : (
          // Skeletons beat a "Loading…" string — the layout does not jump when
          // the real headlines land.
          <div style={{ padding: "10px 12px" }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div className="skeleton" style={{ height: 8, width: "42%", marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 9, width: "94%", marginBottom: 4 }} />
                <div className="skeleton" style={{ height: 9, width: "68%" }} />
              </div>
            ))}
          </div>
        )
      ) : (
        news.slice(0, 5).map((a) => (
          <a
            key={a.id}
            href={a.url || undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="fade-in news-row"
            onClick={() => track("news_clicked", { source: a.source })}
            style={{
              display: "block", padding: "9px 12px",
              borderBottom: "1px solid var(--line)", textDecoration: "none",
              transition: "background .15s",
            }}
          >
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
              <span style={{
                fontFamily: "var(--mono)", fontSize: 8.5, fontWeight: 700,
                color: a.sentiment === "Bullish" ? "var(--up)" : a.sentiment === "Bearish" ? "var(--down)" : "var(--muted)",
              }}>
                {a.sentiment === "Bullish" ? "▲" : a.sentiment === "Bearish" ? "▼" : "●"}
              </span>
              <span className="label" style={{ fontSize: 8.5, color: "var(--gold)" }}>{a.source}</span>
              <span className="label" style={{ fontSize: 8.5, marginLeft: "auto" }}>{timeAgo(a.minutesAgo)}</span>
            </div>
            <div style={{
              fontSize: 11.5, fontWeight: 600, color: "var(--text)", lineHeight: 1.35,
              overflow: "hidden", display: "-webkit-box",
              WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {a.title}
            </div>
          </a>
        ))
      )}
      <button className="chip" onClick={() => navigate("/news")}
        style={{ margin: "8px 12px", fontSize: 10, padding: "5px 10px", textAlign: "center", display: "block" }}>
        VIEW ALL NEWS →
      </button>

      {/* Movers */}
      <div className="sec-head">
        <span className="panel-title">Top gainers</span>
        <span className="label" style={{ color: "var(--up)" }}>24H</span>
      </div>
      {movers.gainers.map((q, i) => (
        <Row key={q.symbol} rank={i + 1} symbol={q.symbol} name={q.name} price={q.display}
          changePct={q.changePct} onClick={() => navigate(`/stock/${q.symbol}`)} />
      ))}

      <div className="sec-head">
        <span className="panel-title">Top losers</span>
        <span className="label" style={{ color: "var(--down)" }}>24H</span>
      </div>
      {movers.losers.map((q, i) => (
        <Row key={q.symbol} rank={i + 1} symbol={q.symbol} name={q.name} price={q.display}
          changePct={q.changePct} onClick={() => navigate(`/stock/${q.symbol}`)} />
      ))}

      <div style={{ height: 12 }} />
    </aside>
  );
}
