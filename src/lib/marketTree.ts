/**
 * The market hierarchy: country → sector → market-cap band.
 *
 * Kept out of the component so the grouping is testable and so the same tree
 * can back a future screener without the page owning the logic.
 *
 * Cap bands are only known for companies with a US listing — Finnhub returns
 * 403 for foreign listings, so roughly 180 of 596 names have a real figure.
 * Everything else lands in `unclassified` and says so. Estimating a cap from
 * price would silently reorder the whole page behind a number nobody checked.
 */
import { stocksOf, metaFor, quoteFor, countryList } from "./market";
import caps from "../data/marketCaps.json";

export type CapBand = "mega" | "large" | "mid" | "small" | "micro" | "unclassified";

export const CAP_LABEL: Record<CapBand, string> = {
  mega: "Mega cap", large: "Large cap", mid: "Mid cap",
  small: "Small cap", micro: "Micro cap", unclassified: "Cap unknown",
};

/** USD thresholds, stated so the bands are auditable rather than asserted. */
export const CAP_RANGE: Record<CapBand, string> = {
  mega: "$200B and above", large: "$10B – $200B", mid: "$2B – $10B",
  small: "$300M – $2B", micro: "under $300M",
  unclassified: "market cap not available on our data plan",
};

const CAP_DATA = caps as Record<string, { usdM: number; band: CapBand }>;

export const capFor = (country: string, ticker: string): { usdM: number; band: CapBand } | null =>
  CAP_DATA[`${country}:${ticker}`] ?? null;

export interface TreeRow {
  symbol: string;
  name: string;
  sector: string;
  band: CapBand;
  capUsdM: number | null;
  price: string | null;
  changePct: number | null;
  live: boolean;
}

export interface SectorGroup {
  sector: string;
  rows: TreeRow[];
  /** Median move, so one outlier does not define the sector's day. */
  medianChange: number | null;
  liveCount: number;
  byBand: { band: CapBand; rows: TreeRow[] }[];
}

export interface CountryNode {
  code: string;
  name: string;
  sectors: SectorGroup[];
  total: number;
  liveCount: number;
  medianChange: number | null;
}

const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const BAND_ORDER: CapBand[] = ["mega", "large", "mid", "small", "micro", "unclassified"];

/** Build the full tree for one country. */
export function countryTree(code: string): CountryNode | null {
  const meta = countryList().find((c) => c.code === code);
  if (!meta) return null;

  const rows: TreeRow[] = stocksOf(code).map((symbol) => {
    const m = metaFor(symbol);
    const q = quoteFor(symbol);
    const cap = capFor(code, symbol);
    return {
      symbol,
      name: m?.name ?? symbol,
      sector: m?.sector || "Unclassified",
      band: cap?.band ?? "unclassified",
      capUsdM: cap?.usdM ?? null,
      price: q && Number.isFinite(q.price) ? q.display : null,
      changePct: q && Number.isFinite(q.changePct) ? q.changePct : null,
      live: q?.source === "live",
    };
  });

  const bySector = new Map<string, TreeRow[]>();
  for (const r of rows) {
    if (!bySector.has(r.sector)) bySector.set(r.sector, []);
    bySector.get(r.sector)!.push(r);
  }

  const sectors: SectorGroup[] = [...bySector.entries()]
    .map(([sector, sr]) => {
      const byBand = BAND_ORDER
        .map((band) => ({ band, rows: sr.filter((r) => r.band === band) }))
        .filter((g) => g.rows.length > 0);
      return {
        sector,
        rows: sr.sort((a, b) => (b.capUsdM ?? -1) - (a.capUsdM ?? -1)),
        medianChange: median(sr.map((r) => r.changePct).filter((x): x is number => typeof x === "number" && Number.isFinite(x) && Number.isFinite(x))),
        liveCount: sr.filter((r) => r.live).length,
        byBand,
      };
    })
    // Largest sectors first — the ones a reader is most likely to want.
    .sort((a, b) => b.rows.length - a.rows.length);

  return {
    code, name: meta.name, sectors,
    total: rows.length,
    liveCount: rows.filter((r) => r.live).length,
    medianChange: median(rows.map((r) => r.changePct).filter((x): x is number => typeof x === "number" && Number.isFinite(x) && Number.isFinite(x))),
  };
}

/** Every country we track, with counts, for the top level of the page. */
export function allCountries(): { code: string; name: string; count: number; liveCount: number; medianChange: number | null }[] {
  return countryList()
    .map((c) => {
      const syms = stocksOf(c.code);
      const moves = syms.map((s) => quoteFor(s)?.changePct).filter((x): x is number => typeof x === "number" && Number.isFinite(x));
      return {
        code: c.code, name: c.name, count: syms.length,
        liveCount: syms.filter((s) => quoteFor(s)?.source === "live").length,
        medianChange: median(moves),
      };
    })
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count);
}
