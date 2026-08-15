/**
 * Scope analyzers: the market, the user's watchlist, macro context, filings and
 * the screen. These reason over instruments rather than one company, so they
 * lean on our own registry and live quotes rather than per-symbol datasets.
 */
import { quoteFor, metaFor, allStockSymbols } from "../../market";
import { provenanceFor } from "../../marketStatus";
import { fetchDataset, num, type Metrics, type EarningsPoint, type Filing } from "../data";
import type { Answer, Claim } from "../types";
import { pct, median, buildHeadline, capabilityCaveats } from "./shared";

/* ── 6. Filings ──────────────────────────────────────────────────────────── */

export async function analyzeFilings(symbol: string): Promise<Answer> {
  const name = metaFor(symbol)?.name || symbol;
  const filings = await fetchDataset<Filing[]>("filings", symbol);
  const claims: Claim[] = [];
  const caveats: string[] = [];

  if (!filings.ok) {
    return {
      title: `${name} — filings`, mode: "changed",
      headline: "No filings available for this symbol.",
      claims: [], caveats: ["Filing data could not be retrieved. Only US-listed companies file with the SEC."],
      asOf: Date.now(), suggestions: [],
    };
  }

  const recent = filings.data.slice(0, 20);
  const byForm = new Map<string, number>();
  for (const f of recent) byForm.set(f.form || "?", (byForm.get(f.form || "?") ?? 0) + 1);
  const breakdown = [...byForm.entries()].sort((a, b) => b[1] - a[1]);

  claims.push({
    text: `The last ${recent.length} filings break down as ${breakdown.map(([f, n]) => `${n}× ${f}`).join(", ")}.`,
    tier: "FACT", confidence: 1,
    why: "Counted from filing metadata as reported.",
    sources: recent.slice(0, 10).map((f) => ({
      kind: "filing" as const,
      label: f.form || "Filing",
      detail: `${f.form ?? "?"} filed ${f.filedDate ?? "?"}`,
      asOf: Date.parse(f.filedDate || "") || filings.fetchedAt,
      url: f.reportUrl || f.filingUrl,
    })),
  });

  const material = recent.filter((f) => /8-K|10-Q|10-K/i.test(f.form || ""));
  if (material.length > 0) {
    claims.push({
      text: `${material.length} are periodic or material-event filings (10-K, 10-Q, 8-K), the ones that carry financial statements or disclosable events.`,
      tier: "FACT", confidence: 1,
      why: "Filtered by form type. Which forms matter is a fixed SEC classification, not our judgement.",
      sources: material.slice(0, 8).map((f) => ({
        kind: "filing" as const, label: f.form || "Filing",
        detail: `${f.form} filed ${f.filedDate}`,
        asOf: Date.parse(f.filedDate || "") || filings.fetchedAt,
        url: f.reportUrl || f.filingUrl,
      })),
    });
  }

  caveats.push(...capabilityCaveats(["filing-text"]));

  return {
    title: `${name} — recent filings`,
    mode: "changed",
    headline: `${recent.length} filings, linked to source`,
    claims, caveats, asOf: Date.now(),
    suggestions: [`What changed in ${symbol}'s latest earnings?`, `What are the biggest risks to ${symbol}?`],
  };
}

/* ── 7. Screen — the honest version of the spec's estimates question ─────── */

export async function analyzeScreen(): Promise<Answer> {
  const claims: Claim[] = [];
  const caveats: string[] = [];

  // Universe is deliberately small: each name costs two upstream calls, and
  // the live price feed shares the same 60/min budget.
  const universe = allStockSymbols().filter((s) => metaFor(s)?.country === "US").slice(0, 12);
  const results: { sym: string; surprise: number; pe: number; improving: boolean }[] = [];

  for (const sym of universe) {
    const [earn, met] = await Promise.all([
      fetchDataset<EarningsPoint[]>("earnings", sym),
      fetchDataset<Metrics>("metrics", sym),
    ]);
    if (!earn.ok || !met.ok) continue;
    const sp = earn.data.map((e) => e.surprisePercent).filter((x): x is number => typeof x === "number");
    const pe = num(met.data, "peTTM");
    if (sp.length < 2 || pe === null) continue;
    results.push({ sym, surprise: sp[0], pe, improving: sp[0] > sp[sp.length - 1] });
  }

  const hits = results.filter((r) => r.improving && r.surprise > 0).sort((a, b) => a.pe - b.pe);

  claims.push({
    text: hits.length > 0
      ? `${hits.length} of ${results.length} scanned names show a widening earnings-beat trend, cheapest first: ${hits.slice(0, 5).map((h) => `${h.sym} (${h.pe.toFixed(0)}× P/E, last beat ${pct(h.surprise)})`).join(", ")}.`
      : `None of the ${results.length} scanned names currently show a widening beat trend.`,
    tier: "CALCULATION", confidence: 0.8,
    why: `Scanned ${universe.length} US names, kept those with at least two quarters of surprise data and a reported P/E. "Widening" means the most recent surprise exceeds the oldest of the four. Universe is capped at ${universe.length} names because each costs upstream calls the live price feed shares.`,
    sources: results.slice(0, 8).map((r) => ({
      kind: "earnings" as const, label: r.sym,
      detail: `latest surprise ${pct(r.surprise)}, peTTM ${r.pe.toFixed(2)}, trend ${r.improving ? "widening" : "narrowing"}`,
      asOf: Date.now(),
    })),
  });

  caveats.push("This is not the screen you asked for, and the difference matters. Analyst estimate revisions are a paid dataset we do not have, so this screens on realised earnings surprises — what the company already delivered versus consensus — not on whether analysts are raising future estimates. Those two often diverge.");
  caveats.push(`The universe is ${universe.length} US large caps, not the full market. A screen over hundreds of names would exhaust the data plan's rate limit and stall live prices across the terminal.`);

  return {
    title: "Screen — improving earnings surprises, cheapest valuations",
    mode: "market",
    headline: buildHeadline(claims, "Screen results"),
    claims, caveats, asOf: Date.now(),
    suggestions: hits.slice(0, 2).map((h) => `What are the biggest risks to ${h.sym}?`),
  };
}

/* ── 8. Market, portfolio and macro ──────────────────────────────────────── */

export async function analyzeMarket(): Promise<Answer> {
  const claims: Claim[] = [];
  const syms = allStockSymbols().filter((s) => {
    const q = quoteFor(s);
    return q && q.source === "live";
  });
  const moves = syms.map((s) => quoteFor(s)!.changePct);
  const up = moves.filter((m) => m > 0).length;
  const med = median(moves);

  claims.push({
    text: `${up} of ${moves.length} live-priced names are up today (${((up / Math.max(1, moves.length)) * 100).toFixed(0)}% breadth), median move ${med !== null ? pct(med) : "—"}.`,
    tier: "CALCULATION", confidence: 0.9,
    why: `Counted across the ${moves.length} instruments currently on a live feed. Names still on simulated prices are excluded so they cannot distort breadth.`,
    sources: [{ kind: "market", label: "Live universe", detail: `${moves.length} live instruments, ${up} advancing`, asOf: Date.now() }],
  });

  // Sector leadership, computed rather than asserted.
  const bySector = new Map<string, number[]>();
  for (const s of syms) {
    const sec = metaFor(s)?.sector;
    if (!sec) continue;
    if (!bySector.has(sec)) bySector.set(sec, []);
    bySector.get(sec)!.push(quoteFor(s)!.changePct);
  }
  const ranked = [...bySector.entries()]
    .map(([sec, xs]) => ({ sec, med: median(xs)!, n: xs.length }))
    .filter((x) => x.n >= 2)
    .sort((a, b) => b.med - a.med);

  if (ranked.length >= 2) {
    claims.push({
      text: `Leadership: ${ranked[0].sec} ${pct(ranked[0].med)} at the top, ${ranked[ranked.length - 1].sec} ${pct(ranked[ranked.length - 1].med)} at the bottom.`,
      tier: "CALCULATION", confidence: 0.85,
      why: "Median move per sector across live-priced names, sectors with fewer than two live names excluded.",
      sources: ranked.slice(0, 6).map((r) => ({
        kind: "market" as const, label: r.sec,
        detail: `${r.n} names, median ${pct(r.med)}`, asOf: Date.now(),
      })),
    });
  }

  return {
    title: "Market today",
    mode: "market",
    headline: buildHeadline(claims, "Breadth and leadership"),
    claims,
    caveats: ["Breadth covers only instruments on a live feed. Several hundred non-US names remain simulated on our data plan and are excluded rather than counted as if real."],
    asOf: Date.now(),
    suggestions: ranked.length ? [`Why is ${syms[0]} moving today?`] : [],
  };
}

export async function analyzePortfolio(symbols: string[]): Promise<Answer> {
  const claims: Claim[] = [];
  const caveats: string[] = [];

  if (symbols.length === 0) {
    return {
      title: "Portfolio", mode: "portfolio",
      headline: "Your watchlist is empty.",
      claims: [], caveats: ["Add symbols to your watchlist and this becomes a real analysis of concentration and exposure."],
      asOf: Date.now(), suggestions: [],
    };
  }

  const rows = symbols.map((s) => ({ s, q: quoteFor(s), meta: metaFor(s) })).filter((r) => r.q);
  const bySector = new Map<string, number>();
  const byCountry = new Map<string, number>();
  for (const r of rows) {
    const sec = r.meta?.sector || "Unknown";
    const c = r.meta?.country || "Unknown";
    bySector.set(sec, (bySector.get(sec) ?? 0) + 1);
    byCountry.set(c, (byCountry.get(c) ?? 0) + 1);
  }
  const topSector = [...bySector.entries()].sort((a, b) => b[1] - a[1])[0];
  const moves = rows.map((r) => r.q!.changePct);
  const avg = moves.reduce((a, b) => a + b, 0) / Math.max(1, moves.length);

  claims.push({
    text: `${rows.length} names on the watchlist, average move today ${pct(avg)}.`,
    tier: "CALCULATION", confidence: 0.9,
    why: "Unweighted mean across watchlist names with a quote. Unweighted because we do not hold position sizes — this is a watchlist, not a book.",
    sources: rows.slice(0, 8).map((r) => ({
      kind: "market" as const, label: r.s,
      detail: `${r.q!.display} (${pct(r.q!.changePct)})`,
      asOf: Date.now(), simulated: r.q!.source !== "live",
    })),
  });

  if (topSector && topSector[1] / rows.length > 0.4) {
    claims.push({
      text: `${topSector[1]} of ${rows.length} names sit in ${topSector[0]} — that is ${((topSector[1] / rows.length) * 100).toFixed(0)}% of the list in one sector.`,
      tier: "CALCULATION", confidence: 0.9,
      why: "Counted by sector. Flagged above 40% because concentration that high means sector news dominates the list's behaviour.",
      sources: [{ kind: "market", label: "Sector mix", detail: [...bySector.entries()].map(([k, v]) => `${k}: ${v}`).join(" · "), asOf: Date.now() }],
    });
  }

  const simulated = rows.filter((r) => r.q!.source !== "live");
  if (simulated.length > 0) {
    caveats.push(`${simulated.length} of ${rows.length} names (${simulated.map((r) => r.s).join(", ")}) are on simulated prices, so their contribution above is not real market data.`);
  }
  caveats.push("Without position sizes this measures the list, not your exposure. Two names at 40% and 2% of a book are counted identically here.");

  return {
    title: "Watchlist",
    mode: "portfolio",
    headline: buildHeadline(claims, "Concentration and today's moves"),
    claims, caveats, asOf: Date.now(),
    suggestions: rows.slice(0, 2).map((r) => `Why is ${r.s} moving today?`),
  };
}

export async function analyzeMacro(): Promise<Answer> {
  const claims: Claim[] = [];
  const syms = ["BTC/USD", "EUR/USD", "GOLD"];
  const found = syms.map((s) => ({ s, q: quoteFor(s) })).filter((x) => x.q);

  for (const f of found) {
    const meta = metaFor(f.s);
    const prov = provenanceFor(meta?.kind ?? "fx", f.q!.source, meta?.country ?? null, meta?.name);
    claims.push({
      text: `${meta?.name || f.s} at ${f.q!.display}, ${pct(f.q!.changePct)} today.`,
      tier: "FACT",
      confidence: f.q!.source === "live" ? 1 : 0.5,
      why: `Source: ${prov.provider} (${prov.delay}).`,
      sources: [{ kind: "market", label: prov.label, detail: `${f.s} ${f.q!.display}`, asOf: Date.now(), simulated: f.q!.source !== "live" }],
    });
  }

  return {
    title: "Macro backdrop",
    mode: "macro",
    headline: "Cross-asset levels, each labelled with its true source",
    claims,
    caveats: [
      "Policy rates, inflation prints and yield curves are not in any dataset we hold, so this is cross-asset price context rather than macro analysis.",
      "Commodity and index levels are priced through tracking ETFs, not the underlying — the change is real, the level is the fund's.",
    ],
    asOf: Date.now(),
    suggestions: ["What is the market doing today?"],
  };
}

