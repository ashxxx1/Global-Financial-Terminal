/**
 * Bull case, bear case, and what would change the conclusion.
 *
 * Derived from the scorecard rather than written. Each side is the strongest
 * measurable evidence pointing that way, ranked by how far the reading is from
 * neutral and how much we trust it — so the bull case for a company with
 * nothing going for it is short, and correctly so.
 *
 * The third section is the one that matters and the one usually missing. For
 * every point made, it names the specific observable that would break it: not
 * "watch for deteriorating fundamentals" but "net margin falling below 24.1%,
 * its 10-year median". A thesis you cannot falsify is not a thesis.
 */
import type { ScoreDimension } from "./scorecard";
import { distribution } from "./series";
import { hist } from "./analyzers/shared";
import { num, type EarningsPoint } from "./data";
import type { CompanyContext } from "./context";
import type { Source } from "./types";

export interface ThesisPoint {
  dimension: string;
  text: string;
  score: number;
  confidence: number;
  sources: Source[];
}

export interface Falsifier {
  /** The point this would undermine. */
  target: string;
  /** The observable, stated with a threshold where the data gives one. */
  test: string;
  /** Where the threshold came from. */
  basis: string;
}

export interface Thesis {
  bull: ThesisPoint[];
  bear: ThesisPoint[];
  falsifiers: Falsifier[];
  /** Stated when neither side has enough evidence to be worth reading. */
  note?: string;
}

const strength = (d: ScoreDimension) => Math.abs(d.score ?? 0) * d.confidence;

export function buildThesis(ctx: CompanyContext, dims: ScoreDimension[]): Thesis {
  const scored = dims.filter((d) => d.score !== null && Math.abs(d.score) >= 0.5);

  const bull: ThesisPoint[] = scored
    .filter((d) => (d.score ?? 0) > 0)
    .sort((a, b) => strength(b) - strength(a))
    .map((d) => ({ dimension: d.label, text: d.basis, score: d.score as number, confidence: d.confidence, sources: d.sources }));

  const bear: ThesisPoint[] = scored
    .filter((d) => (d.score ?? 0) < 0)
    .sort((a, b) => strength(b) - strength(a))
    .map((d) => ({ dimension: d.label, text: d.basis, score: d.score as number, confidence: d.confidence, sources: d.sources }));

  const falsifiers = buildFalsifiers(ctx, [...bull, ...bear].slice(0, 5));

  const note = bull.length === 0 && bear.length === 0
    ? "No dimension is far enough from neutral to state a case in either direction. That is a finding about the evidence, not a view that the shares are fairly priced."
    : undefined;

  return { bull, bear, falsifiers, note };
}

/**
 * The observable that would break each point.
 *
 * Thresholds come from the company's own history where it exists — a median is
 * a real line the number has crossed before — and are omitted rather than
 * invented where it does not.
 */
function buildFalsifiers(ctx: CompanyContext, points: ThesisPoint[]): Falsifier[] {
  const out: Falsifier[] = [];
  const m = ctx.metrics.ok ? ctx.metrics.data : undefined;

  for (const p of points) {
    switch (p.dimension) {
      case "Valuation": {
        const d = distribution(hist(m, "peTTM"), 40);
        if (d) {
          out.push({
            target: "Valuation",
            test: p.score > 0
              ? `P/E rising back above ${d.median.toFixed(1)}× would remove the "cheap against its own history" argument.`
              : `P/E falling below ${d.median.toFixed(1)}× would remove the "expensive against its own history" argument.`,
            basis: `${d.median.toFixed(2)}× is the median of ${d.n} prior quarters (range ${d.min.toFixed(1)}–${d.max.toFixed(1)}).`,
          });
        }
        break;
      }
      case "Profitability": {
        const d = distribution(hist(m, "netMargin"), 40);
        if (d) {
          out.push({
            target: "Profitability",
            test: `Net margin ${p.score > 0 ? `falling below ${d.median.toFixed(1)}%` : `recovering above ${d.median.toFixed(1)}%`} would reverse this reading.`,
            basis: `${d.median.toFixed(2)}% is the median across ${d.n} prior quarters; the current reading is ${d.current.toFixed(2)}%.`,
          });
        }
        break;
      }
      case "Earnings momentum": {
        if (ctx.earnings.ok) {
          const sp = (ctx.earnings.data as EarningsPoint[]).map((e) => e.surprisePercent).filter((x): x is number => typeof x === "number");
          const beats = sp.filter((x) => x > 0).length;
          out.push({
            target: "Earnings momentum",
            test: p.score > 0
              ? `A miss at the next print would break a run of ${beats} beats in ${sp.length} quarters and cut this to neutral.`
              : `Two consecutive beats would lift this out of negative territory.`,
            basis: `Based on ${sp.length} quarters of realised surprises. Note this measures delivered results; consensus revisions, which we cannot see, can move the other way.`,
          });
        }
        break;
      }
      case "Balance-sheet risk": {
        const d = distribution(hist(m, "totalDebtToEquity"), 40);
        if (d) {
          out.push({
            target: "Balance-sheet risk",
            test: `Debt/equity ${p.score > 0 ? `rising above ${d.median.toFixed(2)}` : `falling below ${d.median.toFixed(2)}`} would change this assessment.`,
            basis: `${d.median.toFixed(2)} is the median of ${d.n} prior quarters; currently ${d.current.toFixed(2)}.`,
          });
        }
        break;
      }
      case "Price momentum": {
        out.push({
          target: "Price momentum",
          test: p.score > 0
            ? "Underperforming the peer median over the next quarter would remove the relative-strength argument."
            : "Outperforming the peer median over the next quarter would remove the relative-weakness argument.",
          basis: "Measured against the median return of the peer set over 3 months, so it moves with the peers rather than with the market.",
        });
        break;
      }
      case "Analyst sentiment": {
        out.push({
          target: "Analyst sentiment",
          test: p.score > 0
            ? "A net reduction in buy ratings at the next monthly update would weaken this."
            : "A net increase in buy ratings at the next monthly update would weaken this.",
          basis: "Rating counts update roughly monthly. They are a blunt proxy for the estimate revisions our plan does not include.",
        });
        break;
      }
      case "Growth": {
        const rev = num(m, "revenueGrowthTTMYoy");
        if (rev !== null) {
          out.push({
            target: "Growth",
            test: `Revenue growth ${p.score > 0 ? "falling below zero" : "returning above zero"} year on year would reverse this.`,
            basis: `Currently ${rev >= 0 ? "+" : ""}${rev.toFixed(1)}% year on year, from the latest reported quarter.`,
          });
        }
        break;
      }
      default:
        break;
    }
  }
  return out;
}
