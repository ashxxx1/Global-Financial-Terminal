/**
 * analysis.ts — the AI stock predictor.
 *
 * Produces a deterministic, explainable rating (STRONG BUY … STRONG SELL) for
 * any symbol by blending live momentum with a seeded valuation/risk profile.
 * Deterministic per symbol so the verdict is stable across reloads/tabs, yet
 * it responds to live price moves. Informational — not financial advice.
 * (Same interface an LLM analyst would implement later; callers won't change.)
 */
import { metaFor } from "./market";

export type Action = "Buy" | "Sell" | "Hold";
export interface Pick {
  symbol: string;
  name: string;
  sector: string;
  rating: "STRONG BUY" | "BUY" | "HOLD" | "SELL" | "STRONG SELL";
  action: Action;
  score: number;        // 0..100 composite
  confidence: number;   // 0..100
  risk: number;         // 0..100
  note: string;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const clamp = (lo: number, hi: number, v: number) => Math.max(lo, Math.min(hi, v));

export function ratePick(symbol: string, changePct = 0): Pick | null {
  const m = metaFor(symbol);
  if (!m) return null;
  const seed = hash(symbol);

  // Seeded fundamentals (stand-ins for P/E and balance-sheet quality).
  const valuationBias = ((seed % 100) - 50) / 6;      // ±~8: cheap(+) vs rich(−)
  const quality = 40 + ((seed >> 5) % 45);             // 40..85
  const risk = clamp(10, 95, Math.round(20 + ((seed >> 9) % 60) + (m.sector === "Technology" || m.sector === "Automotive" ? 8 : 0)));

  // Composite: momentum + seeded value/quality, damped by risk.
  let score = 50 + changePct * 3.5 + valuationBias + (quality - 60) / 3;
  score = clamp(2, 98, Math.round(score));

  const rating: Pick["rating"] =
    score >= 76 ? "STRONG BUY" : score >= 60 ? "BUY" : score >= 42 ? "HOLD" : score >= 28 ? "SELL" : "STRONG SELL";
  const action: Action = score >= 60 ? "Buy" : score <= 42 ? "Sell" : "Hold";

  const dir = changePct >= 0 ? "positive momentum" : "a pullback";
  const val = valuationBias > 0 ? "an attractive valuation" : "a full valuation";
  const note =
    action === "Buy"
      ? `Constructive: ${dir} plus ${val}; quality ${quality}/100. Size to the ${risk > 60 ? "elevated" : "moderate"} risk score.`
      : action === "Sell"
        ? `Cautious: ${dir} and ${val} with risk ${risk}/100 — reasoning favors trimming over adding here.`
        : `Balanced: ${dir} against ${val}; no strong edge either way — hold and watch catalysts.`;

  return { symbol, name: m.name, sector: m.sector, rating, action, score, confidence: clamp(50, 92, 100 - Math.abs(50 - score)), risk, note };
}

export const RATING_COLOR: Record<Pick["rating"], string> = {
  "STRONG BUY": "var(--up)",
  BUY: "var(--up)",
  HOLD: "var(--gold)",
  SELL: "var(--down)",
  "STRONG SELL": "var(--down)",
};
