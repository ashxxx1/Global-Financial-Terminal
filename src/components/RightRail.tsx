import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuotes } from "../lib/hooks";
import { topMovers } from "../lib/market";
import { useTerminal } from "../store";

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
