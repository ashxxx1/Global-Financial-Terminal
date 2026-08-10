import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useSeo } from "../lib/seo";
import { track } from "../lib/analytics";

export default function Macro() {
  useSeo({
    title: "Global Macro Dashboard — GFT",
    description: "Global macroeconomic indicators: Interest rates, inflation, and central bank monitors.",
    path: "/macro",
  });
  useMemo(() => track("page_view", { page: "/macro" }), []);

  // Simulated Macro Data
  const fedFundsData = useMemo(() => {
    const data = [];
    let rate = 0.25;
    let spy = 4000;
    for (let i = 0; i < 24; i++) {
      if (i > 6 && i < 16) rate += 0.5;
      else if (i >= 16) rate -= 0.25;
      spy = spy * (1 + (Math.random() * 0.04 - 0.015));
      data.push({ month: `M${i + 1}`, rate: Math.max(0, rate).toFixed(2), spy: spy.toFixed(0) });
    }
    return data;
  }, []);

  const inflationData = [
    { country: "United States", cpi: "3.2%", target: "2.0%", trend: "down" },
    { country: "Eurozone", cpi: "2.4%", target: "2.0%", trend: "down" },
    { country: "United Kingdom", cpi: "4.0%", target: "2.0%", trend: "down" },
    { country: "Japan", cpi: "2.8%", target: "2.0%", trend: "up" },
    { country: "China", cpi: "-0.8%", target: "3.0%", trend: "down" },
    { country: "Canada", cpi: "2.9%", target: "2.0%", trend: "down" },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: "0 0 8px 0", fontSize: 28, fontFamily: "var(--mono)", letterSpacing: "-0.02em" }}>
          Global Macro Dashboard <span className="demo-tag">SIM</span>
        </h1>
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 15 }}>
          Central bank rates, inflation heatmaps, and economic indicators.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
        
        {/* Fed Funds vs SPY */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Fed Funds Rate vs S&P 500 (Simulated)</span>
          </div>
          <div className="panel-body" style={{ height: 350, padding: 16 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fedFundsData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
                <XAxis dataKey="month" stroke="var(--faint)" tick={{ fill: "var(--faint)", fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="var(--cyan)" tick={{ fill: "var(--cyan)", fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--gold)" tick={{ fill: "var(--gold)", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 6 }}
                  itemStyle={{ fontSize: 12, fontFamily: "var(--mono)" }}
                />
                <Line yAxisId="left" type="monotone" dataKey="rate" stroke="var(--cyan)" strokeWidth={2} dot={false} name="Fed Rate %" />
                <Line yAxisId="right" type="monotone" dataKey="spy" stroke="var(--gold)" strokeWidth={2} dot={false} name="S&P 500" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Inflation Monitor */}
        <div className="panel">
          <div className="panel-head">
            <span className="panel-title">Global CPI vs Targets</span>
          </div>
          <div className="panel-body" style={{ padding: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Region</th>
                  <th className="num">CPI (YoY)</th>
                  <th className="num">Target</th>
                  <th style={{ textAlign: "right" }}>Trend</th>
                </tr>
              </thead>
              <tbody>
                {inflationData.map((d) => {
                  const hot = parseFloat(d.cpi) > parseFloat(d.target);
                  return (
                    <tr key={d.country}>
                      <td style={{ fontWeight: 600 }}>{d.country}</td>
                      <td className="num" style={{ color: hot ? "var(--down)" : "var(--up)" }}>{d.cpi}</td>
                      <td className="num" style={{ color: "var(--muted)" }}>{d.target}</td>
                      <td style={{ textAlign: "right", color: d.trend === "up" ? "var(--up)" : "var(--down)" }}>
                        {d.trend === "up" ? "▲" : "▼"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
