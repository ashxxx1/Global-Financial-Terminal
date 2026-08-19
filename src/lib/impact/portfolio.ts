/**
 * Overlay the impact map onto the user's existing GFT positions.
 * Weights come from live/sim quotes already used by the portfolio page.
 * No positions → null, with architecture ready for a later add.
 */
import { quoteFor } from "../market";
import { toUsd } from "../fxRates";
import type { Position } from "../../store";
import type { CompanyImpact, PortfolioExposure, PortfolioHoldingHit } from "./types";

export function portfolioExposure(
  positions: Position[],
  companies: CompanyImpact[],
): PortfolioExposure | null {
  if (!positions.length) return null;

  let total = 0;
  const valued: { p: Position; usd: number }[] = [];
  for (const p of positions) {
    const q = quoteFor(p.symbol);
    if (!q) continue;
    const conv = toUsd(p.shares * q.price, p.currency);
    if (conv.usd == null) continue;
    valued.push({ p, usd: conv.usd });
    total += conv.usd;
  }

  const bySym = new Map(companies.map((c) => [c.symbol, c]));
  const holdings: PortfolioHoldingHit[] = [];
  let posW = 0, negW = 0;

  for (const v of valued) {
    const hit = bySym.get(v.p.symbol);
    if (!hit) continue;
    const w = total > 0 ? (v.usd / total) * 100 : null;
    const stance: PortfolioHoldingHit["stance"] =
      hit.signal === "POSITIVE" ? "Positive" : hit.signal === "NEGATIVE" ? "Negative" : "Watch";
    if (stance === "Positive" && w != null) posW += w;
    if (stance === "Negative" && w != null) negW += w;
    holdings.push({
      symbol: v.p.symbol,
      name: v.p.name,
      stance,
      why: hit.why,
      weightPct: w,
    });
  }

  // Sector-level fallback: a holding in an affected sector even if the ticker was not in the top-N list.
  const sectorStance = new Map<string, CompanyImpact["side"]>();
  for (const c of companies) {
    const prev = sectorStance.get(c.sector);
    if (!prev) sectorStance.set(c.sector, c.side);
    else if (prev !== c.side) sectorStance.set(c.sector, c.side === prev ? prev : c.side);
  }
  for (const v of valued) {
    if (holdings.some((h) => h.symbol === v.p.symbol)) continue;
    const q = quoteFor(v.p.symbol);
    const sector = q?.sector;
    if (!sector || !sectorStance.has(sector)) continue;
    const side = sectorStance.get(sector)!;
    const w = total > 0 ? (v.usd / total) * 100 : null;
    const stance: PortfolioHoldingHit["stance"] = side === "beneficiary" ? "Positive" : "Negative";
    if (stance === "Positive" && w != null) posW += w;
    if (stance === "Negative" && w != null) negW += w;
    holdings.push({
      symbol: v.p.symbol,
      name: v.p.name,
      stance,
      why: `Sector overlay: ${sector} is on the ${side === "beneficiary" ? "beneficiary" : "exposed"} side of this mechanism. The ticker itself was not in the ranked company list.`,
      weightPct: w,
    });
  }

  return {
    affected: holdings.length,
    positiveWeightPct: posW,
    negativeWeightPct: negW,
    holdings,
    note: holdings.length
      ? "Weights use the same quotes as the portfolio page. Stance is the GFT mechanism map, not a P&L forecast."
      : "None of the current holdings map onto the ranked names or affected sectors.",
  };
}
