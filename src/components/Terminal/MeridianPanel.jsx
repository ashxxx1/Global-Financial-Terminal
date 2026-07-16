/**
 * MeridianPanel.jsx — redesigned right panel matching MERIDIAN UI handoff.
 *
 * Glassmorphism design with 4 tabs:
 * - Overview: index + FX + AI sentiment
 * - News: market narrative + AI analysis cards
 * - Markets: sector performance + gainers/losers
 * - Economy: macro indicators + latest headlines
 *
 * Integrated with lens selector and backend data.
 */
import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { intelApi } from "../../services/intelApi";

const GLASS_BG = "rgba(9,11,16,0.86)";
const BORDER_SUBTLE = "rgba(255,255,255,0.08)";
const BORDER_ACCENT = "rgba(255,255,255,0.1)";
const TEXT_PRIMARY = "#f2f4f8";
const TEXT_SECONDARY = "#8a93a3";
const TEXT_MUTED = "#5b6472";
const GREEN_UP = "#39d6a3";
const RED_DOWN = "#ff5b68";
const NEUTRAL = "#8793a5";

const TABS = ["overview", "news", "markets", "economy"];
const TAB_LABELS = {
  overview: "Overview",
  news: "News",
  markets: "Markets",
  economy: "Economy",
};

function MeridianPanel({ country, onClose, lens = "markets", onLensChange = () => {} }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [markets, setMarkets] = useState(null);
  const [economy, setEconomy] = useState(null);

  useEffect(() => {
    if (!country) return;
    setLoading(true);
    setActiveTab("overview");
    Promise.all([
      intelApi.markets(country.properties?.ISO_A2 || country.code),
      intelApi.economy(country.properties?.ISO_A2 || country.code),
    ])
      .then(([m, e]) => {
        setMarkets(m);
        setEconomy(e);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [country]);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  if (!country) return null;

  const countryCode = country.properties?.ISO_A2 || country.code || "XX";
  const countryName = country.properties?.ADMIN || country.name || "Unknown";
  const marketOpen = markets?.marketOpen !== false;
  const indexValue = markets?.indices?.[0]?.price || 7575.39;
  const indexChange = markets?.indices?.[0]?.changePct || 0.42;
  const fxRate = markets?.indices?.[1]?.price || 1.0876;
  const fxChange = markets?.indices?.[1]?.changePct || 0.15;
  const gdp = economy?.indicators?.gdpGrowth?.value || 2.2;
  const inflation = economy?.indicators?.inflation?.value || 2.9;
  const rate = economy?.indicators?.rate?.value || 5.2;

  const renderSkeleton = () => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER_SUBTLE}`, borderRadius: "10px", padding: "14px", height: "96px", overflow: "hidden", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)", animation: "shimmer 1.3s infinite" }} />
    </div>
  );

  const Card = ({ children }) => (
    <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER_SUBTLE}`, borderRadius: "10px", padding: "14px" }}>
      {children}
    </div>
  );

  const renderTabContent = () => {
    if (loading) return renderSkeleton();

    switch (activeTab) {
      case "overview":
        return (
          <>
            <Card>
              <div style={{ color: TEXT_MUTED, fontSize: "11px", letterSpacing: "0.06em", marginBottom: "6px" }}>{markets?.indices?.[0]?.name || "INDEX"}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <div style={{ color: TEXT_PRIMARY, fontSize: "24px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{indexValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div style={{ color: indexChange >= 0 ? GREEN_UP : RED_DOWN, fontSize: "14px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {indexChange >= 0 ? "+" : ""}{indexChange.toFixed(2)}%
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ color: TEXT_MUTED, fontSize: "11px", letterSpacing: "0.06em", marginBottom: "8px" }}>FX — {markets?.indices?.[1]?.name || "USD"}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <div style={{ color: TEXT_PRIMARY, fontSize: "20px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{fxRate.toFixed(4)}</div>
                <div style={{ color: fxChange >= 0 ? GREEN_UP : RED_DOWN, fontSize: "13px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                  {fxChange >= 0 ? "+" : ""}{fxChange.toFixed(2)}%
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ color: TEXT_MUTED, fontSize: "11px", letterSpacing: "0.06em", marginBottom: "10px" }}>AI MARKET SENTIMENT</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px" }}>
                <div style={{ color: indexChange >= 0 ? GREEN_UP : RED_DOWN, fontSize: "17px", fontWeight: 800 }}>
                  {indexChange >= 0 ? "BULLISH" : "BEARISH"}
                </div>
                <div style={{ color: TEXT_MUTED, fontSize: "11.5px", fontFamily: "'JetBrains Mono', monospace" }}>82% confidence</div>
              </div>
              <div style={{ color: TEXT_SECONDARY, fontSize: "12px", lineHeight: 1.55 }}>
                Market sentiment positive. Strong corporate earnings + easing inflation expectations support risk appetite.
              </div>
            </Card>
          </>
        );

      case "news":
        return (
          <>
            <Card>
              <div style={{ color: TEXT_MUTED, fontSize: "11px", letterSpacing: "0.06em", marginBottom: "6px" }}>AI NEWS → MARKET NARRATIVE</div>
              <div style={{ color: "#c3cad6", fontSize: "12.5px", lineHeight: 1.6 }}>
                Business news shows resilience in key sectors. Technology leadership drives market leadership with strong growth catalysts.
              </div>
            </Card>
            {[
              { headline: "Central bank signals policy easing ahead", stance: "bullish", confidence: 85 },
              { headline: "Tech earnings beat expectations across board", stance: "bullish", confidence: 88 },
              { headline: "Supply chain pressures ease further", stance: "neutral", confidence: 72 },
            ].map((card, i) => (
              <Card key={i}>
                <div style={{ color: "#e8ecf3", fontSize: "12.5px", fontWeight: 650, lineHeight: 1.4, marginBottom: "8px" }}>{card.headline}</div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "9px" }}>
                  <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em", color: card.stance === "bullish" ? GREEN_UP : NEUTRAL, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "5px" }}>
                    {card.stance.toUpperCase()}
                  </span>
                  <span style={{ color: "#4c5666", fontSize: "10.5px", fontFamily: "'JetBrains Mono', monospace" }}>{card.confidence}% confidence</span>
                </div>
                <div style={{ color: TEXT_SECONDARY, fontSize: "11.5px", lineHeight: 1.55 }}>
                  {card.stance === "bullish" ? "Positive catalyst driving investor interest" : "Neutral headwinds, watch for updates"}
                </div>
              </Card>
            ))}
          </>
        );

      case "markets":
        return (
          <>
            <Card>
              <div style={{ color: TEXT_MUTED, fontSize: "11px", letterSpacing: "0.06em", marginBottom: "10px" }}>SECTOR PERFORMANCE</div>
              {[
                { name: "Technology", change: 2.34, pct: 65 },
                { name: "Banking", change: -0.85, pct: 40 },
                { name: "Energy", change: 1.12, pct: 55 },
                { name: "Healthcare", change: 0.45, pct: 50 },
                { name: "Utilities", change: -0.22, pct: 35 },
                { name: "Telecom", change: 1.89, pct: 60 },
              ].map((sec, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "6px 0" }}>
                  <div style={{ width: "78px", color: "#c3cad6", fontSize: "11.5px" }}>{sec.name}</div>
                  <div style={{ flex: 1, height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${sec.pct}%`, height: "100%", background: sec.change >= 0 ? GREEN_UP : RED_DOWN }} />
                  </div>
                  <div style={{ width: "56px", textAlign: "right", color: sec.change >= 0 ? GREEN_UP : RED_DOWN, fontSize: "11.5px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
                    {sec.change >= 0 ? "+" : ""}{sec.change.toFixed(2)}%
                  </div>
                </div>
              ))}
            </Card>

            <Card>
              <div style={{ color: TEXT_MUTED, fontSize: "11px", letterSpacing: "0.06em", marginBottom: "8px" }}>TOP GAINERS / LOSERS</div>
              {["INFY +3.21%", "TCS +2.87%", "WIPRO +1.54%"].map((gainer, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER_SUBTLE}` }}>
                  <div style={{ flex: 1, color: "#e8ecf3", fontSize: "11.5px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{gainer.split(" ")[0]}</div>
                  <div style={{ textAlign: "right", color: GREEN_UP, fontSize: "10.5px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{gainer.split(" ")[1]}</div>
                </div>
              ))}
            </Card>
          </>
        );

      case "economy":
        return (
          <>
            <Card>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div>
                  <div style={{ color: TEXT_MUTED, fontSize: "10.5px", letterSpacing: "0.06em" }}>GDP GROWTH</div>
                  <div style={{ color: TEXT_PRIMARY, fontSize: "16px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>+{gdp.toFixed(1)}%</div>
                </div>
                <div>
                  <div style={{ color: TEXT_MUTED, fontSize: "10.5px", letterSpacing: "0.06em" }}>INTEREST RATE</div>
                  <div style={{ color: TEXT_PRIMARY, fontSize: "16px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{rate.toFixed(2)}%</div>
                </div>
                <div>
                  <div style={{ color: TEXT_MUTED, fontSize: "10.5px", letterSpacing: "0.06em" }}>INFLATION</div>
                  <div style={{ color: TEXT_PRIMARY, fontSize: "16px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{inflation.toFixed(1)}%</div>
                </div>
                <div>
                  <div style={{ color: TEXT_MUTED, fontSize: "10.5px", letterSpacing: "0.06em" }}>CREDIT RATING</div>
                  <div style={{ color: TEXT_PRIMARY, fontSize: "16px", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>A+</div>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ color: TEXT_MUTED, fontSize: "11px", letterSpacing: "0.06em", marginBottom: "10px" }}>LATEST NEWS</div>
              {[
                "Central bank signals policy easing ahead",
                "Government announces infrastructure spending plan",
                "Inflation data shows further decline",
              ].map((headline, i) => (
                <div key={i} style={{ padding: "9px 0", borderTop: i === 0 ? "none" : `1px solid ${BORDER_SUBTLE}`, color: "#c3cad6", fontSize: "12.5px", lineHeight: 1.5 }}>
                  {headline}
                </div>
              ))}
            </Card>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "400px",
        height: "100%",
        background: GLASS_BG,
        backdropFilter: "blur(18px)",
        borderLeft: `1px solid ${BORDER_ACCENT}`,
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        animation: "slideInRight 0.55s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "22px 22px 0", borderBottom: `1px solid ${BORDER_SUBTLE}`, flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "14px" }}>
          <div>
            <div style={{ color: TEXT_MUTED, fontSize: "11px", letterSpacing: "0.1em", marginBottom: "4px" }}>{countryCode}</div>
            <div style={{ color: TEXT_PRIMARY, fontSize: "22px", fontWeight: 800 }}>{countryName}</div>
          </div>
          <button
            onClick={onClose}
            style={{
              color: TEXT_SECONDARY,
              cursor: "pointer",
              fontSize: "20px",
              lineHeight: 1,
              padding: "6px",
              borderRadius: "6px",
              background: "transparent",
              border: "none",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = TEXT_PRIMARY;
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = TEXT_SECONDARY;
              e.currentTarget.style.background = "transparent";
            }}
          >
            ×
          </button>
        </div>

        {/* Status + Sentiment */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.05em", color: marketOpen ? GREEN_UP : TEXT_SECONDARY }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: marketOpen ? GREEN_UP : TEXT_SECONDARY }} />
            MARKET {marketOpen ? "OPEN" : "CLOSED"}
          </span>
          <span style={{ color: "#333c4a" }}>·</span>
          <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em", padding: "2px 8px", borderRadius: "5px", color: indexChange >= 0 ? GREEN_UP : RED_DOWN, background: "rgba(255,255,255,0.04)" }}>
            {indexChange >= 0 ? "BULLISH" : "BEARISH"}
          </span>
          <span style={{ marginLeft: "auto", color: "#3c4656", fontSize: "9.5px", letterSpacing: "0.05em" }}>SIMULATED</span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: "1px", borderBottom: `1px solid ${BORDER_SUBTLE}` }}>
          {TABS.map((tabId) => (
            <button
              key={`tab-${tabId}`}
              type="button"
              onClick={() => handleTabChange(tabId)}
              style={{
                padding: "10px 12px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
                color: activeTab === tabId ? TEXT_PRIMARY : TEXT_MUTED,
                borderBottom: `2px solid ${activeTab === tabId ? "#3ec6ff" : "transparent"}`,
                background: "transparent",
                border: "0 solid transparent",
                transition: "all 0.2s ease",
                flex: "1",
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tabId) e.currentTarget.style.color = TEXT_SECONDARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = activeTab === tabId ? TEXT_PRIMARY : TEXT_MUTED;
              }}
            >
              {TAB_LABELS[tabId]}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 22px 22px", display: "flex", flexDirection: "column", gap: "12px" }}>
        {renderTabContent()}
      </div>
    </div>
  );
}

export default MeridianPanel;
