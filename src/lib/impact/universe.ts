/**
 * Map an extracted event onto companies that actually exist in the GFT catalog.
 *
 * Selection is mechanism + country + sector + name/ticker overlays — not a
 * random sample of the universe. If the catalog has no honest proxy (e.g. a
 * dedicated Indian solar OEM), we say so rather than inventing a ticker.
 */
import { allStockSymbols, metaFor } from "../market";
import type { ExtractedEvent, EventKind, RegionFocus } from "./types";

export interface Candidate {
  symbol: string;
  name: string;
  country: string;
  sector: string;
  tags: string[];
  score: number;
  side: "beneficiary" | "negative";
  why: string;
}

const TAG_RULES: { tag: string; test: (s: string, name: string, sector: string, country: string) => boolean }[] = [
  { tag: "semiconductor", test: (s, n) => /NVDA|TSMC|2330|2454|2303|3711|INTC|AMD|AVGO|QCOM|MU|TSM/.test(s) || /tsmc|nvidia|mediatek|umc|ase |qualcomm|broadcom/i.test(n) },
  { tag: "ai-platform", test: (s, n) => /NVDA|MSFT|GOOGL|AMZN|META|9984/.test(s) || /nvidia|microsoft|alphabet|amazon|meta|softbank/i.test(n) },
  { tag: "foundry", test: (s, n) => /2330|2303|3711/.test(s) || /tsmc|united micro|ase /i.test(n) },
  { tag: "ems", test: (s, n) => /2317|Foxconn/i.test(s + n) },
  { tag: "solar-cn", test: (s, n) => /601012/.test(s) || /longi/i.test(n) },
  { tag: "energy-in", test: (s, n, sec, c) => c === "IN" && sec === "Energy" },
  { tag: "industrial-in", test: (s, n, sec, c) => c === "IN" && (sec === "Industrial" || /adani|larsen/i.test(n)) },
  { tag: "it-services-in", test: (s, n, sec, c) => c === "IN" && sec === "Technology" },
  { tag: "oil-producer", test: (s, n, sec) => {
    if (sec !== "Energy") return false;
    if (/longi|solar|green energy/i.test(n)) return false;
    return /XOM|CVX|SHEL|BP|RELIANCE|ONGC|PETR4|2222/.test(s) || /exxon|chevron|shell|petrobras|ongc|reliance|aramco|bp plc|oil|petro/i.test(n) || /XOM|CVX|SHEL|BP/.test(s);
  } },
  { tag: "defence", test: (s, n, sec) => sec === "Defence" },
  { tag: "bank", test: (s, n, sec) => sec === "Banking & Finance" },
  { tag: "ev-cn", test: (s, n) => /002594|300750/.test(s) || /byd|catl/i.test(n) },
  { tag: "auto", test: (s, n, sec) => sec === "Automotive" },
  { tag: "transport", test: (s, n, sec) => sec === "Transportation" },
  { tag: "real-estate", test: (s, n, sec) => sec === "Real Estate" },
  { tag: "tech-us", test: (s, n, sec, c) => c === "US" && sec === "Technology" },
  { tag: "taiwan-tech", test: (s, n, sec, c) => c === "TW" && sec === "Technology" },
];

function tagsFor(symbol: string, name: string, sector: string, country: string): string[] {
  return TAG_RULES.filter((r) => r.test(symbol, name, sector, country)).map((r) => r.tag);
}

export function catalogNote(ev: ExtractedEvent): string | null {
  if (ev.tags.includes("solar") && ev.countries.includes("IN")) {
    return "The GFT catalog has no dedicated Indian solar OEM ticker. Domestic-side names are energy and industrial groups that may capture manufacturing or project exposure — that is a proxy, not a confirmed solar P&L line.";
  }
  return null;
}

interface Rule {
  kinds: EventKind[];
  pick: (c: Candidate, ev: ExtractedEvent, region: RegionFocus) => { side: Candidate["side"]; score: number; why: string } | null;
}

const RULES: Rule[] = [
  {
    kinds: ["tariff", "trade-tensions"],
    pick: (c, ev) => {
      const solar = ev.tags.includes("solar") || /solar/i.test(ev.raw);
      if (solar) {
        if (c.tags.includes("solar-cn") || (c.country === "CN" && c.sector === "Energy")) {
          return { side: "negative", score: 88, why: "Chinese solar exporters lose competitiveness if destination-market tariffs raise landed cost." };
        }
        if (c.tags.includes("industrial-in") || c.tags.includes("energy-in")) {
          return { side: "beneficiary", score: 70, why: "Indian energy/industrial groups are the closest catalog proxies for domestic manufacturing that could gain share if imports become more expensive." };
        }
      }
      if (ev.countries.includes("IN") && ev.countries.includes("CN")) {
        if (c.country === "IN" && (c.sector === "Industrial" || c.sector === "Energy" || c.sector === "Automotive")) {
          return { side: "beneficiary", score: 62, why: "Domestic Indian producers can gain relative pricing power if Chinese imports are restricted." };
        }
        if (c.country === "CN" && (c.sector === "Industrial" || c.sector === "Automotive" || c.sector === "Technology")) {
          return { side: "negative", score: 68, why: "Chinese exporters with India-facing or globally substitutable products are the exposed side of a tariff." };
        }
      }
      if (c.tags.includes("ev-cn") && /ev|electric vehicle|auto/i.test(ev.raw)) {
        return { side: "negative", score: 80, why: "Chinese EV exporters are the direct object of destination-market EV tariffs." };
      }
      return null;
    },
  },
  {
    kinds: ["oil-shock"],
    pick: (c, ev) => {
      const up = (ev.shockValue ?? 120) >= 80;
      if (c.tags.includes("oil-producer")) {
        return { side: up ? "beneficiary" : "negative", score: 86, why: up
          ? "Integrated and upstream energy names typically see cash flow expand when crude prices rise, all else equal."
          : "A lower oil price compresses upstream realisations." };
      }
      if (c.sector === "Transportation" || c.tags.includes("auto")) {
        return { side: up ? "negative" : "beneficiary", score: 64, why: "Fuel is a large variable cost for transport and a demand headwind for auto if prices spike." };
      }
      if (c.sector === "Airlines" || /air/i.test(c.name)) {
        return { side: "negative", score: 70, why: "Jet fuel is a primary cost line for airlines." };
      }
      if (c.sector === "Consumer" && up) {
        return { side: "negative", score: 48, why: "Higher energy prices can squeeze real household income and discretionary spend — a second-order effect, so conviction is lower." };
      }
      return null;
    },
  },
  {
    kinds: ["rate-cut"],
    pick: (c) => {
      if (c.tags.includes("tech-us") || c.sector === "Technology" || c.sector === "Real Estate") {
        return { side: "beneficiary", score: 72, why: "Long-duration growth and housing-linked assets usually re-rate when the discount rate falls." };
      }
      if (c.tags.includes("bank")) {
        return { side: "negative", score: 55, why: "Net interest margins can compress as rates fall, though credit and volumes can offset — hence a watch/negative lean, not a hard call." };
      }
      return null;
    },
  },
  {
    kinds: ["rate-hike", "rates-stay-high"],
    pick: (c, ev) => {
      if (c.tags.includes("bank") && (ev.countries.length === 0 || ev.countries.includes(c.country) || c.country === "US")) {
        return { side: "beneficiary", score: 66, why: "Deposit-funded banks can earn a wider net interest margin while policy rates stay high, if credit losses remain contained." };
      }
      if (c.sector === "Technology" || c.sector === "Real Estate") {
        return { side: "negative", score: 70, why: "Elevated discount rates weigh on long-duration cash-flow streams and leveraged property." };
      }
      return null;
    },
  },
  {
    kinds: ["fx-move"],
    pick: (c, ev) => {
      const inrDown = ev.currencies.includes("INR") || ev.countries.includes("IN");
      if (inrDown && c.tags.includes("it-services-in")) {
        return { side: "beneficiary", score: 84, why: "Indian IT majors earn a large share of revenue in USD/EUR; a weaker rupee lifts reported INR earnings if volumes hold." };
      }
      if (inrDown && (c.sector === "Energy" || c.tags.includes("auto")) && c.country === "IN") {
        return { side: "negative", score: 70, why: "India is a crude importer; a weaker rupee raises local fuel and imported-component costs." };
      }
      return null;
    },
  },
  {
    kinds: ["ai-cycle", "product-announcement"],
    pick: (c, ev) => {
      const named = ev.companiesNamed.includes(c.symbol);
      if (c.tags.includes("semiconductor") || c.tags.includes("ai-platform") || c.tags.includes("foundry")) {
        return { side: "beneficiary", score: named ? 92 : 78, why: named
          ? "Named in the question and sitting on the AI/semiconductor supply chain the mechanism describes."
          : "Direct AI infrastructure or semiconductor exposure in the GFT catalog." };
      }
      if (c.tags.includes("ems") || c.tags.includes("taiwan-tech")) {
        return { side: "beneficiary", score: 70, why: "Taiwan tech supply chain captures foundry, OSAT and EMS spend when AI hardware units rise." };
      }
      if (named && !c.tags.includes("semiconductor")) {
        return { side: "beneficiary", score: 60, why: "Named in the question; mechanism fit is weaker than a semiconductor name." };
      }
      // Close substitutes can lose share on a product cycle.
      if (ev.kind === "product-announcement" && c.sector === "Technology" && c.country === "US" && !named && !c.tags.includes("ai-platform")) {
        return { side: "negative", score: 42, why: "Other US tech names can lose relative budget share if the cycle concentrates — this is an inference, not a reported displacement." };
      }
      return null;
    },
  },
  {
    kinds: ["geopolitics"],
    pick: (c) => {
      if (c.tags.includes("taiwan-tech") || c.tags.includes("foundry") || c.tags.includes("ems")) {
        return { side: "negative", score: 90, why: "Taiwan semiconductor and electronics supply chain is the concentrated operational risk in a Strait scenario." };
      }
      if (c.tags.includes("defence")) {
        return { side: "beneficiary", score: 74, why: "Defence contractors typically see bid-ask for risk premia and longer-cycle procurement demand in a security shock." };
      }
      if (c.tags.includes("oil-producer")) {
        return { side: "beneficiary", score: 58, why: "Geopolitical risk premia often lift energy prices; this is a second-order channel." };
      }
      if (c.tags.includes("ai-platform") && c.country === "US") {
        return { side: "negative", score: 52, why: "US designers that depend on Taiwan foundry capacity are operationally exposed even if listed elsewhere." };
      }
      return null;
    },
  },
  {
    kinds: ["defence-spending"],
    pick: (c) => {
      if (c.tags.includes("defence") || (c.country === "IN" && c.sector === "Industrial")) {
        return { side: "beneficiary", score: c.tags.includes("defence") ? 88 : 50, why: c.tags.includes("defence")
          ? "Primary aerospace & defence contractor in the catalog."
          : "Indian industrial groups are a weak proxy for domestic defence manufacturing — listed because the catalog has no dedicated Indian defence OEM." };
      }
      return null;
    },
  },
  {
    kinds: ["portfolio-risk"],
    pick: (c) => {
      if (c.tags.includes("tech-us") || c.sector === "Technology") {
        return { side: "negative", score: 60, why: "Technology factor exposure: rates, regulation, earnings revisions and crowding are the risks a tech-heavy book inherits." };
      }
      if (c.sector === "Utilities" || c.sector === "Consumer") {
        return { side: "beneficiary", score: 40, why: "Defensive sectors are the usual diversifiers against a concentrated tech book — not a recommendation to buy them." };
      }
      return null;
    },
  },
];

function regionOk(country: string, region: RegionFocus): boolean {
  if (region === "global") return true;
  if (region === "IN") return country === "IN";
  if (region === "US") return country === "US";
  if (region === "EU") return ["DE", "FR", "GB", "NL", "IT", "ES", "CH"].includes(country);
  return true;
}

export function rankCompanies(ev: ExtractedEvent, region: RegionFocus = "global"): Candidate[] {
  const rules = RULES.filter((r) => r.kinds.includes(ev.kind) || (ev.kind === "news-event" && r.kinds.includes("trade-tensions")));
  const out: Candidate[] = [];

  for (const symbol of allStockSymbols()) {
    const meta = metaFor(symbol);
    if (!meta || meta.kind !== "stock") continue;
    const country = meta.country || "";
    if (!regionOk(country, region)) continue;
    const tags = tagsFor(symbol, meta.name, meta.sector, country);
    const base: Candidate = {
      symbol, name: meta.name, country, sector: meta.sector, tags, score: 0, side: "beneficiary", why: "",
    };
    let best: { side: Candidate["side"]; score: number; why: string } | null = null;
    for (const rule of rules) {
      const hit = rule.pick(base, ev, region);
      if (hit && (!best || hit.score > best.score)) best = hit;
    }
    if (ev.companiesNamed.includes(symbol) && !best) {
      best = { side: "beneficiary", score: 45, why: "Named in the question; no stronger mechanism match in the catalog." };
    }
    if (!best) continue;
    out.push({ ...base, ...best });
  }

  out.sort((a, b) => b.score - a.score);
  // Keep the list readable and mechanism-true: top N each side.
  const bens = out.filter((c) => c.side === "beneficiary").slice(0, 8);
  const negs = out.filter((c) => c.side === "negative").slice(0, 8);
  return [...bens, ...negs];
}
