import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { subscribe } from "../lib/market";
import { allCountries, countryTree, CAP_LABEL, CAP_RANGE, type CapBand } from "../lib/marketTree";
import { useSeo } from "../lib/seo";

/**
 * Markets, by country → sector → market-cap band.
 *
 * The flat Markets list answered "what is the price of X" for someone who
 * already knew X. This answers "show me the mid-cap industrials in Japan",
 * which is the question you ask when you do not yet know what you are
 * looking for.
 *
 * All grouping and statistics live in lib/marketTree.ts; this file only
 * renders the result.
 */
export default function MarketsTree() {
  const navigate = useNavigate();
  useSeo({
    title: "Markets by country, sector and size",
    description: "Browse 596 companies across 68 markets, grouped by country, then sector, then market-cap band. Every price states whether it is live.",
    path: "/markets/browse",
  });

  const [tick, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  const [country, setCountry] = useState<string | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [bandFilter, setBandFilter] = useState<CapBand | null>(null);

  // `tick` is in the deps on purpose: these read live quotes, so memoising on
  // the country alone would freeze the counts at whatever was loaded on mount —
  // which showed "0 live" for every market until the page was navigated away
  // from and back.
  const countries = useMemo(() => allCountries(), [tick]);
  const tree = useMemo(() => (country ? countryTree(country) : null), [country, tick]);

  const pct = (n: number | null) =>
    n === null ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
  const tone = (n: number | null) =>
    n === null ? "var(--muted)" : n >= 0 ? "var(--up)" : "var(--down)";

  return (
    <div style={{ padding: 18, maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Browse markets</h1>
        <span className="label" style={{ color: "var(--faint)" }}>
          {countries.reduce((a, c) => a + c.count, 0)} companies · {countries.length} markets
        </span>
      </div>

      {/* Breadcrumb — the only navigation state that matters. */}
      <nav className="mt-crumbs" aria-label="Breadcrumb">
        <button className={`chip ${!country ? "active" : ""}`} onClick={() => { setCountry(null); setSector(null); setBandFilter(null); }}>
          ALL MARKETS
        </button>
        {country && (
          <button className={`chip ${!sector ? "active" : ""}`} onClick={() => { setSector(null); setBandFilter(null); }}>
            {tree?.name ?? country}
          </button>
        )}
        {sector && <button className="chip active">{sector}</button>}
      </nav>

      {/* Level 1 — countries */}
      {!country && (
        <div className="mt-grid">
          {countries.map((c) => (
            <button key={c.code} className="mt-card" onClick={() => setCountry(c.code)}>
              <div className="mt-card-head">
                <span className="mt-card-name">{c.name}</span>
                <span style={{ color: tone(c.medianChange), fontFamily: "var(--mono)", fontSize: 12 }}>
                  {pct(c.medianChange)}
                </span>
              </div>
              <div className="mt-card-sub">
                {c.count} companies · {c.liveCount} live
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Level 2 — sectors within a country */}
      {country && tree && !sector && (
        <>
          <p className="mt-note">
            {tree.liveCount} of {tree.total} companies here are on live prices; the
            rest are simulated and marked. Median move today {pct(tree.medianChange)}.
          </p>
          <div className="mt-grid">
            {tree.sectors.map((s) => (
              <button key={s.sector} className="mt-card" onClick={() => setSector(s.sector)}>
                <div className="mt-card-head">
                  <span className="mt-card-name">{s.sector}</span>
                  <span style={{ color: tone(s.medianChange), fontFamily: "var(--mono)", fontSize: 12 }}>
                    {pct(s.medianChange)}
                  </span>
                </div>
                <div className="mt-card-sub">
                  {s.rows.length} companies · {s.byBand.map((b) => `${b.rows.length} ${b.band}`).join(" · ")}
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Level 3 — cap bands within a sector */}
      {country && tree && sector && (() => {
        const group = tree.sectors.find((s) => s.sector === sector);
        if (!group) return null;
        const bands = group.byBand.filter((b) => !bandFilter || b.band === bandFilter);
        return (
          <>
            <div className="mt-bands">
              <button className={`chip ${!bandFilter ? "active" : ""}`} onClick={() => setBandFilter(null)}>ALL SIZES</button>
              {group.byBand.map((b) => (
                <button
                  key={b.band}
                  className={`chip ${bandFilter === b.band ? "active" : ""}`}
                  title={CAP_RANGE[b.band]}
                  onClick={() => setBandFilter(bandFilter === b.band ? null : b.band)}
                >
                  {CAP_LABEL[b.band]} ({b.rows.length})
                </button>
              ))}
            </div>

            {bands.map((b) => (
              <section key={b.band} className="panel" style={{ overflow: "hidden", marginBottom: 14 }}>
                <div className="panel-head">
                  <span className="panel-title">{CAP_LABEL[b.band]}</span>
                  <span className="label" style={{ color: "var(--faint)" }}>{CAP_RANGE[b.band]}</span>
                </div>
                <table className="tbl">
                  <tbody>
                    {b.rows.map((r) => (
                      <tr key={r.symbol} onClick={() => navigate(`/stock/${r.symbol}`)} style={{ cursor: "pointer" }}>
                        <td className="mono" style={{ fontWeight: 700, width: 90 }}>{r.symbol}</td>
                        <td style={{ fontSize: 12.5 }}>
                          {r.name}
                          {!r.live && <span className="mt-sim">SIM</span>}
                        </td>
                        <td className="num" style={{ fontSize: 11, color: "var(--faint)" }}>
                          {r.capUsdM !== null ? `$${(r.capUsdM / 1000).toFixed(1)}B` : "—"}
                        </td>
                        <td className="num">{r.price ?? "—"}</td>
                        <td className="num" style={{ color: tone(r.changePct), fontWeight: 700 }}>{pct(r.changePct)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}

            <p className="mt-note">
              Market caps are converted to USD with ECB rates. They are only
              available for companies with a US listing — our data provider
              returns 403 for foreign listings — so the rest sit under
              &ldquo;cap unknown&rdquo; rather than being estimated from price.
            </p>
          </>
        );
      })()}
    </div>
  );
}
