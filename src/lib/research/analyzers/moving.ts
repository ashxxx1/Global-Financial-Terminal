/**
 * "Why is this stock moving?" and its follow-up, "is this temporary?".
 *
 * The structure is deliberate: state the move, size it against the stock's own
 * normal range, separate the part the sector explains from the part it does
 * not, list the news as fact, and only then — clearly marked — offer the link
 * between them as an inference. News volume rises after a large move at least
 * as often as it precedes one, and nothing in this data can tell the two apart.
 */
import { quoteFor, metaFor } from "../../market";
import { fetchDataset, num, type Metrics, type NewsItem, type Recommendation, type EarningsPoint } from "../data";
import { distribution, percentileWord } from "../series";
import type { Answer, Claim, Source } from "../types";
import {
  pct, mag, marketSource, median, dailyVol, sectorPeers,
  buildHeadline, capabilityCaveats, unavailableList, noQuoteAnswer, hist,
} from "./shared";
import { isRelevant } from "./newsRelevance";
import type { CapabilityId } from "../capabilities";

const WANTED: CapabilityId[] = [
  "quote", "price-history", "company-news", "analyst-ratings",
  "earnings-transcripts", "price-targets", "options-positioning",
];

const newsSource = (n: NewsItem): Source => ({
  kind: "news", label: n.source || "News", detail: n.headline,
  asOf: n.datetime * 1000, url: n.url, capability: "company-news",
});

export async function analyzeMoving(symbol: string): Promise<Answer> {
  const meta = metaFor(symbol);
  const q = quoteFor(symbol);
  const name = meta?.name || symbol;
  if (!q) return noQuoteAnswer(symbol);

  const claims: Claim[] = [];
  const caveats: string[] = [];
  const ms = marketSource(symbol);
  const live = !ms.simulated;

  claims.push({
    text: `${name} is ${q.changePct >= 0 ? "up" : "down"} ${mag(q.changePct)} at ${q.display}.`,
    tier: "FACT", confidence: live ? 1 : 0.5,
    why: live ? "Read directly from the live quote feed."
      : "This symbol has no live feed on our data plan — the price is simulated and labelled as such throughout the terminal.",
    sources: [ms],
  });
  if (!live) caveats.push(`${symbol} is not priced live on our data plan, so everything below rests on a simulated price.`);

  // Size the move against the stock's own normal daily range.
  const vol = dailyVol(symbol);
  if (vol && vol.sd > 0) {
    const z = q.changePct / vol.sd;
    claims.push({
      text: `That is a ${Math.abs(z).toFixed(1)}σ move against its own recent daily range (a typical day is ±${vol.sd.toFixed(2)}%).`,
      tier: "CALCULATION", confidence: live ? 0.95 : 0.5,
      why: `Standard deviation of the last ${vol.n} daily returns, with today's move divided by it. Reproducible from the price history.`,
      sources: [ms, {
        kind: "market", label: "Price history",
        detail: `${vol.n} daily returns, sample σ = ${vol.sd.toFixed(3)}%`,
        asOf: Date.now(), capability: "price-history", simulated: ms.simulated,
      }],
      calculation: {
        expression: `${q.changePct.toFixed(2)} ÷ ${vol.sd.toFixed(3)}`,
        inputs: [
          { label: "today's move", value: q.changePct },
          { label: "σ of daily returns", value: vol.sd },
        ],
        result: z, unit: "σ", n: vol.n,
      },
    });
  }

  // Separate company from sector.
  const peers = sectorPeers(symbol);
  const peerMed = median(peers.map((p) => p.changePct));
  if (peerMed !== null && peers.length >= 3) {
    const excess = q.changePct - peerMed;
    const share = Math.abs(q.changePct) > 1e-9 ? Math.abs(excess / q.changePct) * 100 : 0;
    claims.push({
      text: `Its ${meta?.sector} peers moved ${pct(peerMed)}, so about ${pct(excess)} — ${share.toFixed(0)}% of the move — is specific to ${name} rather than the sector.`,
      tier: "CALCULATION", confidence: 0.85,
      why: `Median change of ${peers.length} same-sector names in the same market, subtracted from this stock's move. Median rather than mean so a single erratic peer cannot skew the benchmark.`,
      sources: [ms, {
        kind: "peers", label: `${meta?.sector} peers`,
        detail: `${peers.length} names, median ${pct(peerMed)}: ${peers.slice(0, 6).map((p) => `${p.symbol} ${pct(p.changePct)}`).join(", ")}`,
        asOf: Date.now(), capability: "peers",
      }],
      calculation: {
        expression: `${q.changePct.toFixed(2)} − ${peerMed.toFixed(2)}`,
        inputs: [
          { label: `${symbol} move`, value: q.changePct },
          { label: `${meta?.sector} peer median`, value: peerMed },
        ],
        result: excess, unit: "pp", n: peers.length,
      },
    });
  } else {
    caveats.push("Too few live same-sector peers to separate the company's own move from its sector.");
  }

  // News as fact, attribution as inference — kept apart on purpose.
  const news = await fetchDataset<NewsItem[]>("news", symbol);
  if (news.ok) {
    const recent = news.data
      .filter((n) => n.datetime * 1000 >= Date.now() - 48 * 3600 * 1000)
      .filter((n) => isRelevant(n, name, symbol))
      .slice(0, 6);
    if (recent.length > 0) {
      claims.push({
        text: `${recent.length} article${recent.length > 1 ? "s" : ""} published in the last 48 hours, most recent: "${recent[0].headline}".`,
        tier: "FACT", confidence: 1,
        why: "Headlines and timestamps as published; repeated, not interpreted.",
        sources: recent.map(newsSource),
      });
      const idio = peerMed !== null ? Math.abs(q.changePct - peerMed) : Math.abs(q.changePct);
      const strength = Math.min(1, (recent.length / 6) * 0.5 + Math.min(idio / 3, 1) * 0.5);
      claims.push({
        text: `The move is plausibly connected to this coverage rather than to a sector-wide factor.`,
        tier: "INFERENCE", confidence: Math.max(0.2, Math.min(0.6, strength)),
        why: `Based on ${recent.length} recent articles and ${idio.toFixed(2)}pp of move unexplained by peers. This is co-occurrence in time, not demonstrated causation: coverage follows large moves as often as it precedes them, and nothing in this data separates the two.`,
        sources: recent.slice(0, 3).map(newsSource),
      });
    } else {
      caveats.push("No company news in the last 48 hours, so the move has no obvious news catalyst in our feed.");
    }
  }

  const recs = await fetchDataset<Recommendation[]>("recommendations", symbol);
  if (recs.ok && recs.data.length >= 2) {
    const [now, prev] = recs.data;
    const bull = (r: Recommendation) => r.strongBuy + r.buy;
    if (bull(now) !== bull(prev)) {
      claims.push({
        text: `Analyst buy ratings moved from ${bull(prev)} to ${bull(now)} between ${prev.period} and ${now.period}.`,
        tier: "FACT", confidence: 1,
        why: "Recommendation counts as published by the contributing analysts.",
        sources: [{
          kind: "analysts", label: "Analyst ratings",
          detail: `${now.period}: ${now.strongBuy} strong buy, ${now.buy} buy, ${now.hold} hold, ${now.sell} sell, ${now.strongSell} strong sell`,
          asOf: Date.parse(now.period) || Date.now(), capability: "analyst-ratings",
        }],
      });
    }
  }

  caveats.push(...capabilityCaveats(WANTED));

  return {
    title: `${name} — why it is moving`,
    mode: "moving",
    headline: buildHeadline(claims, `Why ${name} is ${q.changePct >= 0 ? "up" : "down"} today`),
    claims, caveats,
    unavailable: unavailableList(WANTED),
    asOf: Date.now(),
    suggestions: ["Is this temporary?", `What changed at ${symbol}?`, `What are the key risks to ${symbol}?`],
  };
}

/* ── "Is this temporary?" ────────────────────────────────────────────────── */

export async function analyzePersistence(symbol: string): Promise<Answer> {
  const name = metaFor(symbol)?.name || symbol;
  const q = quoteFor(symbol);
  const met = await fetchDataset<Metrics>("metrics", symbol);
  const claims: Claim[] = [];
  const caveats: string[] = [];
  const ms = marketSource(symbol);

  if (met.ok && q) {
    const hi = num(met.data, "52WeekHigh"), lo = num(met.data, "52WeekLow");
    if (hi && lo && hi > lo) {
      const pos = ((q.price - lo) / (hi - lo)) * 100;
      claims.push({
        text: `It sits ${pos.toFixed(0)}% up its 52-week range (${lo.toFixed(2)}–${hi.toFixed(2)}).`,
        tier: "CALCULATION", confidence: 0.9,
        why: "Current price against the reported 52-week high and low. A move that only retraces part of a range is weaker evidence of a regime change than one that breaks it.",
        sources: [ms, {
          kind: "fundamentals", label: "52-week range",
          detail: `high ${hi.toFixed(2)} (${met.data.metric?.["52WeekHighDate"]}), low ${lo.toFixed(2)} (${met.data.metric?.["52WeekLowDate"]})`,
          asOf: met.fetchedAt, capability: "fundamentals",
        }],
        calculation: {
          expression: `(${q.price.toFixed(2)} − ${lo.toFixed(2)}) ÷ (${hi.toFixed(2)} − ${lo.toFixed(2)}) × 100`,
          inputs: [
            { label: "price", value: q.price }, { label: "52w low", metricKey: "52WeekLow", value: lo },
            { label: "52w high", metricKey: "52WeekHigh", value: hi },
          ],
          result: pos, unit: "% of range",
        },
      });
    }

    // Historical context: is the current multiple unusual for this business?
    const peDist = distribution(hist(met.data, "peTTM"), 40);
    if (peDist) {
      claims.push({
        text: `Its P/E of ${peDist.current.toFixed(1)} sits ${percentileWord(peDist.percentile)} its own ${peDist.n}-quarter range, so the fall has ${peDist.percentile > 60 ? "not yet taken the multiple below its normal band" : "already brought the multiple into the lower part of its normal band"}.`,
        tier: "CALCULATION", confidence: 0.85,
        why: `Percentile of the current P/E against ${peDist.n} prior quarters (median ${peDist.median.toFixed(1)}). Where a multiple sits in its own history says more about how much has already been priced than the day's move does.`,
        sources: [{
          kind: "fundamental-history", label: "P/E history",
          detail: `current ${peDist.current.toFixed(2)}, median ${peDist.median.toFixed(2)}, range ${peDist.min.toFixed(1)}–${peDist.max.toFixed(1)} over ${peDist.n} quarters`,
          asOf: met.fetchedAt, metricKey: "peTTM", capability: "fundamental-history",
        }],
        calculation: {
          expression: `percentile of ${peDist.current.toFixed(2)} within ${peDist.n} prior quarters`,
          inputs: [
            { label: "current P/E", metricKey: "peTTM", value: peDist.current },
            { label: "median", value: peDist.median },
          ],
          result: peDist.percentile, unit: "percentile", n: peDist.n,
        },
      });
    }
  } else {
    caveats.push("Fundamental metrics were unavailable, so this rests on price behaviour alone.");
  }

  const earn = await fetchDataset<EarningsPoint[]>("earnings", symbol);
  let beats = 0;
  if (earn.ok) for (const e of earn.data) { if ((e.surprisePercent ?? 0) > 0) beats++; else break; }

  claims.push({
    text: beats >= 3
      ? `The business has beaten consensus ${beats} quarters running, which historically makes a fall more likely to be sentiment than deterioration — a pattern, not a prediction.`
      : `There is no consistent beat streak to lean on, so the data does not support calling this move temporary or permanent.`,
    tier: "OPINION", confidence: 0.35,
    why: "Whether a move reverses depends on information nobody has yet. This is a judgement about the balance of evidence, capped in confidence by design, and it is the weakest statement in this answer.",
    sources: earn.ok ? [{
      kind: "earnings", label: "Earnings surprises",
      detail: earn.data.slice(0, 4).map((e) => `${e.period}: ${e.actual} vs ${e.estimate} (${e.surprisePercent?.toFixed(1)}%)`).join(" · "),
      asOf: earn.fetchedAt, capability: "earnings-surprises",
    }] : [{ kind: "market", label: "Price only", detail: "No earnings history retrieved", asOf: Date.now(), capability: "quote" }],
  });

  caveats.push(...capabilityCaveats(["options-positioning", "earnings-transcripts", "eps-estimates"]));

  return {
    title: `${name} — is the move temporary?`,
    mode: "moving",
    headline: "Nobody can answer this with certainty; here is what the evidence supports.",
    claims, caveats,
    unavailable: unavailableList(["options-positioning", "earnings-transcripts", "eps-estimates"]),
    asOf: Date.now(),
    suggestions: [`Is ${symbol}'s valuation expensive?`, `What changed at ${symbol}?`],
  };
}
