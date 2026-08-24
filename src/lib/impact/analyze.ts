/**
 * Impact Copilot entry: question + scenario + optional positions → analysis.
 */
import { extractEvent } from "./extract";
import type { Source } from "../market";
import { applyScenario, scenarioFromExtracted } from "./scenario";
import { catalogNote, rankCompanies } from "./universe";
import { enrichSymbol } from "./enrich";
import { toCompanyImpact, defaultRisks } from "./signals";
import { findPrecedents } from "./history";
import { scoreConfidence } from "./confidence";
import { portfolioExposure } from "./portfolio";
import { IMPACT_DISCLAIMER, type ImpactAnalysis, type ImpactChainStep, type ScenarioAssumptions, type SectorView, type ImpactSource } from "./types";
import { fetchGlobalNews } from "../newsFeed";
import type { Position } from "../../store";

function chainFor(ev: ReturnType<typeof extractEvent>, scenario: ScenarioAssumptions): ImpactChainStep[] {
  const oil = scenario.oilPrice != null ? `Oil assumption $${scenario.oilPrice}` : null;
  return [
    { label: "EVENT", text: ev.event },
    { label: "ECONOMIC MECHANISM", text: ev.mechanism },
    { label: "SECTOR IMPACT", text: ev.sectors.length ? ev.sectors.join(" · ") : "No sector mapped with enough confidence." },
    { label: "COMPANY IMPACT", text: "Ranked from the GFT catalog by mechanism and geography — not a random sample." },
    { label: "STOCK SIGNAL", text: oil
      ? `${oil}. Signals are GFT analytical views (positive / watch / negative), not advice.`
      : "Signals are GFT analytical views (positive / watch / negative), not advice." },
  ];
}

function sectorViews(ev: ReturnType<typeof extractEvent>, bens: { sector: string }[], negs: { sector: string }[]): SectorView[] {
  const names = [...new Set([...ev.sectors, ...bens.map((c) => c.sector), ...negs.map((c) => c.sector)])];
  return names.map((name) => {
    const p = bens.filter((c) => c.sector === name).length;
    const n = negs.filter((c) => c.sector === name).length;
    const stance: SectorView["stance"] = p > n && n === 0 ? "positive" : n > p && p === 0 ? "negative" : "mixed";
    const why = stance === "positive"
      ? `Catalog matches on the beneficiary side of this mechanism.`
      : stance === "negative"
        ? `Catalog matches on the exposed side of this mechanism.`
        : `Both beneficiary and exposed names appear in this sector — treat as mixed.`;
    return { name, stance, why };
  });
}

export async function analyzeImpact(
  question: string,
  opts: {
    scenario?: ScenarioAssumptions | null;
    positions?: Position[];
  } = {},
): Promise<ImpactAnalysis> {
  const trimmed = question.trim();
  const asOf = Date.now();
  const id = `imp-${asOf.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

  if (trimmed.length < 8) {
    const extracted = extractEvent(trimmed || " ");
    return {
      id, question: trimmed, asOf, extracted,
      scenario: opts.scenario ?? scenarioFromExtracted(extracted),
      chain: [],
      sectors: [],
      beneficiaries: [],
      negatives: [],
      watch: [],
      risks: ["Ask a specific event, policy, price or geopolitical question."],
      confidence: {
        score: 0,
        explanation: "Insufficient evidence — confidence low. The query is empty or too short to map.",
        factors: [],
        insufficient: true,
      },
      precedents: [],
      portfolio: null,
      sources: [],
      caveats: ["Type a market, company, economic or geopolitical question to run the copilot."],
      relatedNews: [],
      dataFreshness: new Date(asOf).toISOString(),
      disclaimer: IMPACT_DISCLAIMER,
    };
  }

  const extracted0 = extractEvent(trimmed);
  const scenario = opts.scenario ?? scenarioFromExtracted(extracted0);
  const extracted = applyScenario(extracted0, scenario);
  const candidates = rankCompanies(extracted, scenario.region);
  const caveatCatalog = catalogNote(extracted);

  const top = candidates.slice(0, 12);
  const enriched = await Promise.all(top.map(async (c) => ({ c, e: await enrichSymbol(c.symbol) })));

  let news: ImpactAnalysis["relatedNews"] = [];
  try {
    const g = await fetchGlobalNews(6);
    const keys = [extracted.kind, ...extracted.tags, ...extracted.commodities, ...extracted.event.split(" ").slice(0, 3)]
      .map((x) => x.toLowerCase());
    news = g
      .filter((a) => keys.some((k) => k.length > 2 && (a.title + a.description).toLowerCase().includes(k)))
      .slice(0, 5)
      .map((a) => ({ title: a.title, source: a.source, url: a.url, asOf: a.publishedAt }));
  } catch {
    /* news is additive */
  }

  const precedents = await findPrecedents(extracted);
  const precedentNote = precedents.length
    ? precedents.map((p) => `${p.date}: ${p.event}`).join(" · ")
    : "No close documented analog in the GFT precedent table.";

  const companies = enriched.map(({ c, e }) => toCompanyImpact(c, extracted, {
    metrics: e.metrics,
    quoteSource: e.quoteSource,
    lastPrice: e.lastPrice,
    changePct: e.changePct,
    duration: scenario.duration,
    precedentNote,
    catalogCaveat: caveatCatalog,
  }));

  const beneficiaries = companies.filter((x) => x.side === "beneficiary");
  const negatives = companies.filter((x) => x.side === "negative");

  const liveQuotes = enriched.filter((x) => x.e.quoteSource === "live" || x.e.quoteSource === "cached").length;
  const liveFundamentals = enriched.filter((x) => x.e.metrics.some((m) => /finnhub/i.test(m.source))).length;
  const confidence = scoreConfidence({
    extracted,
    candidates,
    liveQuotes,
    liveFundamentals,
    precedentsWithData: precedents.filter((p) => p.dataAvailable).length,
    newsHits: news.length,
    contradictory: beneficiaries.length && negatives.length ? 1 : 0,
  });

  const sources: ImpactSource[] = [
    { kind: "catalog", label: "GFT company universe", detail: `${candidates.length} mechanism-matched listings`, asOf },
    { kind: "scenario", label: "Scenario", detail: `region=${scenario.region} duration=${scenario.duration} risk=${scenario.riskLevel}${scenario.oilPrice != null ? ` oil=$${scenario.oilPrice}` : ""}`, asOf },
  ];
  if (liveQuotes) sources.push({ kind: "market", label: "Quotes", detail: `${liveQuotes} live/cached quotes`, asOf });
  if (liveFundamentals) sources.push({ kind: "fundamentals", label: "Finnhub metrics", detail: `${liveFundamentals} snapshots`, asOf });
  if (news.length) sources.push({ kind: "news", label: "Related headlines", detail: `${news.length} matches`, asOf });
  if (precedents.length) sources.push({ kind: "history", label: "Documented precedents", detail: precedents.map((p) => p.date).join(", "), asOf });

  const caveats = [
    IMPACT_DISCLAIMER,
    extracted.parseNote,
    "FACT rows are catalog membership and retrieved figures. Mechanism mapping is INFERENCE. Signals are GFT'S ANALYTICAL VIEW.",
  ];
  if (caveatCatalog) caveats.push(caveatCatalog);
  for (const e of enriched) if (e.e.caveat) caveats.push(`${e.c.symbol}: ${e.e.caveat}`);
  const noPriceN = enriched.filter((x) => x.e.quoteSource === "pending" || x.e.quoteSource === "unavailable").length;
  if (noPriceN) caveats.push(`${noPriceN} of these companies show no price: either a feed covers them and has not answered yet, or no feed reaches their exchange. No figure is substituted for them.`);

  const watch = [
    ...extracted.macro,
    ...extracted.commodities.map((c) => `${c} price`),
    ...extracted.currencies.map((c) => `${c} spot`),
    "Policy / official statements that would reverse the mechanism",
    "Earnings or contract prints for the ranked names",
  ].filter(Boolean);

  return {
    id,
    question: trimmed,
    asOf,
    extracted,
    scenario,
    chain: chainFor(extracted, scenario),
    sectors: sectorViews(extracted, beneficiaries, negatives),
    beneficiaries,
    negatives,
    watch,
    risks: defaultRisks(extracted.kind),
    confidence,
    precedents,
    portfolio: opts.positions ? portfolioExposure(opts.positions, companies) : null,
    sources,
    caveats: [...new Set(caveats)],
    relatedNews: news,
    dataFreshness: new Date(asOf).toISOString(),
    disclaimer: IMPACT_DISCLAIMER,
  };
}
