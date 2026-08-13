import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { fmtPct } from "../../lib/signals/format";

export default function PerformanceChart({
  series,
}: {
  series: Array<{ date: string; cumulativeReturn: number }>;
}) {
  const data = series.map((s) => ({
    date: s.date.slice(5),
    value: s.cumulativeReturn * 100,
  }));

  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="panel-head" style={{ border: "none", paddingBottom: 4 }}>
        <span className="panel-title">HYPOTHETICAL MODEL PERFORMANCE</span>
      </div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="cumFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#616C82", fontSize: 10, fontFamily: "var(--mono)" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "#616C82", fontSize: 10, fontFamily: "var(--mono)" }}
              axisLine={false}
              tickLine={false}
              width={48}
              tickFormatter={(v) => `${v.toFixed(1)}%`}
            />
            <Tooltip
              contentStyle={{ background: "#0B0B0B", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 6 }}
              formatter={(v) => [fmtPct(Number(v) / 100), "Cumulative"]}
            />
            <Area type="monotone" dataKey="value" stroke="var(--gold)" fill="url(#cumFill)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="label" style={{ marginTop: 6 }}>
        Equal-notional allocation · Hypothetical model performance — not actual client returns
      </div>
    </div>
  );
}
