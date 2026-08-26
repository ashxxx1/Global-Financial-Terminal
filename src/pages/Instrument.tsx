import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { indexSymbols, metaFor, quoteFor, subscribe, historyFor, countryList, stocksOf } from "../lib/market";
import { provenanceFor } from "../lib/marketStatus";
import { proxyFor } from "../lib/feeds/proxies";
import ProvenanceBadge from "../components/ProvenanceBadge";
import { useSeo, ogImageFor } from "../lib/seo";

/**
 * Index, currency and crypto pages — growth-plan items 92, 93 and 94.
 *
 * One component rather than three. An index, a currency pair and a crypto asset
 * differ in what they mean, not in what we can show: a price with honest
 * provenance, a range, and the context that makes the page worth landing on.
 *
 * Item 100 is the constraint that shaped this. A programmatic page that only
 * restates its own title is thin content and gets treated as such — so every
 * page here carries something a search result cannot: the real source and its
 * delay, the actual range it has traded, and links into the companies or
 * countries it connects to.
 */

type Kind = "index" | "fx" | "crypto";

/** URL slug ↔ registry key. Indices are stored as "IDX:S&P 500". */
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function resolveFromSlug(kind: Kind, slug: string): string | null {
  const wanted = slug.toLowerCase();
  for (const key of indexSymbols()) {
    const meta = metaFor(key);
    if (!meta) continue;
    if (meta.kind !== kind) continue;
    if (slugify(meta.name) === wanted) return key;
  }
  return null;
}

export default function Instrument({ kind }: { kind: Kind }) {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const key = useMemo(() => resolveFromSlug(kind, slug), [kind, slug]);
  const meta = key ? metaFor(key) : null;

  const [, setTick] = useState(0);
  useEffect(() => subscribe(() => setTick((t) => t + 1)), []);

  const q = key ? quoteFor(key) : null;
  const prov = meta ? provenanceFor(meta.kind, q?.source ?? "pending", meta.country ?? null, meta.name) : null;
  const proxy = meta ? proxyFor(meta.name) : undefined;

  const range = useMemo(() => {
    if (!key) return null;
    const { candles } = historyFor(key, "1Y");
    if (candles.length < 20) return null;
    const closes = candles.map((c) => c.c);
    const hi = Math.max(...closes), lo = Math.min(...closes);
    const cur = closes[closes.length - 1];
    return { hi, lo, cur, pos: hi > lo ? ((cur - lo) / (hi - lo)) * 100 : 50, n: candles.length };
  }, [key, q?.price]);

  /** Countries whose benchmark this index is — the internal-linking spine. */
  const relatedCountries = useMemo(() => {
    if (kind !== "index" || !meta) return [];
    return countryList().filter((c) => c.marketIndex === meta.name).slice(0, 6);
  }, [kind, meta]);

  const relatedCompanies = useMemo(() => {
    if (relatedCountries.length === 0) return [];
    return stocksOf(relatedCountries[0].code).slice(0, 8);
  }, [relatedCountries]);

  const label = kind === "index" ? "index" : kind === "fx" ? "currency pair" : "crypto asset";
  useSeo({
    title: meta
      ? `${meta.name} — live ${label}${q ? ` at ${q.display}` : ""}`
      : `${slug} — not found`,
    description: meta
      ? `Live ${meta.name} ${label} price, one-year range and the markets it connects to. Source and delay stated on every figure.`
      : "Instrument not found.",
    path: `/${kind === "fx" ? "fx" : kind}/${slug}`,
    image: meta
      ? ogImageFor({ title: meta.name, subtitle: `Live ${label} · source and delay stated`, kind })
      : undefined,
  });

  if (!meta || !key) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 20, margin: "0 0 8px" }}>Not tracked</h1>
        <p style={{ color: "var(--muted)", fontSize: 13 }}>
          We do not track “{slug}”. <Link to="/markets">Browse all markets →</Link>
        </p>
      </div>
    );
  }

  const up = (q?.changePct ?? 0) >= 0;

  return (
    <div style={{ padding: 18, maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{meta.name}</h1>
        <span className="label" style={{ color: "var(--faint)" }}>{label.toUpperCase()}</span>
        <ProvenanceBadge kind={meta.kind} source={q?.source ?? "pending"} country={meta.country} name={meta.name} />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 18, flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 34, fontWeight: 700 }}>{q?.display ?? "—"}</span>
        <span style={{ fontFamily: "var(--mono)", fontSize: 16, color: up ? "var(--up)" : "var(--down)" }}>
          {q ? `${up ? "+" : ""}${q.changePct.toFixed(2)}%` : "—"}
        </span>
      </div>

      {/* The honest bit: what this number actually is. */}
      {prov && (
        <p className="inst-prov">
          <b>{prov.label}</b> — {prov.detail} <span>({prov.provider} · {prov.delay})</span>
        </p>
      )}

      {range && (
        <section className="panel" style={{ padding: 14, marginBottom: 16 }}>
          <div className="label" style={{ color: "var(--faint)", marginBottom: 8 }}>
            ONE-YEAR RANGE · {range.n} SESSIONS
          </div>
          <div className="inst-range">
            <span className="inst-range-bar"><span style={{ left: `${range.pos}%` }} /></span>
            <div className="inst-range-ends">
              <span>{range.lo.toFixed(2)}</span>
              <span>{range.pos.toFixed(0)}% up the range</span>
              <span>{range.hi.toFixed(2)}</span>
            </div>
          </div>
        </section>
      )}

      {proxy && (
        <p className="inst-note">
          Priced through <b>{proxy.etf}</b> ({proxy.note}). The change is real; the
          level shown is the fund&rsquo;s price, not the index level — we do not
          rescale it into a synthetic index value.
        </p>
      )}

      {/* Internal linking — growth-plan item 98. */}
      {relatedCountries.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <div className="label" style={{ color: "var(--faint)", marginBottom: 6 }}>BENCHMARK FOR</div>
          <div className="inst-links">
            {relatedCountries.map((c) => (
              <Link key={c.code} className="chip" to={`/country/${c.code}`}>{c.name}</Link>
            ))}
          </div>
        </section>
      )}

      {relatedCompanies.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <div className="label" style={{ color: "var(--faint)", marginBottom: 6 }}>COMPANIES IN THIS MARKET</div>
          <div className="inst-links">
            {relatedCompanies.map((s) => (
              <button key={s} className="chip" onClick={() => navigate(`/stock/${s}`)}>{s}</button>
            ))}
          </div>
        </section>
      )}

      <p className="inst-foot">
        Prices are delayed and sourced as stated above. Nothing here is investment advice.{" "}
        <Link to="/data-sources">How we source data →</Link>
      </p>
    </div>
  );
}

/** Every instrument page we publish, for the sitemap. */
export function instrumentRoutes(): string[] {
  const out: string[] = [];
  for (const key of indexSymbols()) {
    const meta = metaFor(key);
    if (!meta) continue;
    const seg = meta.kind === "fx" ? "fx" : meta.kind === "crypto" ? "crypto" : meta.kind === "index" ? "index" : null;
    if (!seg) continue;
    out.push(`/${seg}/${slugify(meta.name)}`);
  }
  return out;
}
