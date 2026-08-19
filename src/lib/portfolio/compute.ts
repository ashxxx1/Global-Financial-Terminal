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
import { detectBroker, findCol, parseNumber, isNonHolding, looksLikeIsin, costIsTotal, NAME_ALIASES, GENERIC } from "./brokers";
import { resolveSymbol } from "./resolve";

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
 * Parse a holdings export from a broker.
 *
 * Detects which broker produced the file from its header row and applies that
 * broker's quirks — column names, ticker format, decimal separator. Everything
 * it could not use comes back as a reason string, because an import that
 * quietly drops rows is how someone ends up trusting a wrong total.
 */
export interface ImportResult {
  rows: { symbol: string; shares: number; costPerShare: number }[];
  errors: string[];
  /** Matches that needed a transform — worth surfacing, they can be wrong. */
  adjusted: string[];
  broker: { id: string; label: string; region: string };
  /** Rows skipped as subtotals or cash lines rather than failures. */
  skippedNonHoldings: number;
}

export function parseHoldingsCsv(text: string): ImportResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: ImportResult["rows"] = [];
  const errors: string[] = [];
  const adjusted: string[] = [];
  let skippedNonHoldings = 0;

  if (lines.length === 0) {
    return { rows, errors: ["The file is empty."], adjusted, broker: { id: "generic", label: "Generic CSV", region: "—" }, skippedNonHoldings };
  }

  // Delimiter: whichever appears most in the header line.
  const head = lines[0];
  const delim = [",", ";", "\t"]
    .map((d) => ({ d, n: head.split(d).length }))
    .sort((a, b) => b.n - a.n)[0].d;
  const split = (l: string) => l.split(delim).map((c) => c.trim().replace(/^"|"$/g, ""));

  const headers = split(lines[0]);
  const profile = detectBroker(headers);

  let iSym = findCol(headers, profile.symbolCol);
  let iQty = findCol(headers, profile.qtyCol);
  let iCost = findCol(headers, profile.costCol);
  const iCur = profile.currencyCol ? findCol(headers, profile.currencyCol) : -1;
  let start = 1;

  // Fall back to the generic alias set before giving up on the header.
  if (iSym < 0) iSym = findCol(headers, GENERIC.symbolCol);
  if (iQty < 0) iQty = findCol(headers, GENERIC.qtyCol);
  if (iCost < 0) iCost = findCol(headers, GENERIC.costCol);

  // A second column that might identify the instrument. European exports lead
  // with an ISIN we cannot match while carrying the company name alongside it.
  const iName = findCol(headers, NAME_ALIASES);

  if (iSym < 0 || iQty < 0) {
    iSym = 0; iQty = 1; iCost = 2; start = 0;
    errors.push("No header row recognised, so columns were read as symbol, shares, cost per share.");
  }

  for (let i = start; i < lines.length; i++) {
    const c = split(lines[i]);
    const rawSym = c[iSym] || "";

    if (isNonHolding(rawSym, lines[i])) { skippedNonHoldings++; continue; }

    let res = resolveSymbol(rawSym, profile.cleanSymbol);
    // Fall back to the name column when the identifier column cannot be matched
    // — an ISIN is a valid identifier, just not one we hold a table for.
    if (!res.symbol && iName >= 0 && iName !== iSym && c[iName]) {
      const alt = resolveSymbol(c[iName], profile.cleanSymbol);
      if (alt.symbol) res = { ...alt, via: alt.via ?? `"${c[iName]}" → ${alt.symbol}` };
    }
    if (!res.symbol) {
      errors.push(
        looksLikeIsin(rawSym)
          ? `Line ${i + 1}: ${rawSym} is an ISIN, not a ticker — we cannot match it without a ticker column.`
          : `Line ${i + 1}: we do not track ${rawSym || "(blank)"}.`,
      );
      continue;
    }
    if (res.via) adjusted.push(`Line ${i + 1}: ${res.via}`);

    const shares = parseNumber(c[iQty] || "", profile.europeanNumbers);
    if (!Number.isFinite(shares) || shares <= 0) {
      errors.push(`Line ${i + 1} (${res.symbol}): share count "${c[iQty] ?? ""}" is not a positive number.`);
      continue;
    }

    let costPerShare = iCost >= 0 ? parseNumber(c[iCost] || "", profile.europeanNumbers) : NaN;
    if (!Number.isFinite(costPerShare)) costPerShare = 0;
    // Hargreaves quotes UK holdings in pence against our pounds.
    if (profile.id === "hl" && /\(p\)/i.test(headers[iCost] || "")) costPerShare /= 100;
    // Divide a whole-position cost down to per share.
    if (iCost >= 0 && costPerShare > 0 && shares > 0 && costIsTotal(headers[iCost] || "")) {
      costPerShare = costPerShare / shares;
      adjusted.push(`Line ${i + 1} (${res.symbol}): "${headers[iCost]}" read as a position total, divided by ${shares} shares.`);
    }

    rows.push({ symbol: res.symbol, shares, costPerShare });
    if (iCur >= 0 && c[iCur]) { /* currency comes from our own registry, not the file */ }
  }

  return {
    rows, errors, adjusted,
    broker: { id: profile.id, label: profile.label, region: profile.region },
    skippedNonHoldings,
  };
}
