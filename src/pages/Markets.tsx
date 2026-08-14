import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIndices } from "../lib/hooks";
import { topMovers } from "../lib/market";
import type { Quote } from "../lib/market";
import ProvenanceBadge from "../components/ProvenanceBadge";
import AlertManager, { RecentlyViewed } from "../components/AlertManager";
import SectorHeatmap from "../components/SectorHeatmap";
import PulseGauge from "../components/PulseGauge";
import { useSeo } from "../lib/seo";
import { subscribe } from "../lib/market";
import { useEffect } from "react";
import { useTerminal } from "../store";
import { proxyFor } from "../lib/feeds/proxies";

const GROUPS = ["INDICES", "FX", "CRYPTO", "COMMODITIES", "MOVERS"] as const;

export default function Markets() {
  const navigate = useNavigate();
  const savedCompare = useTerminal((s) => s.savedCompare);
  useSeo({
    title: "Global Markets — Indices, FX, Crypto & Commodities",
    description: "Live global market data: world indices, currencies, crypto and commodities, plus a sector heat map and market-pulse gauge.",
    path: "/markets",
  });
  const all = useIndices();
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("INDICES");
  // Re-render on the shared market clock. The value is unused — the point is
  // the state change — so it is named with a leading underscore.
  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);
  const movers = useMemo(() => topMovers(10), []);

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
        {/* Item 2: provenance follows the selected group — crypto really is
            live, FX is an ECB daily fix, indices/commodities are simulated.
            One badge saying "SIM" for all of them was simply wrong. */}
        <ProvenanceBadge
          kind={group === "FX" ? "fx" : group === "CRYPTO" ? "crypto"
            : group === "COMMODITIES" ? "commodity" : group === "MOVERS" ? "stock" : "index"}
          source={rows.some((q) => q.source === "live") ? "live" : "sim"}
          name={rows.find((q) => q.source === "live")?.name}
        />
        <button
          type="button"
          className="chip"
          onClick={() => navigate("/compare/AAPL/MSFT")}
          title="Overlay two stock charts"
        >
          COMPARE CHARTS
        </button>
        {savedCompare.length > 0 && (
          <span style={{ display: "flex", gap: 6, alignItems: "center" }} aria-label="Saved compare pairs">
            {savedCompare.slice(0, 3).map((p) => (
              <button key={`${p.a}-${p.b}`} type="button" className="chip"
                onClick={() => navigate(`/compare/${p.a}/${p.b}`)}>{p.a}·{p.b}</button>
            ))}
          </span>
        )}
        <div style={{ display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }}>
          {GROUPS.map((g) => (
            <button key={g} className={`chip ${group === g ? "active" : ""}`} onClick={() => setGroup(g)}>{g}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 260px", gap: 14, marginBottom: 14, alignItems: "start" }}>
        <SectorHeatmap onOpen={(sym) => navigate(`/stock/${sym}`)} />
        <PulseGauge />
      </div>

      {/* Items 72 & 78 — alerts you can see and manage, and a way back in. */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 14, alignItems: "start" }}>
        <AlertManager />
        <RecentlyViewed />
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
                      <td style={{ fontWeight: 600 }}>
                        {q.name}
                        {q.source === "live" && proxyFor(q.name) && (
                          <span className="via" title={`Priced from ${proxyFor(q.name)!.etf} — ${proxyFor(q.name)!.note}`}>
                            {proxyFor(q.name)!.etf}
                          </span>
                        )}
                      </td>
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
