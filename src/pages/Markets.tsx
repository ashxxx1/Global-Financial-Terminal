import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIndices } from "../lib/hooks";
import { topMovers } from "../lib/market";
import type { Quote } from "../lib/market";
import SourceBadge from "../components/SourceBadge";
import SectorHeatmap from "../components/SectorHeatmap";
import PulseGauge from "../components/PulseGauge";
import { useSeo } from "../lib/seo";
import { subscribe } from "../lib/market";
import { useEffect } from "react";

const GROUPS = ["INDICES", "FX", "CRYPTO", "COMMODITIES", "MOVERS"] as const;

export default function Markets() {
  const navigate = useNavigate();
  useSeo({
    title: "Global Markets — Indices, FX, Crypto & Commodities",
    description: "Live global market data: world indices, currencies, crypto and commodities, plus a sector heat map and market-pulse gauge.",
    path: "/markets",
  });
  const all = useIndices();
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("INDICES");
  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  const movers = useMemo(() => topMovers(10), [tick]);

  const rows: Quote[] =
    group === "INDICES" ? all.filter((q) => q.kind === "index")
    : group === "FX" ? all.filter((q) => q.kind === "fx")
    : group === "CRYPTO" ? all.filter((q) => q.kind === "crypto")
    : group === "COMMODITIES" ? all.filter((q) => q.kind === "commodity")
    : [];

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Global Markets</h1>
        <SourceBadge source="sim" />
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {GROUPS.map((g) => (
            <button key={g} className={`chip ${group === g ? "active" : ""}`} onClick={() => setGroup(g)}>{g}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px", gap: 14, marginBottom: 14, alignItems: "start" }}>
        <SectorHeatmap tick={tick} onOpen={(sym) => navigate(`/stock/${sym}`)} />
        <PulseGauge tick={tick} />
      </div>

      {group !== "MOVERS" ? (
        <div className="panel" style={{ overflow: "hidden" }}>
          <div style={{ maxHeight: "68vh", overflowY: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Name</th><th className="num">Last</th><th className="num">1D %</th></tr></thead>
              <tbody>
                {rows.map((q) => {
                  const up = q.changePct >= 0;
                  return (
                    <tr key={q.symbol} style={{ cursor: "default" }}>
                      <td style={{ fontWeight: 600 }}>{q.name}</td>
                      <td className="num" style={{ fontWeight: 700 }}>{q.display}</td>
                      <td className="num" style={{ color: up ? "var(--up)" : "var(--down)" }}>{up ? "+" : ""}{q.changePct.toFixed(2)}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14 }}>
          <MoverTable title="Top gainers" rows={movers.gainers} onOpen={(s) => navigate(`/stock/${s}`)} />
          <MoverTable title="Top losers" rows={movers.losers} onOpen={(s) => navigate(`/stock/${s}`)} />
        </div>
      )}
    </div>
  );
}

function MoverTable({ title, rows, onOpen }: { title: string; rows: Quote[]; onOpen: (s: string) => void }) {
  return (
    <div className="panel" style={{ overflow: "hidden" }}>
      <div className="panel-head"><span className="panel-title">{title}</span></div>
      <table className="tbl">
        <tbody>
          {rows.map((q) => {
            const up = q.changePct >= 0;
            return (
              <tr key={q.symbol} onClick={() => onOpen(q.symbol)}>
                <td className="mono" style={{ fontWeight: 700, width: 76 }}>{q.symbol}</td>
                <td style={{ fontSize: 12.5 }}>{q.name}</td>
                <td className="num" style={{ color: up ? "var(--up)" : "var(--down)", fontWeight: 700 }}>
                  {up ? "+" : ""}{q.changePct.toFixed(2)}%
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
