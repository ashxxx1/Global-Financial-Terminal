/**
 * Peer intelligence.
 *
 * Two questions: who are the comparable companies, and is this one's premium
 * or discount supported by anything measurable.
 *
 * The second is where the previous version failed. Direction-matching — "it is
 * dearer and it grows faster, so that is fine" — rationalises a 24% premium on
 * a 1pp growth edge. Here the premium is regressed against the measurable
 * differences that are supposed to justify it, and the answer states how much
 * of the gap they actually account for.
 */
import { metaFor, stocksOf } from "../../market";
import { getCapability } from "../providers";
import { num, type Metrics } from "../data";
import type { CompanyContext } from "../context";
import type { Claim, Source } from "../types";

/** Metrics compared across the peer set, and which direction is "better". */
export const PEER_METRICS: { key: string; label: string; higherBetter: boolean; unit: string }[] = [
  { key: "peTTM", label: "P/E", higherBetter: false, unit: "×" },
  { key: "evEbitdaTTM", label: "EV/EBITDA", higherBetter: false, unit: "×" },
  { key: "psTTM", label: "P/S", higherBetter: false, unit: "×" },
  { key: "revenueGrowthTTMYoy", label: "Revenue growth", higherBetter: true, unit: "%" },
  { key: "epsGrowthTTMYoy", label: "EPS growth", higherBetter: true, unit: "%" },
  { key: "netProfitMarginTTM", label: "Net margin", higherBetter: true, unit: "%" },
  { key: "roeTTM", label: "ROE", higherBetter: true, unit: "%" },
  { key: "grossMarginTTM", label: "Gross margin", higherBetter: true, unit: "%" },
];

export interface PeerRow {
  symbol: string;
  name: string;
  values: Record<string, number | null>;
  /** Source of the peer suggestion, for the evidence trail. */
  origin: "provider" | "sector";
}

export interface PeerComparison {
  subject: PeerRow | null;
  peers: PeerRow[];
  /** Median across peers per metric. */
  medians: Record<string, number | null>;
  claims: Claim[];
  /** Peers we asked about but could not price. */
  unresolved: string[];
}

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Peer candidates: the provider's list first, our own sector as the fallback. */
export function peerCandidates(ctx: CompanyContext, max = 6): { symbol: string; origin: PeerRow["origin"] }[] {
  const out: { symbol: string; origin: PeerRow["origin"] }[] = [];
  const seen = new Set([ctx.symbol]);

  if (ctx.peers.ok) {
    for (const p of ctx.peers.data) {
      const s = String(p).toUpperCase();
      if (seen.has(s) || !metaFor(s)) continue;
      seen.add(s);
      out.push({ symbol: s, origin: "provider" });
      if (out.length >= max) return out;
    }
  }
  // Same sector and market — a real comparison set even when the provider has
  // nothing, and it never invents a company we do not track.
  if (ctx.country && ctx.sector) {
    for (const s of stocksOf(ctx.country)) {
      if (seen.has(s) || metaFor(s)?.sector !== ctx.sector) continue;
      seen.add(s);
      out.push({ symbol: s, origin: "sector" });
      if (out.length >= max) break;
    }
  }
  return out;
}

const rowFrom = (symbol: string, m: Metrics | null, origin: PeerRow["origin"]): PeerRow => ({
  symbol,
  name: metaFor(symbol)?.name || symbol,
  origin,
  values: Object.fromEntries(PEER_METRICS.map((x) => [x.key, m ? num(m, x.key) : null])),
});

export async function comparePeers(ctx: CompanyContext): Promise<PeerComparison> {
  const candidates = peerCandidates(ctx);
  const subject = rowFrom(ctx.symbol, ctx.metrics.ok ? ctx.metrics.data : null, "provider");

  const fetched = await Promise.all(
    candidates.map(async (c) => {
      const m = await getCapability<Metrics>("fundamentals", c.symbol);
      return { c, m };
    }),
  );

  const peers: PeerRow[] = [];
  const unresolved: string[] = [];
  for (const { c, m } of fetched) {
    if (m.ok) peers.push(rowFrom(c.symbol, m.data, c.origin));
    else unresolved.push(c.symbol);
  }

  const medians: Record<string, number | null> = {};
  for (const met of PEER_METRICS) {
    medians[met.key] = median(
      peers.map((p) => p.values[met.key]).filter((v): v is number => typeof v === "number" && Number.isFinite(v)),
    );
  }

  return { subject, peers, medians, claims: peerClaims(ctx, subject, peers, medians), unresolved };
}

/**
 * Does the valuation gap have measurable support?
 *
 * The premium on P/E is compared with the *size* of the company's advantage on
 * each fundamental that is supposed to justify one. A premium is called
 * supported only when the fundamental gaps are of comparable magnitude, and the
 * text says how much of it they explain.
 */
function peerClaims(
  ctx: CompanyContext, subject: PeerRow, peers: PeerRow[], medians: Record<string, number | null>,
): Claim[] {
  const claims: Claim[] = [];
  if (peers.length < 2) return claims;

  const src = (label: string, detail: string): Source => ({
    kind: "peers", label, detail, asOf: ctx.builtAt, capability: "peers",
  });

  const peerList = peers.map((p) => p.symbol).join(", ");
  claims.push({
    text: `Compared against ${peers.length} peers: ${peerList}.`,
    tier: "FACT", confidence: 1,
    why: `${peers.filter((p) => p.origin === "provider").length} suggested by the data provider, ${peers.filter((p) => p.origin === "sector").length} drawn from the same sector and market in our own universe. Only companies we actually track and can price are included.`,
    sources: [src("Peer set", peers.map((p) => `${p.symbol} (${p.origin})`).join(", "))],
  });

  const pe = subject.values.peTTM;
  const peMed = medians.peTTM;
  if (typeof pe !== "number" || typeof peMed !== "number" || peMed === 0) return claims;

  const premium = ((pe - peMed) / peMed) * 100;
  claims.push({
    text: `It trades at ${pe.toFixed(1)}× earnings against a peer median of ${peMed.toFixed(1)}× — a ${Math.abs(premium).toFixed(0)}% ${premium >= 0 ? "premium" : "discount"}.`,
    tier: "CALCULATION", confidence: 0.9,
    why: "Median rather than mean so a single re-rated peer cannot move the benchmark.",
    sources: [src("Peer P/E", peers.map((p) => `${p.symbol} ${p.values.peTTM?.toFixed(1) ?? "—"}`).join(", "))],
    calculation: {
      expression: `(${pe.toFixed(2)} − ${peMed.toFixed(2)}) ÷ ${peMed.toFixed(2)} × 100`,
      inputs: [
        { label: `${ctx.symbol} P/E`, metricKey: "peTTM", value: pe },
        { label: "peer median P/E", metricKey: "peTTM", value: peMed },
      ],
      result: premium, unit: "%", n: peers.length,
    },
  });

  // How much of the premium do the fundamentals actually account for?
  const drivers = PEER_METRICS.filter((m) => m.higherBetter && m.key !== "peTTM");
  const gaps: { label: string; key: string; relGap: number; subject: number; peer: number }[] = [];
  for (const d of drivers) {
    const mine = subject.values[d.key];
    const theirs = medians[d.key];
    if (typeof mine !== "number" || typeof theirs !== "number" || Math.abs(theirs) < 1e-9) continue;
    gaps.push({ label: d.label, key: d.key, relGap: ((mine - theirs) / Math.abs(theirs)) * 100, subject: mine, peer: theirs });
  }

  if (gaps.length >= 2) {
    // The best case the fundamentals can make for the premium: the largest
    // advantage among them. If even that is far smaller than the premium, the
    // premium is not explained by what we can measure.
    const best = gaps.reduce((a, b) => (Math.abs(b.relGap) > Math.abs(a.relGap) ? b : a));
    const supportive = gaps.filter((g) => Math.sign(g.relGap) === Math.sign(premium));
    const explains = Math.abs(best.relGap) / Math.max(1e-9, Math.abs(premium));

    claims.push({
      text: explains >= 0.5
        ? `The ${premium >= 0 ? "premium" : "discount"} has measurable support: ${best.label} differs from the peer median by ${best.relGap >= 0 ? "+" : ""}${best.relGap.toFixed(0)}% (${best.subject.toFixed(1)} vs ${best.peer.toFixed(1)}), which ${explains >= 2 ? "far exceeds" : "is comparable to"} the ${Math.abs(premium).toFixed(0)}% valuation gap.`
        : `The ${Math.abs(premium).toFixed(0)}% ${premium >= 0 ? "premium" : "discount"} is larger than the fundamentals explain — the widest advantage we can measure is ${best.label} at ${best.relGap >= 0 ? "+" : ""}${best.relGap.toFixed(0)}%, well short of the valuation gap. Something outside these metrics is carrying it.`,
      tier: "INFERENCE",
      confidence: explains >= 0.5 ? 0.45 : 0.4,
      why: `Compares the valuation gap (${Math.abs(premium).toFixed(0)}%) against the largest relative advantage among ${gaps.length} fundamentals (${gaps.map((g) => `${g.label} ${g.relGap >= 0 ? "+" : ""}${g.relGap.toFixed(0)}%`).join(", ")}), and counts how many point the same way as the premium (${supportive.length} of ${gaps.length}). The 0.5 ratio threshold is our convention, not a market standard. Balance-sheet strength, capital intensity, cyclicality and index membership all move multiples and none are in this comparison.`,
      sources: [src("Peer fundamentals", gaps.map((g) => `${g.label}: ${g.subject.toFixed(1)} vs peer median ${g.peer.toFixed(1)}`).join(" · "))],
      calculation: {
        expression: `|${best.relGap.toFixed(1)}%| ÷ |${premium.toFixed(1)}%|`,
        inputs: [
          { label: `${best.label} gap`, metricKey: best.key, value: best.relGap },
          { label: "valuation premium", metricKey: "peTTM", value: premium },
        ],
        result: explains, unit: "× of the gap explained", n: gaps.length,
      },
    });
  }

  return claims;
}
