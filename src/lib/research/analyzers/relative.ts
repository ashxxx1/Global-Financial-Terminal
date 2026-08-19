/**
 * Relative performance and return attribution.
 *
 * "The stock is up 12%" is not research. The question a professional asks is
 * whether that 12% is the market, the sector, or the company — because only the
 * last one is about this business at all.
 *
 * The decomposition is deliberately the simple, defensible one:
 *
 *   market   = index return
 *   sector   = sector return − index return
 *   specific = stock return − sector return
 *
 * It sums exactly to the stock's return, every term is observable, and none of
 * it depends on a factor model we cannot validate. Beta-adjusting the market
 * term would be more sophisticated and less honest: our beta is a single
 * reported number of unknown vintage, and using it would bury a guess inside an
 * arithmetic identity.
 */
import { historyFor, metaFor, stocksOf, quoteFor } from "../../market";
import type { CompanyContext } from "../context";
import type { Claim, Source } from "../types";
import { peerCandidates } from "./peers";

export type Horizon = "1D" | "1W" | "1M" | "3M" | "6M" | "1Y";

/** Our horizons mapped onto the ranges the price store understands. */
const RANGE: Record<Horizon, string> = {
  "1D": "5D", "1W": "1M", "1M": "1M", "3M": "3M", "6M": "6M", "1Y": "1Y",
};
/** Trading sessions to look back for each horizon. */
const SESSIONS: Record<Horizon, number> = { "1D": 1, "1W": 5, "1M": 21, "3M": 63, "6M": 126, "1Y": 252 };

/** Total return over the last `sessions` closes. Null when history is short. */
export function returnOver(symbol: string, h: Horizon): number | null {
  const { candles } = historyFor(symbol, RANGE[h]);
  const need = SESSIONS[h];
  if (candles.length < need + 1) return null;
  const end = candles[candles.length - 1].c;
  const start = candles[candles.length - 1 - need].c;
  if (!(start > 0)) return null;
  return ((end - start) / start) * 100;
}

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** The broad index for a market, as the ETF proxy key our registry stores. */
function indexKeyFor(country: string | null): string | null {
  if (!country) return null;
  const map: Record<string, string> = {
    US: "IDX:S&P 500", GB: "IDX:FTSE 100", JP: "IDX:Nikkei 225", DE: "IDX:DAX 40",
    FR: "IDX:CAC 40", IN: "IDX:Nifty 50", HK: "IDX:Hang Seng", CN: "IDX:SSE Composite",
    CA: "IDX:TSX", AU: "IDX:ASX 200", KR: "IDX:KOSPI", BR: "IDX:Bovespa",
  };
  const key = map[country];
  return key && quoteFor(key) ? key : null;
}

export interface Attribution {
  horizon: Horizon;
  stock: number | null;
  index: number | null;
  sector: number | null;
  peerMedian: number | null;
  /** The decomposition. Sums to `stock` by construction. */
  marketDriven: number | null;
  sectorDriven: number | null;
  stockSpecific: number | null;
  /** How many names went into each benchmark, for the evidence trail. */
  sectorN: number;
  peerN: number;
  indexLabel: string | null;
}

export function attribution(ctx: CompanyContext, h: Horizon): Attribution {
  const stock = returnOver(ctx.symbol, h);

  const idxKey = indexKeyFor(ctx.country);
  const index = idxKey ? returnOver(idxKey, h) : null;

  // Sector benchmark: every same-sector name in the same market that we can
  // actually price over this window. Median, so one outlier cannot define it.
  const sectorMembers = ctx.country && ctx.sector
    ? stocksOf(ctx.country).filter((s) => s !== ctx.symbol && metaFor(s)?.sector === ctx.sector)
    : [];
  const sectorReturns = sectorMembers
    .map((s) => returnOver(s, h))
    .filter((x): x is number => x !== null);
  const sector = median(sectorReturns);

  const peerSyms = peerCandidates(ctx, 8).map((p) => p.symbol);
  const peerReturns = peerSyms.map((s) => returnOver(s, h)).filter((x): x is number => x !== null);
  const peerMedian = median(peerReturns);

  const marketDriven = index;
  const sectorDriven = sector !== null && index !== null ? sector - index : null;
  const stockSpecific = stock !== null && sector !== null ? stock - sector
    : stock !== null && index !== null ? stock - index : null;

  return {
    horizon: h, stock, index, sector, peerMedian,
    marketDriven, sectorDriven, stockSpecific,
    sectorN: sectorReturns.length, peerN: peerReturns.length,
    indexLabel: idxKey ? idxKey.replace("IDX:", "") : null,
  };
}

export const ALL_HORIZONS: Horizon[] = ["1D", "1W", "1M", "3M", "6M", "1Y"];

export const attributionTable = (ctx: CompanyContext): Attribution[] =>
  ALL_HORIZONS.map((h) => attribution(ctx, h));

/** Claims for the relative-performance section. */
export function relativeClaims(ctx: CompanyContext): Claim[] {
  const claims: Claim[] = [];
  const rows = attributionTable(ctx);
  const src = (label: string, detail: string): Source => ({
    kind: "market", label, detail, asOf: ctx.builtAt, capability: "price-history",
    simulated: ctx.quote ? !ctx.quote.live : true,
  });

  const usable = rows.filter((r) => r.stock !== null);
  if (usable.length === 0) {
    return [{
      text: "Not enough price history to measure relative performance.",
      tier: "FACT", confidence: 1,
      why: "Fewer closes are available than the shortest horizon requires.",
      sources: [src("Price history", "insufficient candles")],
    }];
  }

  // The headline comparison, at the horizon that has the most complete data.
  const primary = rows.find((r) => r.horizon === "3M" && r.stock !== null)
    ?? usable[usable.length - 1];

  if (primary.peerMedian !== null && primary.stock !== null) {
    const gap = primary.stock - primary.peerMedian;
    claims.push({
      text: `Over ${primary.horizon} the stock returned ${primary.stock >= 0 ? "+" : ""}${primary.stock.toFixed(1)}% against a peer median of ${primary.peerMedian >= 0 ? "+" : ""}${primary.peerMedian.toFixed(1)}% — ${Math.abs(gap) < 0.5 ? "in line with" : gap > 0 ? `${gap.toFixed(1)}pp ahead of` : `${Math.abs(gap).toFixed(1)}pp behind`} its peer group.`,
      tier: "CALCULATION", confidence: 0.9,
      why: `Close-to-close return over ${SESSIONS[primary.horizon]} sessions for this stock and for ${primary.peerN} peers, compared at the median. Rising and outperforming are different things; this separates them.`,
      sources: [src("Peer returns", `${primary.peerN} peers over ${primary.horizon}, median ${primary.peerMedian.toFixed(2)}%`)],
      calculation: {
        expression: `${primary.stock.toFixed(2)} − ${primary.peerMedian.toFixed(2)}`,
        inputs: [
          { label: `${ctx.symbol} ${primary.horizon} return`, value: primary.stock },
          { label: "peer median return", value: primary.peerMedian },
        ],
        result: gap, unit: "pp", n: primary.peerN,
      },
    });
  }

  // The decomposition — the part that says how much of the move is the company.
  if (primary.stockSpecific !== null && primary.stock !== null) {
    const share = Math.abs(primary.stock) > 1e-9
      ? Math.abs(primary.stockSpecific / primary.stock) * 100 : 0;
    claims.push({
      text: `Of that ${primary.stock >= 0 ? "gain" : "fall"}, roughly ${primary.marketDriven !== null ? `${primary.marketDriven.toFixed(1)}pp is the market` : "the market share is unmeasurable"}${primary.sectorDriven !== null ? `, ${primary.sectorDriven >= 0 ? "+" : ""}${primary.sectorDriven.toFixed(1)}pp the sector` : ""}, and ${primary.stockSpecific >= 0 ? "+" : ""}${primary.stockSpecific.toFixed(1)}pp is specific to this company (${share.toFixed(0)}% of the move).`,
      tier: "CALCULATION", confidence: 0.8,
      why: `Market is the ${primary.indexLabel ?? "index"} return, sector is the median of ${primary.sectorN} same-sector names minus the index, and company-specific is the stock minus its sector. The three sum to the stock's return by construction. Deliberately not beta-adjusted: our beta is a single reported figure of unknown vintage, and using it would hide a guess inside an identity.`,
      sources: [
        src("Index return", `${primary.indexLabel ?? "—"}: ${primary.index?.toFixed(2) ?? "—"}% over ${primary.horizon}`),
        src("Sector return", `${primary.sectorN} names in ${ctx.sector ?? "sector"}: median ${primary.sector?.toFixed(2) ?? "—"}%`),
      ],
      calculation: {
        expression: `market ${primary.marketDriven?.toFixed(2) ?? "—"} + sector ${primary.sectorDriven?.toFixed(2) ?? "—"} + specific ${primary.stockSpecific.toFixed(2)} = ${primary.stock.toFixed(2)}`,
        inputs: [
          { label: "stock return", value: primary.stock },
          ...(primary.index !== null ? [{ label: `${primary.indexLabel} return`, value: primary.index }] : []),
          ...(primary.sector !== null ? [{ label: "sector median return", value: primary.sector }] : []),
        ],
        result: primary.stockSpecific, unit: "pp company-specific", n: primary.sectorN,
      },
    });
  }

  // Consistency across horizons: one good quarter is not outperformance.
  const beats = rows.filter((r) => r.stock !== null && r.peerMedian !== null && r.stock > r.peerMedian).length;
  const comparable = rows.filter((r) => r.stock !== null && r.peerMedian !== null).length;
  if (comparable >= 3) {
    claims.push({
      text: `It has beaten its peer median on ${beats} of ${comparable} measured horizons.`,
      tier: "CALCULATION", confidence: 0.85,
      why: `Counted across ${ALL_HORIZONS.join(", ")} wherever both the stock and at least one peer had enough history. Persistence across horizons is what separates a re-rating from a single good month; it is still description, not prediction.`,
      sources: [src("Horizon comparison", rows.filter((r) => r.stock !== null && r.peerMedian !== null).map((r) => `${r.horizon}: ${r.stock!.toFixed(1)}% vs ${r.peerMedian!.toFixed(1)}%`).join(" · "))],
      calculation: {
        expression: `${beats} ÷ ${comparable}`,
        inputs: rows.filter((r) => r.stock !== null && r.peerMedian !== null)
          .map((r) => ({ label: `${r.horizon} gap`, value: r.stock! - r.peerMedian! })),
        result: comparable > 0 ? (beats / comparable) * 100 : 0, unit: "% of horizons ahead", n: comparable,
      },
    });
  }

  return claims;
}
