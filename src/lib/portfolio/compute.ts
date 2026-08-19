/**
 * Portfolio valuation — growth-plan items 73 & 74.
 *
 * Kept out of the component so the numbers are testable and so the same
 * computation can back a digest email or an alert later.
 *
 * The rule that shapes everything here: a total that silently drops holdings it
 * could not price or convert is worse than no total. Every position lands in
 * exactly one bucket — valued, or excluded with a stated reason — and the
 * excluded ones are handed back for the UI to name.
 */
import { quoteFor, metaFor } from "../market";
import { toUsd, type ConversionBasis } from "../fxRates";
import type { Position } from "../../store";

export interface ValuedPosition {
  position: Position;
  /** Live/last price in the instrument's own currency. */
  price: number | null;
  /** Whether that price is a real feed or the simulation. */
  live: boolean;
  marketValue: number | null;    // local currency
  costValue: number;             // local currency
  pnl: number | null;            // local currency
  pnlPct: number | null;
  dayChangePct: number | null;
  usdValue: number | null;
  usdPnl: number | null;
  basis: ConversionBasis;
  /** Set when the position cannot be included in the USD total. */
  excluded?: "no-price" | "no-fx";
}

export interface PortfolioSummary {
  rows: ValuedPosition[];
  /** Totals cover only rows with both a price and an FX rate. */
  totalUsd: number;
  totalCostUsd: number;
  totalPnlUsd: number;
  totalPnlPct: number | null;
  dayPnlUsd: number;
  includedCount: number;
  excluded: { symbol: string; reason: "no-price" | "no-fx"; currency: string }[];
  /** How many of the valued rows are on a real feed rather than simulated. */
  liveCount: number;
  byCountry: { key: string; usd: number }[];
  bySector: { key: string; usd: number }[];
}

export function valuePortfolio(positions: Position[]): PortfolioSummary {
  const rows: ValuedPosition[] = [];
  const excluded: PortfolioSummary["excluded"] = [];

  for (const p of positions) {
    const q = quoteFor(p.symbol);
    const price = q?.price ?? null;
    const live = q?.source === "live";
    const costValue = p.shares * p.costPerShare;
    const marketValue = price === null ? null : p.shares * price;
    const pnl = marketValue === null ? null : marketValue - costValue;
    const pnlPct = pnl === null || costValue === 0 ? null : (pnl / costValue) * 100;

    const conv = marketValue === null ? null : toUsd(marketValue, p.currency);
    const convCost = toUsd(costValue, p.currency);

    let excl: ValuedPosition["excluded"];
    if (marketValue === null) excl = "no-price";
    else if (conv && conv.usd === null) excl = "no-fx";
    if (excl) excluded.push({ symbol: p.symbol, reason: excl, currency: p.currency });

    rows.push({
      position: p,
      price, live, marketValue, costValue, pnl, pnlPct,
      dayChangePct: q?.changePct ?? null,
      usdValue: conv?.usd ?? null,
      usdPnl: conv?.usd != null && convCost.usd != null ? conv.usd - convCost.usd : null,
      basis: conv?.basis ?? "unavailable",
      excluded: excl,
    });
  }

  const included = rows.filter((r) => !r.excluded && r.usdValue !== null);
  const totalUsd = included.reduce((a, r) => a + (r.usdValue ?? 0), 0);
  const totalPnlUsd = included.reduce((a, r) => a + (r.usdPnl ?? 0), 0);
  const totalCostUsd = totalUsd - totalPnlUsd;
  const dayPnlUsd = included.reduce((a, r) => {
    // Today's move applies to the current value: v - v/(1+d) is the day's gain.
    const d = r.dayChangePct;
    if (d === null || r.usdValue === null) return a;
    const prior = r.usdValue / (1 + d / 100);
    return a + (r.usdValue - prior);
  }, 0);

  const group = (pick: (r: ValuedPosition) => string) => {
    const m = new Map<string, number>();
    for (const r of included) {
      const k = pick(r) || "Unknown";
      m.set(k, (m.get(k) ?? 0) + (r.usdValue ?? 0));
    }
    return [...m.entries()].map(([key, usd]) => ({ key, usd })).sort((a, b) => b.usd - a.usd);
  };

  return {
    rows,
    totalUsd,
    totalCostUsd,
    totalPnlUsd,
    totalPnlPct: totalCostUsd > 0 ? (totalPnlUsd / totalCostUsd) * 100 : null,
    dayPnlUsd,
    includedCount: included.length,
    excluded,
    liveCount: included.filter((r) => r.live).length,
    byCountry: group((r) => r.position.country || metaFor(r.position.symbol)?.country || "Unknown"),
    bySector: group((r) => metaFor(r.position.symbol)?.sector || "Unknown"),
  };
}

/**
 * Parse a CSV of holdings. Deliberately forgiving about column order and
 * header naming, because the file is going to come out of a broker export that
 * we do not control.
 *
 * Returns rows and the reasons any line was rejected — an import that silently
 * drops three of twenty lines is how someone ends up trusting a wrong total.
 */
export function parseHoldingsCsv(text: string): {
  rows: { symbol: string; shares: number; costPerShare: number }[];
  errors: string[];
} {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: { symbol: string; shares: number; costPerShare: number }[] = [];
  const errors: string[] = [];
  if (lines.length === 0) return { rows, errors: ["The file is empty."] };

  const split = (l: string) => l.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const find = (...names: string[]) => header.findIndex((h) => names.some((n) => h.includes(n)));

  let iSym = find("symbol", "ticker", "instrument");
  let iQty = find("shares", "quantity", "qty", "units");
  let iCost = find("cost", "price", "average", "avg");
  let start = 1;

  // No recognisable header — assume symbol, shares, cost in that order.
  if (iSym < 0 || iQty < 0) {
    iSym = 0; iQty = 1; iCost = 2; start = 0;
    errors.push("No header row recognised, so columns were read as symbol, shares, cost per share.");
  }

  for (let i = start; i < lines.length; i++) {
    const c = split(lines[i]);
    const symbol = (c[iSym] || "").toUpperCase();
    const shares = Number((c[iQty] || "").replace(/[^0-9.-]/g, ""));
    const costPerShare = iCost >= 0 ? Number((c[iCost] || "").replace(/[^0-9.-]/g, "")) : NaN;

    if (!symbol) { errors.push(`Line ${i + 1}: no symbol.`); continue; }
    if (!Number.isFinite(shares) || shares <= 0) { errors.push(`Line ${i + 1} (${symbol}): share count is not a positive number.`); continue; }
    if (!metaFor(symbol)) { errors.push(`Line ${i + 1}: we do not track ${symbol}.`); continue; }
    rows.push({ symbol, shares, costPerShare: Number.isFinite(costPerShare) ? costPerShare : 0 });
  }
  return { rows, errors };
}
