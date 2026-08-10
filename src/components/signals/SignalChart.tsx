import { useMemo } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ReferenceArea, CartesianGrid,
} from "recharts";
import type { Signal } from "../../lib/signals/types";
import { historyFor } from "../../lib/market";
import { quoteSymbolFor } from "../../lib/signals/api";
import { fmtPx } from "../../lib/signals/format";

export default function SignalChart({ signal }: { signal: Signal }) {
  const sym = quoteSymbolFor(signal);
  const data = useMemo(() => {
    const { candles } = historyFor(sym, "1M");
    return candles
      .filter((c) => c.t >= signal.createdAt - 7 * 86400000)
      .map((c) => ({
        t: c.t,
        label: new Date(c.t).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        price: c.c,
        high: c.h,
        low: c.l,
      }));
  }, [sym, signal.createdAt]);

  return (
    <div className="panel" style={{ padding: 12 }}>
      <div className="panel-head" style={{ border: "none", paddingBottom: 4 }}>
        <span className="panel-title">PRICE · ENTRY / TARGET / STOP</span>
      </div>
      <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(150,174,216,0.08)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#616C82", fontSize: 10, fontFamily: "var(--mono)" }} axisLine={false} tickLine={false} />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fill: "#616C82", fontSize: 10, fontFamily: "var(--mono)" }}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(v) => fmtPx(Number(v), signal.signalPrice)}
            />
            <Tooltip
              contentStyle={{ background: "#0C1320", border: "1px solid rgba(150,174,216,0.2)", borderRadius: 6 }}
              labelStyle={{ color: "#939DB1", fontFamily: "var(--mono)", fontSize: 11 }}
              itemStyle={{ color: "#F3F6FC", fontFamily: "var(--mono)", fontSize: 12 }}
            />
            <ReferenceArea
              y1={signal.entryLow}
              y2={signal.entryHigh}
              fill="rgba(79,141,255,0.12)"
              strokeOpacity={0}
            />
            <ReferenceLine y={signal.targetPrice} stroke="var(--up)" strokeDasharray="4 4" label={{ value: "TARGET", fill: "var(--up)", fontSize: 10, fontFamily: "var(--mono)" }} />
            <ReferenceLine y={signal.stopPrice} stroke="var(--down)" strokeDasharray="4 4" label={{ value: "STOP", fill: "var(--down)", fontSize: 10, fontFamily: "var(--mono)" }} />
            <ReferenceLine
              x={data.find((d) => d.t >= signal.createdAt)?.label}
              stroke="var(--gold)"
              strokeDasharray="3 3"
            />
            <Line type="monotone" dataKey="price" stroke="var(--cyan)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="label" style={{ marginTop: 6 }}>
        Gold marker ≈ signal publish · blue band = entry zone · green target · red stop
      </div>
    </div>
  );
}
