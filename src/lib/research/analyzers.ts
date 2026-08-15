/**
 * The analysis engine.
 *
 * Every function here turns retrieved data into `Claim`s. The design rule is
 * that an analyzer may only emit a claim it can attach a real source to, so
 * when a dataset is missing the answer gets shorter and gains a caveat — it
 * never gets vaguer. A research tool that pads a thin answer with confident
 * generalities is worse than one that says "I could not see that".
 *
 * Nothing here calls a language model. The questions this product needs to
 * answer are bounded and quantitative, and for those a deterministic engine is
 * strictly more trustworthy: it cannot hallucinate a number, and every figure
 * it prints is reproducible from the sources listed beside it.
 */
import { quoteFor, metaFor, historyFor, stocksOf, allStockSymbols } from "../market";
import { provenanceFor } from "../marketStatus";
import {
  fetchDataset, num,
  type Metrics, type EarningsPoint, type NewsItem, type Filing,
  type Recommendation, type Profile, type InsiderResponse,
} from "./data";
import type { Answer, Claim, Source } from "./types";
import { weakestTier } from "./types";

/* ── shared helpers ──────────────────────────────────────────────────────── */

const pct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
/** Magnitude only. Using pct() on an absolute value prints "down +0.06%", where
 *  the sign contradicts the direction word next to it. */
const mag = (n: number) => `${Math.abs(n).toFixed(2)}%`;

/** Market source for a symbol, carrying whether the price is live or simulated. */
function marketSource(symbol: string): Source {
  const meta = metaFor(symbol);
  const q = quoteFor(symbol);
  const prov = provenanceFor(meta?.kind ?? "stock", q?.source ?? "sim", meta?.country ?? null, meta?.name);
  return {
    kind: "market",
    label: prov.label,
    detail: q ? `${symbol} ${q.display} (${pct(q.changePct)}) — ${prov.provider}` : `${symbol} — no quote`,
    asOf: Date.now(),
    simulated: q?.source !== "live",
  };
}

/** Median, because one halted or erratic peer should not move the benchmark. */
function median(xs: number[]): number | null {
  if (xs.length === 0) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Sample standard deviation of daily returns from our own candle history. */
function dailyVol(symbol: string): { sd: number; n: number } | null {
  const { candles } = historyFor(symbol, "3M");
  if (candles.length < 20) return null;
  const rets: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].c;
    if (prev > 0) rets.push((candles[i].c - prev) / prev * 100);
  }
  if (rets.length < 20) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const varr = rets.reduce((a, r) => a + (r - mean) ** 2, 0) / (rets.length - 1);
  return { sd: Math.sqrt(varr), n: rets.length };
}

/** Same-sector live peers from our own registry — free, instant, and it does
 *  not spend a Finnhub call the price feed needs. */
function sectorPeers(symbol: string): { symbol: string; changePct: number }[] {
  const meta = metaFor(symbol);
  if (!meta?.country || !meta.sector) return [];
  return stocksOf(meta.country)
    .filter((s) => s !== symbol && metaFor(s)?.sector === meta.sector)
    .map((s) => ({ symbol: s, q: quoteFor(s) }))
    .filter((x): x is { symbol: string; q: NonNullable<ReturnType<typeof quoteFor>> } => !!x.q)
    .map((x) => ({ symbol: x.symbol, changePct: x.q.changePct }));
}

function newsSource(n: NewsItem): Source {
  return {
    kind: "news",
    label: n.source || "News",
    detail: n.headline,
    asOf: n.datetime * 1000,
    url: n.url,
  };
}

/* ── 1. Why is X moving? ─────────────────────────────────────────────────── */

export async function analyzeMove(symbol: string): Promise<Answer> {
  const claims: Claim[] = [];
  const caveats: string[] = [];
  const meta = metaFor(symbol);
  const q = quoteFor(symbol);
  const name = meta?.name || symbol;

  if (!q) {
    return {
      title: name, mode: "company", headline: "No quote available for this symbol.",
      claims: [], caveats: ["We have no price for this symbol, so there is nothing to attribute."],
      asOf: Date.now(), suggestions: [],
    };
  }

  const ms = marketSource(symbol);
  const live = !ms.simulated;

  // FACT — the move itself.
  claims.push({
    text: `${name} is ${q.changePct >= 0 ? "up" : "down"} ${mag(q.changePct)} at ${q.display}.`,
    tier: "FACT",
    confidence: live ? 1 : 0.5,
    why: live
      ? "Read directly from the live quote feed."
      : "This symbol has no live feed on our data plan — the price is simulated and labelled as such throughout the terminal.",
    sources: [ms],
  });
  if (!live) {
    caveats.push(`${symbol} is not priced live on our current data plan, so everything below rests on a simulated price.`);
  }

  // CALCULATION — how unusual is this move for this stock?
  const vol = dailyVol(symbol);
  if (vol && vol.sd > 0) {
    const z = q.changePct / vol.sd;
    claims.push({
      text: `That is a ${Math.abs(z).toFixed(1)}σ move against its own recent daily range (typical day: ±${vol.sd.toFixed(2)}%).`,
      tier: "CALCULATION",
      confidence: live ? 0.95 : 0.5,
      why: `Standard deviation of the last ${vol.n} daily returns, then today's move divided by it. Reproducible from the price history.`,
      sources: [ms, {
        kind: "market", label: "Price history",
        detail: `${vol.n} daily returns, sample σ = ${vol.sd.toFixed(3)}%`,
        asOf: Date.now(), simulated: ms.simulated,
      }],
    });
  }

  // CALCULATION — idiosyncratic vs sector.
  const peers = sectorPeers(symbol);
  const peerMed = median(peers.map((p) => p.changePct));
  if (peerMed !== null && peers.length >= 3) {
    const excess = q.changePct - peerMed;
    claims.push({
      text: `Its ${meta?.sector} peers moved ${pct(peerMed)} today, so roughly ${pct(excess)} of this is specific to ${name} rather than the sector.`,
      tier: "CALCULATION",
      confidence: 0.85,
      why: `Median change of ${peers.length} same-sector names in the same market, subtracted from this stock's move. Median rather than mean so one erratic peer cannot skew it.`,
      sources: [ms, {
        kind: "peers", label: `${meta?.sector} peers`,
        detail: `${peers.length} names, median ${pct(peerMed)}: ${peers.slice(0, 6).map((p) => `${p.symbol} ${pct(p.changePct)}`).join(", ")}`,
        asOf: Date.now(),
      }],
    });
  } else {
    caveats.push("Too few live same-sector peers to separate the company's own move from its sector.");
  }

  // FACT + INFERENCE — news.
  const news = await fetchDataset<NewsItem[]>("news", symbol);
  if (news.ok) {
    const cutoff = Date.now() - 48 * 3600 * 1000;
    const recent = news.data.filter((n) => n.datetime * 1000 >= cutoff).slice(0, 6);
    if (recent.length > 0) {
      claims.push({
        text: `${recent.length} article${recent.length > 1 ? "s" : ""} published in the last 48 hours: "${recent[0].headline}".`,
        tier: "FACT",
        confidence: 1,
        why: "Headlines and timestamps as published; we are repeating them, not interpreting them.",
        sources: recent.map(newsSource),
      });

      // The inference is explicitly separated from the facts above it.
      const idio = peerMed !== null ? Math.abs(q.changePct - peerMed) : Math.abs(q.changePct);
      const strength = Math.min(1, (recent.length / 6) * 0.5 + Math.min(idio / 3, 1) * 0.5);
      claims.push({
        text: `The move is plausibly connected to this coverage rather than to a sector-wide factor.`,
        tier: "INFERENCE",
        confidence: Math.max(0.2, Math.min(0.6, strength)),
        why: `Based on ${recent.length} recent articles and ${idio.toFixed(2)}pp of move not explained by peers. This is a timing coincidence, not demonstrated causation — news volume rises after a large move as often as it precedes one, and we cannot distinguish the two from this data.`,
        sources: recent.slice(0, 3).map(newsSource),
      });
    } else {
      caveats.push("No company news in the last 48 hours, so the move has no obvious news catalyst in our feed.");
    }
  } else if (news.reason === "premium") {
    caveats.push("Company news is not available on our data plan.");
  }

  // FACT — analyst recommendation shift.
  const recs = await fetchDataset<Recommendation[]>("recommendations", symbol);
  if (recs.ok && recs.data.length >= 2) {
    const [now, prev] = recs.data;
    const bull = (r: Recommendation) => r.strongBuy + r.buy;
    const delta = bull(now) - bull(prev);
    if (delta !== 0) {
      claims.push({
        text: `Analyst buy ratings ${delta > 0 ? "rose" : "fell"} from ${bull(prev)} to ${bull(now)} between ${prev.period} and ${now.period}.`,
        tier: "FACT",
        confidence: 1,
        why: "Recommendation counts as published by the contributing analysts.",
        sources: [{
          kind: "analysts", label: "Analyst ratings",
          detail: `${now.period}: ${now.strongBuy} strong buy, ${now.buy} buy, ${now.hold} hold, ${now.sell} sell, ${now.strongSell} strong sell`,
          asOf: Date.parse(now.period) || Date.now(),
        }],
      });
    }
  }

  caveats.push("Earnings-call transcripts and analyst price targets are paid datasets we do not have, so no claim here draws on management commentary or target changes.");

  return {
    title: name,
    mode: "company",
    headline: buildHeadline(claims, `Why ${name} is ${q.changePct >= 0 ? "up" : "down"} today`),
    claims, caveats, asOf: Date.now(),
    suggestions: ["Is this temporary?", `What are the biggest risks to ${symbol}?`, `What changed in ${symbol}'s latest earnings?`],
  };
}

/* ── 2. Is this temporary? (the follow-up in the spec) ───────────────────── */

export async function analyzePersistence(symbol: string): Promise<Answer> {
  const claims: Claim[] = [];
  const caveats: string[] = [];
  const meta = metaFor(symbol);
  const name = meta?.name || symbol;
  const q = quoteFor(symbol);

  const metrics = await fetchDataset<Metrics>("metrics", symbol);
  const ms = marketSource(symbol);

  // CALCULATION — where the move sits in the 52-week range.
  if (metrics.ok && q) {
    const hi = num(metrics.data, "52WeekHigh");
    const lo = num(metrics.data, "52WeekLow");
    if (hi && lo && hi > lo) {
      const pos = ((q.price - lo) / (hi - lo)) * 100;
      const fromHigh = ((q.price - hi) / hi) * 100;
      claims.push({
        text: `It sits ${pos.toFixed(0)}% up its 52-week range, ${pct(fromHigh)} from the high of ${hi.toFixed(2)}.`,
        tier: "CALCULATION",
        confidence: 0.9,
        why: "Current price against the reported 52-week high and low. A move that only retraces part of a range is weaker evidence of a regime change than one that breaks it.",
        sources: [ms, {
          kind: "fundamentals", label: "52-week range",
          detail: `high ${hi.toFixed(2)} (${metrics.data.metric?.["52WeekHighDate"]}), low ${lo.toFixed(2)} (${metrics.data.metric?.["52WeekLowDate"]})`,
          asOf: metrics.fetchedAt,
        }],
      });
    }

    // CALCULATION — valuation vs its own growth, the strongest available
    // evidence on whether a de-rating is justified.
    const pe = num(metrics.data, "peTTM");
    const fwdPe = num(metrics.data, "forwardPE");
    const epsG = num(metrics.data, "epsGrowthTTMYoy");
    if (pe && fwdPe) {
      claims.push({
        text: `Trailing P/E is ${pe.toFixed(1)} against a forward P/E of ${fwdPe.toFixed(1)}, implying the market expects earnings to ${fwdPe < pe ? "grow" : "fall"}.`,
        tier: "CALCULATION",
        confidence: 0.85,
        why: "Both multiples as reported. Forward P/E below trailing means consensus earnings are expected to rise; the direction is arithmetic, the expectation behind it is not ours.",
        sources: [{
          kind: "fundamentals", label: "Valuation",
          detail: `peTTM ${pe.toFixed(2)}, forwardPE ${fwdPe.toFixed(2)}${epsG !== null ? `, epsGrowthTTMYoy ${epsG.toFixed(1)}%` : ""}`,
          asOf: metrics.fetchedAt,
        }],
      });
    }

    const beta = num(metrics.data, "beta");
    if (beta !== null) {
      claims.push({
        text: `Beta of ${beta.toFixed(2)} means roughly ${beta > 1 ? "more" : "less"} movement than the market for the same shock.`,
        tier: "FACT",
        confidence: 1,
        why: "Reported beta.",
        sources: [{ kind: "fundamentals", label: "Beta", detail: `beta ${beta.toFixed(4)}`, asOf: metrics.fetchedAt }],
      });
    }
  } else {
    caveats.push("Fundamental metrics were unavailable, so this rests on price behaviour alone.");
  }

  // The honest answer to "is this temporary" is that nobody can know. Say it as
  // an OPINION, capped, rather than dressing a guess as analysis.
  const earn = await fetchDataset<EarningsPoint[]>("earnings", symbol);
  let beatStreak = 0;
  if (earn.ok) {
    for (const e of earn.data) {
      if ((e.surprisePercent ?? 0) > 0) beatStreak++; else break;
    }
  }
  claims.push({
    text: beatStreak >= 3
      ? `The business has beaten estimates ${beatStreak} quarters running, which historically makes a price fall more likely to be sentiment than deterioration — but that is a pattern, not a prediction.`
      : `There is no consistent earnings-beat pattern to lean on, so the data does not support calling this move temporary or permanent.`,
    tier: "OPINION",
    confidence: 0.35,
    why: "Whether a move reverses depends on information nobody has yet. This is a judgement about the balance of evidence, capped in confidence by design, and it is the weakest statement in this answer.",
    sources: earn.ok ? [{
      kind: "earnings", label: "Earnings surprises",
      detail: earn.data.slice(0, 4).map((e) => `${e.period}: actual ${e.actual} vs est ${e.estimate} (${e.surprisePercent?.toFixed(1)}%)`).join(" · "),
      asOf: earn.fetchedAt,
    }] : [{ kind: "market", label: "Price only", detail: "No earnings history retrieved", asOf: Date.now() }],
  });

  caveats.push("No options positioning in this answer: implied volatility and skew are not in any dataset we have, so we cannot see what the options market expects.");
  caveats.push("No transcripts, so management's own explanation of the move is not represented.");

  return {
    title: `${name} — is the move temporary?`,
    mode: "company",
    headline: "Nobody can answer this with certainty; here is what the evidence supports.",
    claims, caveats, asOf: Date.now(),
    suggestions: [`Compare ${symbol} valuation to peers`, `What are the biggest risks to ${symbol}?`],
  };
}

/* ── 3. Valuation comparison ─────────────────────────────────────────────── */

interface ValRow { key: string; label: string; a: number | null; b: number | null; lowerIsCheaper: boolean }

export async function analyzeValuation(symA: string, symB: string): Promise<Answer & { table?: ValRow[] }> {
  const claims: Claim[] = [];
  const caveats: string[] = [];
  const [ma, mb, pa, pb] = await Promise.all([
    fetchDataset<Metrics>("metrics", symA),
    fetchDataset<Metrics>("metrics", symB),
    fetchDataset<Profile>("profile", symA),
    fetchDataset<Profile>("profile", symB),
  ]);

  const nameA = (pa.ok && pa.data.name) || metaFor(symA)?.name || symA;
  const nameB = (pb.ok && pb.data.name) || metaFor(symB)?.name || symB;

  if (!ma.ok || !mb.ok) {
    return {
      title: `${nameA} vs ${nameB}`, mode: "company",
      headline: "Fundamental data was unavailable for at least one of these companies.",
      claims: [], caveats: ["Valuation metrics could not be retrieved, so no comparison is possible. This is usually a non-US listing our data plan does not cover."],
      asOf: Date.now(), suggestions: [],
    };
  }

  const rows: ValRow[] = [
    { key: "peTTM", label: "P/E (trailing)", a: num(ma.data, "peTTM"), b: num(mb.data, "peTTM"), lowerIsCheaper: true },
    { key: "forwardPE", label: "P/E (forward)", a: num(ma.data, "forwardPE"), b: num(mb.data, "forwardPE"), lowerIsCheaper: true },
    { key: "pegTTM", label: "PEG", a: num(ma.data, "pegTTM"), b: num(mb.data, "pegTTM"), lowerIsCheaper: true },
    { key: "psTTM", label: "P/S", a: num(ma.data, "psTTM"), b: num(mb.data, "psTTM"), lowerIsCheaper: true },
    { key: "pb", label: "P/B", a: num(ma.data, "pb"), b: num(mb.data, "pb"), lowerIsCheaper: true },
    { key: "evEbitdaTTM", label: "EV/EBITDA", a: num(ma.data, "evEbitdaTTM"), b: num(mb.data, "evEbitdaTTM"), lowerIsCheaper: true },
    { key: "netProfitMarginTTM", label: "Net margin %", a: num(ma.data, "netProfitMarginTTM"), b: num(mb.data, "netProfitMarginTTM"), lowerIsCheaper: false },
    { key: "roeTTM", label: "ROE %", a: num(ma.data, "roeTTM"), b: num(mb.data, "roeTTM"), lowerIsCheaper: false },
    { key: "revenueGrowthTTMYoy", label: "Revenue growth %", a: num(ma.data, "revenueGrowthTTMYoy"), b: num(mb.data, "revenueGrowthTTMYoy"), lowerIsCheaper: false },
    { key: "epsGrowthTTMYoy", label: "EPS growth %", a: num(ma.data, "epsGrowthTTMYoy"), b: num(mb.data, "epsGrowthTTMYoy"), lowerIsCheaper: false },
  ];

  const srcA: Source = { kind: "fundamentals", label: `${symA} fundamentals`, detail: rows.filter(r => r.a !== null).map((r) => `${r.label} ${r.a!.toFixed(2)}`).join(" · "), asOf: ma.fetchedAt };
  const srcB: Source = { kind: "fundamentals", label: `${symB} fundamentals`, detail: rows.filter(r => r.b !== null).map((r) => `${r.label} ${r.b!.toFixed(2)}`).join(" · "), asOf: mb.fetchedAt };

  // FACT — headline multiples.
  const peA = num(ma.data, "peTTM"), peB = num(mb.data, "peTTM");
  if (peA && peB) {
    claims.push({
      text: `${nameA} trades at ${peA.toFixed(1)}× trailing earnings; ${nameB} at ${peB.toFixed(1)}×.`,
      tier: "FACT", confidence: 1,
      why: "Both multiples as reported by the fundamentals provider.",
      sources: [srcA, srcB],
    });
    const prem = ((peA - peB) / peB) * 100;
    claims.push({
      text: `That puts ${nameA} at a ${Math.abs(prem).toFixed(0)}% ${prem > 0 ? "premium" : "discount"} to ${nameB} on trailing earnings.`,
      tier: "CALCULATION", confidence: 0.95,
      why: `(${peA.toFixed(2)} − ${peB.toFixed(2)}) ÷ ${peB.toFixed(2)}. Arithmetic on the two facts above.`,
      sources: [srcA, srcB],
    });

    // INFERENCE — only made when growth data supports or contradicts it.
    const gA = num(ma.data, "epsGrowthTTMYoy"), gB = num(mb.data, "epsGrowthTTMYoy");
    if (gA !== null && gB !== null && gB !== 0) {
      // Direction alone is far too generous: it would rationalise a 24%
      // premium on a 1pp growth edge. Compare magnitudes — how big is the
      // valuation gap against the growth gap that is supposed to explain it.
      const growthGapRel = ((gA - gB) / Math.abs(gB)) * 100;
      const sameDirection = Math.sign(prem) === Math.sign(growthGapRel);
      const proportionate = sameDirection && Math.abs(prem) <= Math.abs(growthGapRel) * 2;
      claims.push({
        text: proportionate
          ? `The ${prem > 0 ? "premium" : "discount"} is roughly proportionate to the growth gap (EPS growth ${gA.toFixed(1)}% vs ${gB.toFixed(1)}%, a ${growthGapRel.toFixed(0)}% relative difference).`
          : sameDirection
            ? `The ${Math.abs(prem).toFixed(0)}% ${prem > 0 ? "premium" : "discount"} is much larger than the growth gap alone explains — EPS growth differs by only ${Math.abs(growthGapRel).toFixed(0)}% relative (${gA.toFixed(1)}% vs ${gB.toFixed(1)}%), so something other than growth is carrying the valuation.`
            : `The ${prem > 0 ? "premium" : "discount"} runs against the growth gap (EPS growth ${gA.toFixed(1)}% vs ${gB.toFixed(1)}%), which is the kind of divergence worth investigating.`,
        tier: "INFERENCE", confidence: 0.4,
        why: `Compares the size of the valuation gap (${Math.abs(prem).toFixed(0)}%) with the relative earnings-growth gap (${Math.abs(growthGapRel).toFixed(0)}%), calling it proportionate only within a 2× band. That band is our convention, not a market standard. One year of growth is a thin basis regardless, and multiples also reflect balance sheet, capital intensity, buybacks and cyclicality that this ignores entirely.`,
        sources: [srcA, srcB],
      });
    }
  }

  caveats.push("Forward-looking consensus estimates are a paid dataset we do not have. Forward P/E here comes from the provider's own figure, and we cannot show the estimate revisions behind it.");
  if (rows.some((r) => r.a === null || r.b === null)) {
    caveats.push("Some metrics were not reported for one of the two companies and are shown as blank rather than guessed.");
  }

  return {
    title: `${nameA} vs ${nameB} — valuation`,
    mode: "company",
    headline: buildHeadline(claims, `${nameA} against ${nameB} on valuation`),
    claims, caveats, asOf: Date.now(), table: rows,
    suggestions: [`What are the biggest risks to ${symA}?`, `What changed in ${symA}'s latest earnings?`],
  };
}

/* ── 4. Earnings ─────────────────────────────────────────────────────────── */

export async function analyzeEarnings(symbol: string): Promise<Answer> {
  const claims: Claim[] = [];
  const caveats: string[] = [];
  const name = metaFor(symbol)?.name || symbol;

  const earn = await fetchDataset<EarningsPoint[]>("earnings", symbol);
  if (!earn.ok) {
    return {
      title: `${name} — earnings`, mode: "earnings",
      headline: "No earnings history available for this symbol.",
      claims: [], caveats: ["Earnings data could not be retrieved — typically a listing our data plan does not cover."],
      asOf: Date.now(), suggestions: [],
    };
  }

  const pts = earn.data.slice(0, 4);
  const latest = pts[0];
  const src: Source = {
    kind: "earnings", label: "Earnings surprises",
    detail: pts.map((e) => `${e.period}: actual ${e.actual} vs est ${e.estimate} (${e.surprisePercent?.toFixed(1) ?? "—"}%)`).join(" · "),
    asOf: earn.fetchedAt,
  };

  if (latest && latest.actual !== null && latest.estimate !== null) {
    const beat = (latest.surprisePercent ?? 0) >= 0;
    claims.push({
      text: `Most recent quarter (${latest.period}): EPS of ${latest.actual} against consensus ${latest.estimate} — a ${beat ? "beat" : "miss"} of ${Math.abs(latest.surprisePercent ?? 0).toFixed(1)}%.`,
      tier: "FACT", confidence: 1,
      why: "Reported actual and the consensus estimate it was measured against.",
      sources: [src],
    });
  }

  const surprises = pts.map((e) => e.surprisePercent).filter((x): x is number => typeof x === "number");
  if (surprises.length >= 3) {
    const avg = surprises.reduce((a, b) => a + b, 0) / surprises.length;
    const improving = surprises[0] > surprises[surprises.length - 1];
    claims.push({
      text: `Across the last ${surprises.length} quarters surprises averaged ${pct(avg)} and are ${improving ? "widening" : "narrowing"}.`,
      tier: "CALCULATION", confidence: 0.9,
      why: `Mean of the reported surprise percentages (${surprises.map((s) => s.toFixed(1)).join(", ")}), and a comparison of the newest with the oldest.`,
      sources: [src],
    });
  }

  const recs = await fetchDataset<Recommendation[]>("recommendations", symbol);
  if (recs.ok && recs.data.length >= 2) {
    const [now, prev] = recs.data;
    const score = (r: Recommendation) =>
      (r.strongBuy * 2 + r.buy - r.sell - r.strongSell * 2) / Math.max(1, r.strongBuy + r.buy + r.hold + r.sell + r.strongSell);
    const d = score(now) - score(prev);
    claims.push({
      text: `Analyst sentiment has ${Math.abs(d) < 0.05 ? "barely moved" : d > 0 ? "improved" : "deteriorated"} since ${prev.period}.`,
      tier: "CALCULATION", confidence: 0.8,
      why: `Weighted rating score (strong buy +2, buy +1, sell −1, strong sell −2, normalised by analyst count): ${score(prev).toFixed(2)} → ${score(now).toFixed(2)}. The weighting is our choice, not a market standard.`,
      sources: [{
        kind: "analysts", label: "Analyst ratings",
        detail: `${prev.period}: ${prev.strongBuy}/${prev.buy}/${prev.hold}/${prev.sell}/${prev.strongSell} → ${now.period}: ${now.strongBuy}/${now.buy}/${now.hold}/${now.sell}/${now.strongSell} (strong buy/buy/hold/sell/strong sell)`,
        asOf: Date.parse(now.period) || earn.fetchedAt,
      }],
    });
  }

  caveats.push("This is the numbers only. Earnings-call transcripts are a paid dataset we do not have, so nothing here reflects what management actually said — guidance language, tone or Q&A.");
  caveats.push("Revenue and EPS estimate revisions are likewise paywalled, so we cannot show whether analysts have been raising or cutting into the print.");

  return {
    title: `${name} — earnings`,
    mode: "earnings",
    headline: buildHeadline(claims, `What ${name}'s recent prints show`),
    claims, caveats, asOf: Date.now(),
    suggestions: [`Why is ${symbol} moving today?`, `What are the biggest risks to ${symbol}?`],
  };
}

/* ── 5. Risks ────────────────────────────────────────────────────────────── */

export async function analyzeRisks(symbol: string): Promise<Answer> {
  const claims: Claim[] = [];
  const caveats: string[] = [];
  const name = metaFor(symbol)?.name || symbol;
  const [metrics, insider] = await Promise.all([
    fetchDataset<Metrics>("metrics", symbol),
    fetchDataset<InsiderResponse>("insider", symbol),
  ]);

  if (metrics.ok) {
    const m = metrics.data;
    const asOf = metrics.fetchedAt;
    const de = num(m, "totalDebt/totalEquityQuarterly");
    const cr = num(m, "currentRatioQuarterly");
    const beta = num(m, "beta");
    const pe = num(m, "peTTM");
    const gm = num(m, "grossMarginTTM");
    const gm5 = num(m, "grossMargin5Y");

    if (de !== null) {
      claims.push({
        text: `Leverage: total debt to equity of ${de.toFixed(2)}${de > 1.5 ? " — high enough that refinancing costs matter to the equity" : de > 0.8 ? " — moderate" : " — conservative"}.`,
        tier: de > 1.5 || de <= 0.8 ? "CALCULATION" : "FACT",
        confidence: 0.85,
        why: "Reported debt-to-equity; the descriptor applies fixed thresholds (>1.5 high, >0.8 moderate) that are conventions, not rules.",
        sources: [{ kind: "fundamentals", label: "Balance sheet", detail: `totalDebt/totalEquityQuarterly ${de.toFixed(4)}${cr !== null ? `, currentRatioQuarterly ${cr.toFixed(2)}` : ""}`, asOf }],
      });
    }
    if (cr !== null && cr < 1) {
      claims.push({
        text: `Current ratio of ${cr.toFixed(2)} is below 1, meaning current liabilities exceed current assets.`,
        tier: "FACT", confidence: 1,
        why: "Reported figure. Common and unalarming for businesses with fast cash conversion, so it is context, not a verdict.",
        sources: [{ kind: "fundamentals", label: "Liquidity", detail: `currentRatioQuarterly ${cr.toFixed(4)}`, asOf }],
      });
    }
    if (gm !== null && gm5 !== null) {
      const drift = gm - gm5;
      claims.push({
        text: `Gross margin is ${gm.toFixed(1)}% against a 5-year average of ${gm5.toFixed(1)}% — ${Math.abs(drift) < 1 ? "essentially flat" : drift > 0 ? "expanding" : "compressing"}.`,
        tier: "CALCULATION", confidence: 0.9,
        why: "Trailing-twelve-month gross margin minus the 5-year average. Margin compression is the earliest visible sign of pricing power eroding.",
        sources: [{ kind: "fundamentals", label: "Margins", detail: `grossMarginTTM ${gm.toFixed(2)}%, grossMargin5Y ${gm5.toFixed(2)}%`, asOf }],
      });
    }
    if (beta !== null && pe !== null) {
      claims.push({
        text: `A ${pe.toFixed(0)}× multiple with a beta of ${beta.toFixed(2)} means expectations are high and the stock amplifies market moves — the combination that de-rates hardest on a disappointment.`,
        tier: "INFERENCE", confidence: 0.4,
        why: "Links two reported figures into a claim about downside behaviour. High-multiple, high-beta names have historically fallen further on misses, but this is a tendency across many stocks, not a property of this one.",
        sources: [{ kind: "fundamentals", label: "Valuation & beta", detail: `peTTM ${pe.toFixed(2)}, beta ${beta.toFixed(4)}`, asOf }],
      });
    }
  } else {
    caveats.push("Fundamental metrics were unavailable, so balance-sheet and margin risks could not be assessed.");
  }

  if (insider.ok && insider.data.data && insider.data.data.length > 0) {
    const recent = insider.data.data.slice(0, 40);
    const sold = recent.filter((t) => (t.change ?? 0) < 0);
    const bought = recent.filter((t) => (t.change ?? 0) > 0);
    claims.push({
      text: `Insider activity in the latest filings: ${bought.length} buys against ${sold.length} sells.`,
      tier: "FACT", confidence: 1,
      why: "Counted from reported insider transaction filings. Sales often reflect scheduled 10b5-1 plans or tax events rather than a view on the business, so the count alone carries little signal.",
      sources: [{
        kind: "insider", label: "Insider transactions",
        detail: recent.slice(0, 5).map((t) => `${t.name ?? "?"} ${t.change && t.change > 0 ? "+" : ""}${t.change ?? "?"} on ${t.transactionDate ?? "?"}`).join(" · "),
        asOf: insider.fetchedAt,
      }],
    });
  }

  caveats.push("Risk-factor sections from the filings themselves are not machine-readable in our feed — we get filing metadata and links, not the text. The risks above are what the numbers show, not what the company discloses.");

  return {
    title: `${name} — risks`,
    mode: "company",
    headline: buildHeadline(claims, `What the numbers flag for ${name}`),
    claims, caveats, asOf: Date.now(),
    suggestions: [`What changed in ${symbol}'s latest earnings?`, `Why is ${symbol} moving today?`],
  };
}

/* ── 6. Filings ──────────────────────────────────────────────────────────── */

export async function analyzeFilings(symbol: string): Promise<Answer> {
  const name = metaFor(symbol)?.name || symbol;
  const filings = await fetchDataset<Filing[]>("filings", symbol);
  const claims: Claim[] = [];
  const caveats: string[] = [];

  if (!filings.ok) {
    return {
      title: `${name} — filings`, mode: "company",
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

  caveats.push("We list and link filings but do not summarise their contents: the full text is not in our feed, and summarising a document we have not read is exactly the failure this tool exists to avoid. Every filing above links to the original.");

  return {
    title: `${name} — recent filings`,
    mode: "company",
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
    mode: "trade",
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

/* ── headline ────────────────────────────────────────────────────────────── */

/** The headline inherits the weakest tier present, so a page whose conclusion
 *  rests on an inference can never be skimmed as established fact. */
function buildHeadline(claims: Claim[], fallback: string): string {
  if (claims.length === 0) return fallback;
  const t = weakestTier(claims);
  const facts = claims.filter((c) => c.tier === "FACT").length;
  const suffix =
    t === "FACT" ? "— all statements below are reported facts"
    : t === "CALCULATION" ? "— facts and arithmetic on them"
    : t === "INFERENCE" ? "— includes reasoning that could be wrong"
    : "— includes a judgement the data supports but does not establish";
  return `${fallback} ${suffix} (${facts} fact${facts === 1 ? "" : "s"} cited)`;
}
