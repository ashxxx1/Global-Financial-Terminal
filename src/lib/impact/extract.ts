/**
 * Natural-language event extraction.
 *
 * Deterministic, the same philosophy as the research intent parser: a visible
 * miss ("we could not identify a mechanism") beats a fluent guess about the
 * wrong event. Named companies still resolve against the GFT universe.
 */
import { allStockSymbols, metaFor, COUNTRIES } from "../market";
import type { Direction, EventKind, ExtractedEvent, Horizon, ImpactMagnitude } from "./types";

const STOP = new Set([
  "the", "and", "for", "are", "why", "how", "what", "who", "was", "has", "its",
  "up", "down", "is", "in", "on", "to", "of", "vs", "or", "at", "it", "this",
  "stock", "stocks", "today", "if", "just", "could", "would", "should", "i",
  "have", "a", "my", "be", "aware", "watch", "happens", "happen", "means",
]);

let index: { symbol: string; name: string; words: string[] }[] | null = null;
function symbolIndex() {
  if (index) return index;
  index = allStockSymbols().map((s) => {
    const name = (metaFor(s)?.name || s).toLowerCase();
    return { symbol: s, name, words: name.split(/[^a-z0-9]+/).filter((w) => w.length > 2) };
  });
  return index;
}

function namedCompanies(q: string): string[] {
  const qLower = q.toLowerCase();
  const found: string[] = [];
  const seen = new Set<string>();
  for (const m of qLower.matchAll(/\b([a-z]{1,8})\b/g)) {
    const up = m[1].toUpperCase();
    if (STOP.has(m[1])) continue;
    if (metaFor(up) && !seen.has(up)) { seen.add(up); found.push(up); }
  }
  for (const entry of symbolIndex()) {
    if (seen.has(entry.symbol)) continue;
    if (entry.words.some((w) => w.length > 3 && new RegExp(`\\b${w}\\b`).test(qLower))) {
      seen.add(entry.symbol);
      found.push(entry.symbol);
    }
  }
  return found;
}

const COUNTRY_ALIASES: { test: RegExp; code: string }[] = [
  { test: /\bindia\b|indian|\brupee\b|\binr\b/i, code: "IN" },
  { test: /\bchina\b|chinese|\byuan\b|\bcny\b|\brmb\b/i, code: "CN" },
  { test: /\btaiwan\b|taiwanese/i, code: "TW" },
  { test: /\bunited states\b|\bu\.?s\.?\b|\bamerica\b|\bfed\b|\bdollar\b/i, code: "US" },
  { test: /\beurope\b|\beu\b|\becb\b|\beuro\b/i, code: "DE" },
  { test: /\bjapan\b|\byen\b|\bboj\b/i, code: "JP" },
  { test: /\buk\b|\bbritain\b|\bgilt/i, code: "GB" },
  { test: /\brussia\b/i, code: "RU" },
  { test: /\bsaudi\b|\bopec\b/i, code: "SA" },
  { test: /\bkorea\b|\bsouth korea\b/i, code: "KR" },
];

function countriesIn(q: string): string[] {
  const out: string[] = [];
  for (const a of COUNTRY_ALIASES) {
    if (a.test.test(q) && COUNTRIES[a.code] && !out.includes(a.code)) out.push(a.code);
  }
  return out;
}

interface KindMatch {
  kind: EventKind;
  test: RegExp;
  mechanism: string;
  sectors: string[];
  industries: string[];
  commodities: string[];
  currencies: string[];
  macro: string[];
  tags: string[];
  direction: Direction;
  event: (q: string) => string;
}

const KINDS: KindMatch[] = [
  {
    kind: "tariff",
    test: /tariff|dut(y|ies)|import tax|import levy|protectionis/i,
    mechanism: "Higher import costs raise prices of foreign goods, which can shift demand toward domestic substitutes while squeezing importers and downstream buyers.",
    sectors: ["Energy", "Industrial", "Automotive", "Technology"],
    industries: ["Solar", "Renewable Energy", "Manufacturing", "Trade"],
    commodities: [],
    currencies: [],
    macro: ["trade", "import prices"],
    tags: ["tariff", "trade"],
    direction: "mixed",
    event: (q) => summarise(q, "Tariff / import-duty change"),
  },
  {
    kind: "trade-tensions",
    test: /trade tension|trade war|export ban|sanction|decoupl/i,
    mechanism: "Trade friction reroutes supply chains, raises compliance and input costs, and reprices companies with cross-border revenue or manufacturing exposure.",
    sectors: ["Technology", "Industrial", "Automotive", "Energy"],
    industries: ["Semiconductors", "Manufacturing", "Export"],
    commodities: [],
    currencies: [],
    macro: ["trade"],
    tags: ["trade", "geopolitics"],
    direction: "mixed",
    event: (q) => summarise(q, "Trade-tension shock"),
  },
  {
    kind: "oil-shock",
    test: /\boil\b|brent|wti|crude|opec|\$1[0-9]{2}\b/,
    mechanism: "A higher oil price transfers income to producers and energy exporters and raises fuel and input costs for transporters, airlines, chemicals and energy-intensive manufacturers.",
    sectors: ["Energy", "Transportation", "Automotive", "Industrial", "Consumer"],
    industries: ["Oil & Gas", "Airlines", "Chemicals"],
    commodities: ["oil"],
    currencies: [],
    macro: ["inflation", "terms of trade"],
    tags: ["oil", "commodity-shock"],
    direction: "mixed",
    event: (q) => summarise(q, "Oil-price move"),
  },
  {
    kind: "rate-cut",
    test: /cut rates|rate cut|cuts rates|easing cycle|50 bps|fed cut|lowers (the )?rate/i,
    mechanism: "Lower policy rates reduce discount rates and funding costs. Duration-sensitive growth assets and housing-linked demand typically reprice first; net-interest-margin at some banks can compress.",
    sectors: ["Technology", "Real Estate", "Banking & Finance", "Consumer"],
    industries: ["Growth equities", "Housing", "Banks"],
    commodities: [],
    currencies: [],
    macro: ["interest rates", "liquidity"],
    tags: ["rates", "monetary-policy"],
    direction: "mixed",
    event: (q) => summarise(q, "Policy-rate cut"),
  },
  {
    kind: "rate-hike",
    test: /hike(s)? rates|rate hike|raises rates|tightening cycle|fed hike/i,
    mechanism: "Higher policy rates raise discount rates and borrowing costs. Rate-sensitive growth and housing typically weaken; net interest income at deposit-funded banks can improve if credit losses stay contained.",
    sectors: ["Banking & Finance", "Technology", "Real Estate", "Consumer"],
    industries: ["Banks", "Housing", "Growth equities"],
    commodities: [],
    currencies: [],
    macro: ["interest rates"],
    tags: ["rates", "monetary-policy"],
    direction: "mixed",
    event: (q) => summarise(q, "Policy-rate hike"),
  },
  {
    kind: "rates-stay-high",
    test: /rates stay high|higher for longer|high interest rates|restrictive (policy|stance)/i,
    mechanism: "A prolonged high-rate regime keeps discount rates elevated, pressures leveraged balance sheets and housing, and favours cash-flow visibility over long-duration growth stories.",
    sectors: ["Banking & Finance", "Technology", "Real Estate", "Utilities"],
    industries: ["Banks", "Housing", "Levered growth"],
    commodities: [],
    currencies: [],
    macro: ["interest rates", "financial conditions"],
    tags: ["rates", "higher-for-longer"],
    direction: "mixed",
    event: () => "Policy rates remain restrictive",
  },
  {
    kind: "fx-move",
    test: /rupee|fx |currency|depreciat|falls 5%|dollar (strength|surge)|yen/i,
    mechanism: "A weaker domestic currency lifts local-currency earnings of exporters and can squeeze importers and companies with unhedged foreign-currency costs.",
    sectors: ["Technology", "Energy", "Automotive", "Consumer"],
    industries: ["IT services", "Exporters", "Importers"],
    commodities: [],
    currencies: [],
    macro: ["FX", "import prices"],
    tags: ["fx"],
    direction: "mixed",
    event: (q) => summarise(q, "Currency move"),
  },
  {
    kind: "ai-cycle",
    test: /\bai\b|artificial intelligence|gpu|data center|semiconductor|chip/i,
    mechanism: "Incremental AI demand concentrates in semiconductor designers, foundries, memory, networking and power infrastructure, while laggards without a product cycle can lose relative spend.",
    sectors: ["Technology", "Industrial", "Utilities", "Energy"],
    industries: ["Semiconductors", "AI infrastructure", "Foundries"],
    commodities: ["copper", "electricity"],
    currencies: [],
    macro: [],
    tags: ["ai", "semiconductors"],
    direction: "mixed",
    event: (q) => summarise(q, "AI / semiconductor cycle"),
  },
  {
    kind: "geopolitics",
    test: /invade|invasion|taiwan|war |conflict|geopolit|strait|blockade/i,
    mechanism: "A geopolitical shock reprices supply-chain concentration (especially semiconductors), defence demand, energy risk premia and risk assets more broadly.",
    sectors: ["Technology", "Defence", "Energy", "Banking & Finance"],
    industries: ["Semiconductors", "Defence", "Shipping"],
    commodities: ["oil"],
    currencies: [],
    macro: ["risk premium"],
    tags: ["geopolitics", "taiwan", "semiconductors"],
    direction: "mixed",
    event: (q) => summarise(q, "Geopolitical shock"),
  },
  {
    kind: "defence-spending",
    test: /defence|defense spending|military|rearm|procurement/i,
    mechanism: "Higher government defence outlays support contractors with backlog and domestic manufacturing, with lag from announcement to cash flow.",
    sectors: ["Defence", "Industrial"],
    industries: ["Aerospace & Defence"],
    commodities: [],
    currencies: [],
    macro: ["fiscal"],
    tags: ["defence"],
    direction: "positive",
    event: (q) => summarise(q, "Defence-spending impulse"),
  },
  {
    kind: "product-announcement",
    test: /announced|unveils|launches|new (ai )?chip|product cycle/i,
    mechanism: "A product cycle can reallocate demand toward the announcer and its suppliers and away from close substitutes, if the product is adopted.",
    sectors: ["Technology"],
    industries: ["Semiconductors"],
    commodities: [],
    currencies: [],
    macro: [],
    tags: ["product-cycle"],
    direction: "mixed",
    event: (q) => summarise(q, "Corporate product announcement"),
  },
  {
    kind: "portfolio-risk",
    test: /portfolio|exposed to technology|what risks should i|concentration/i,
    mechanism: "A concentrated book inherits the factor risks of that sleeve — rates, regulation, earnings revisions and common factor drawdowns — rather than a single-name story.",
    sectors: ["Technology"],
    industries: ["Portfolio construction"],
    commodities: [],
    currencies: [],
    macro: ["factor risk"],
    tags: ["portfolio"],
    direction: "uncertain",
    event: () => "Portfolio factor-risk review",
  },
];

function summarise(q: string, fallback: string): string {
  const cleaned = q.replace(/\s+/g, " ").trim();
  if (cleaned.length < 120) return cleaned.replace(/[?!.]+$/, "");
  return fallback;
}

function horizonOf(q: string): Horizon {
  if (/today|this week|immediate|short[- ]term|next (few )?months|3 months/i.test(q)) return "Short";
  if (/long[- ]term|decade|multi-year|2 years/i.test(q)) return "Long";
  return "Medium";
}

function shockOf(q: string): { value: number | null; unit: string | null } {
  const oil = q.match(/\$\s?(\d{2,3})\b/);
  if (oil && /oil|brent|crude|wti/i.test(q)) return { value: Number(oil[1]), unit: "USD/bbl" };
  const bps = q.match(/(\d{2,3})\s*bps/i);
  if (bps) return { value: Number(bps[1]), unit: "bps" };
  const fx = q.match(/falls?\s+(\d+(?:\.\d+)?)\s*%/i) || q.match(/(\d+(?:\.\d+)?)\s*%/);
  if (fx && /rupee|currency|fx|depreciat/i.test(q)) return { value: Number(fx[1]), unit: "%" };
  return { value: null, unit: null };
}

function currenciesIn(q: string, kind: EventKind): string[] {
  const out: string[] = [];
  if (/rupee|\binr\b/i.test(q)) out.push("INR");
  if (/dollar|\busd\b|\bdxy\b/i.test(q)) out.push("USD");
  if (/yuan|cny|rmb/i.test(q)) out.push("CNY");
  if (/yen|\bjpy\b/i.test(q)) out.push("JPY");
  if (/euro|\beur\b/i.test(q)) out.push("EUR");
  if (kind === "fx-move" && out.length === 0) out.push("USD");
  return out;
}

function magnitudeHint(kind: EventKind, shock: number | null, q: string): ImpactMagnitude {
  if (/invade|war |crash|150|200 bps/i.test(q)) return "High";
  if (kind === "geopolitics" || kind === "oil-shock") return shock && shock >= 140 ? "High" : "Medium";
  if (kind === "tariff" || kind === "rate-cut" || kind === "rate-hike") return "Medium";
  if (kind === "portfolio-risk") return "Medium";
  return "Low";
}

export function looksLikeImpactQuestion(raw: string): boolean {
  const q = raw.trim();
  if (q.length < 8) return false;
  if (KINDS.some((k) => k.test.test(q))) return true;
  return /what happens|who benefits|who (lose|loses)|market impact|sectors? (are )?(likely|could)|companies could|negatively affected|what should i watch/i.test(q);
}

export function extractEvent(raw: string): ExtractedEvent {
  const q = raw.replace(/\s+/g, " ").trim();
  const companiesNamed = namedCompanies(q);
  const countries = countriesIn(q);
  const hits = KINDS.filter((k) => k.test.test(q));
  const primary = hits[0];
  const kind: EventKind = primary?.kind ?? (looksLikeImpactQuestion(q) ? "news-event" : "generic");
  const shock = shockOf(q);

  const sectors = unique([
    ...(primary?.sectors ?? []),
    ...hits.flatMap((h) => h.sectors),
    ...(companiesNamed.map((s) => metaFor(s)?.sector).filter(Boolean) as string[]),
  ]);
  const industries = unique(hits.flatMap((h) => h.industries));
  const commodities = unique([
    ...hits.flatMap((h) => h.commodities),
    ...(/gold/i.test(q) ? ["gold"] : []),
    ...(/copper/i.test(q) ? ["copper"] : []),
    ...(/gas|lng/i.test(q) ? ["natural gas"] : []),
  ]);
  const macro = unique(hits.flatMap((h) => h.macro));
  const tags = unique(hits.flatMap((h) => h.tags));
  const currencies = unique([...hits.flatMap((h) => h.currencies), ...currenciesIn(q, kind)]);

  let parseConfidence = 0.28;
  if (primary) parseConfidence += 0.35;
  if (hits.length > 1) parseConfidence += 0.08;
  if (countries.length) parseConfidence += 0.1;
  if (companiesNamed.length) parseConfidence += 0.08;
  if (shock.value != null) parseConfidence += 0.08;
  parseConfidence = Math.min(0.92, parseConfidence);

  const parseNote = primary
    ? `Mapped onto the “${kind}” mechanism from the wording of the question.`
    : "No specialised mechanism matched cleanly — treating this as a generic news/event question. Confidence stays low until a clearer channel is named.";

  const mechanism = primary?.mechanism
    ?? "The question does not name a channel we can map onto a specific economic mechanism. Any company list would be speculation, so the engine stays conservative.";

  const event = primary?.event(q) ?? summarise(q, "Unspecified market event");

  // Solar-specific overlay — the catalog has LONGi; Indian names are energy/industrial proxies.
  if (/solar|pv |photovoltaic|renewable/i.test(q)) {
    if (!industries.includes("Solar")) industries.push("Solar");
    if (!sectors.includes("Energy")) sectors.push("Energy");
    tags.push("solar");
  }

  return {
    raw: q,
    event,
    kind,
    countries,
    sectors,
    industries,
    companiesNamed,
    commodities,
    currencies,
    macro,
    horizon: horizonOf(q),
    direction: primary?.direction ?? "uncertain",
    mechanism,
    magnitudeHint: magnitudeHint(kind, shock.value, q),
    shockValue: shock.value,
    shockUnit: shock.unit,
    tags: unique(tags),
    parseConfidence,
    parseNote,
  };
}

function unique(xs: string[]): string[] {
  return [...new Set(xs.filter(Boolean))];
}

export const EXAMPLE_PROMPTS = [
  "Oil reaches $150 — who benefits?",
  "Fed cuts rates — what changes?",
  "India-China trade tensions — market impact?",
  "AI boom — biggest beneficiaries?",
];
