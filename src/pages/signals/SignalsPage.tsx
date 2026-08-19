import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSeo } from "../../lib/seo";
import { bootstrapSignals, isDemoMode } from "../../lib/signals/api";
import { marketsForFilter } from "../../lib/signals/assets";
import { computePerformance } from "../../lib/signals/performance";
import { fmtPct, sameDay, todayKey, yesterdayKey } from "../../lib/signals/format";
import type { Signal } from "../../lib/signals/types";
import SignalCard from "../../components/signals/SignalCard";
import SignalStatusBadge, {
  DemoBanner,
  SignalsDisclaimer,
} from "../../components/signals/SignalStatusBadge";
import { SignalFiltersBar } from "../../components/signals/SignalsHomeWidget";

export default function SignalsPage() {
  useSeo({
    title: "GFT Signals — AI Market Forecasts",
    description: "Deep learning & sentiment driven market forecasts. Tracked in public.",
    path: "/terminal/signals",
  });

  const [signals, setSignals] = useState<Signal[]>([]);
  const [market, setMarket] = useState("ALL");
  const [direction, setDirection] = useState("ALL");
  const [sort, setSort] = useState("confidence");

  useEffect(() => {
    setSignals(bootstrapSignals());
  }, []);

  const metrics = useMemo(() => {
    const day = new Date().toISOString().slice(0, 10);
    const todays = signals.filter((s) => new Date(s.createdAt).toISOString().slice(0, 10) === day);
    const stats = computePerformance(signals);
    const cutoff = Date.now() - 30 * 86400000;
    const return30d = signals
      .filter((s) => (s.resolvedAt ?? 0) >= cutoff && s.realizedReturn != null)
      .reduce((a, s) => a + (s.realizedReturn ?? 0), 0);
    return {
      todaysCount: todays.length,
      active: signals.filter((s) => s.status === "ACTIVE").length,
      targetsHitToday: todays.filter((s) => s.status === "TARGET_HIT").length,
      winRate: stats.winRate,
      return30d,
      streak: stats.currentStreak,
      profitFactor: stats.profitFactor,
    };
  }, [signals]);

  const today = todayKey();
  const yday = yesterdayKey();

  const todays = useMemo(() => {
    let list = signals.filter((s) => sameDay(s.createdAt, today));
    const markets = marketsForFilter(market);
    if (markets) list = list.filter((s) => markets.includes(s.market) || (market === "INDICES" && s.assetType === "INDEX") || (market === "EQUITIES" && s.assetType === "EQUITY") || (market === "COMMODITIES" && s.assetType === "COMMODITY") || (market === "FX" && s.assetType === "FX") || (market === "CRYPTO" && s.assetType === "CRYPTO") || (market === "FUTURES" && s.assetType === "FUTURES") || (market === "OPTIONS" && s.assetType === "OPTIONS"));
    if (market === "INDICES") list = list.filter((s) => s.assetType === "INDEX");
    if (market === "EQUITIES") list = list.filter((s) => s.assetType === "EQUITY");
    if (direction !== "ALL") list = list.filter((s) => s.direction === direction);
    list = [...list].sort((a, b) => {
      if (sort === "expected") return Math.abs(b.expectedMove) - Math.abs(a.expectedMove);
      if (sort === "newest") return b.createdAt - a.createdAt;
      if (sort === "rr") return b.riskReward - a.riskReward;
      return b.confidence - a.confidence;
    });
    return list;
  }, [signals, market, direction, sort, today]);

  const yesterday = useMemo(() => signals.filter((s) => sameDay(s.createdAt, yday)), [signals, yday]);
  const yHits = yesterday.filter((s) => s.status === "TARGET_HIT").length;
  const yStops = yesterday.filter((s) => s.status === "STOP_HIT").length;
  const yReturn = yesterday.reduce((a, s) => a + (s.realizedReturn ?? 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // Bento Box Styles
  const bentoCardStyle = {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "16px",
    padding: "20px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
    overflow: "hidden" as const,
  };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div className="label" style={{ color: "var(--gold)", letterSpacing: "0.15em", marginBottom: 4 }}>
            AI PREDICTION ENGINE · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}
          </div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "0.02em" }}>Market Signals</h1>
        </div>
        <DemoBanner demo={isDemoMode()} />
      </div>

      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="show"
        style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16 }}
      >
        {/* KPI Row (Bento Grid) */}
        <motion.div variants={itemVariants} style={{ ...bentoCardStyle, gridColumn: "span 3", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="label" style={{ color: "var(--muted)" }}>TODAY'S SIGNALS</div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--mono)", marginTop: 8 }}>{metrics.todaysCount}</div>
          <div style={{ fontSize: 13, color: "var(--gold)", marginTop: 4 }}>{metrics.active} Active Now</div>
        </motion.div>
        
        <motion.div variants={itemVariants} style={{ ...bentoCardStyle, gridColumn: "span 3", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="label" style={{ color: "var(--muted)" }}>AI WIN RATE</div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--mono)", marginTop: 8, color: "var(--purple)" }}>
            {metrics.winRate == null ? "—" : `${(metrics.winRate * 100).toFixed(1)}%`}
          </div>
          <div style={{ fontSize: 13, color: "var(--faint)", marginTop: 4 }}>Across all asset classes</div>
        </motion.div>

        <motion.div variants={itemVariants} style={{ ...bentoCardStyle, gridColumn: "span 3", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="label" style={{ color: "var(--muted)" }}>PROFIT FACTOR</div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--mono)", marginTop: 8, color: "var(--up)" }}>
            {metrics.profitFactor == null ? "—" : metrics.profitFactor.toFixed(2)}
          </div>
          <div style={{ fontSize: 13, color: "var(--faint)", marginTop: 4 }}>Gross Profit / Gross Loss</div>
        </motion.div>

        <motion.div variants={itemVariants} style={{ ...bentoCardStyle, gridColumn: "span 3", display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div className="label" style={{ color: "var(--muted)" }}>30D RETURN (EST)</div>
          <div style={{ fontSize: 36, fontWeight: 800, fontFamily: "var(--mono)", marginTop: 8, color: metrics.return30d >= 0 ? "var(--up)" : "var(--down)" }}>
            {fmtPct(metrics.return30d)}
          </div>
          <div style={{ fontSize: 13, color: "var(--faint)", marginTop: 4 }}>Current Streak: {metrics.streak}</div>
        </motion.div>

        {/* Left Column: Today's Signals */}
        <motion.div variants={itemVariants} style={{ gridColumn: "span 8" }}>
          <div style={{ ...bentoCardStyle, height: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>LIVE PREDICTIONS</h2>
            </div>
            
            <SignalFiltersBar market={market} setMarket={setMarket} direction={direction} setDirection={setDirection} sort={sort} setSort={setSort} />
            
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {todays.length === 0 ? (
                <div style={{ gridColumn: "span 2", padding: 40, textAlign: "center", color: "var(--muted)", background: "rgba(0,0,0,0.2)", borderRadius: 8 }}>
                  No signals match these filters today. The AI model only publishes when conviction clears the threshold.
                </div>
              ) : (
                todays.map((s) => <SignalCard key={s.id} signal={s} />)
              )}
            </div>
          </div>
        </motion.div>

        {/* Right Column: End of Day Review */}
        <motion.div variants={itemVariants} style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ ...bentoCardStyle, flex: 1, background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.2) 100%)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 12, marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--gold)" }}>END OF DAY REVIEW</h2>
              <span className="label">YESTERDAY</span>
            </div>

            {yesterday.length === 0 ? (
              <div style={{ color: "var(--muted)", fontSize: 14, textAlign: "center", padding: "20px 0" }}>No predictions on record for yesterday.</div>
            ) : (
              <>
                {/* Big summary stat */}
                <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                  <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="label">WIN RATE</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "var(--up)", fontFamily: "var(--mono)", marginTop: 4 }}>
                      {((yHits / yesterday.length) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div style={{ flex: 1, background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 16, textAlign: "center", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div className="label">NET RETURN</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: yReturn >= 0 ? "var(--up)" : "var(--down)", fontFamily: "var(--mono)", marginTop: 4 }}>
                      {fmtPct(yReturn)}
                    </div>
                  </div>
                </div>

                <div className="label" style={{ marginBottom: 8 }}>PREDICTION BREAKDOWN ({yesterday.length})</div>
                <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
                  <div style={{ width: `${(yHits/yesterday.length)*100}%`, background: "var(--up)" }} title={`${yHits} Targets Hit`} />
                  <div style={{ width: `${(yStops/yesterday.length)*100}%`, background: "var(--down)" }} title={`${yStops} Stops Hit`} />
                  <div style={{ flex: 1, background: "var(--muted)" }} title="Expired/Ambiguous" />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto", paddingRight: 4 }}>
                  {yesterday.map((s) => (
                    <Link key={s.id} to={`/terminal/signals/${s.id}`} style={{ 
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "10px 12px", background: "rgba(255,255,255,0.02)", borderRadius: 8,
                      textDecoration: "none", color: "inherit", border: "1px solid transparent",
                      transition: "border 0.2s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = "transparent")}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{s.symbol}</div>
                        <div style={{ fontSize: 11, color: "var(--faint)", marginTop: 2 }}>{s.assetType}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <SignalStatusBadge status={s.status} />
                        <div className="mono" style={{ fontSize: 12, color: (s.realizedReturn ?? 0) >= 0 ? "var(--up)" : "var(--down)", marginTop: 4 }}>
                          {s.realizedReturn == null ? "—" : fmtPct(s.realizedReturn)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <Link to="/terminal/signals/history" className="chip" style={{ display: "inline-block", textDecoration: "none", padding: "8px 16px" }}>
                    VIEW FULL HISTORY
                  </Link>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
      
      <div style={{ marginTop: 24 }}>
        <SignalsDisclaimer />
      </div>
    </div>
  );
}
