/**
 * Deterministic checks for event extraction and ranking.
 * Run: node --import tsx src/lib/impact/selftest.ts
 * (also invoked from scripts/impact-tests.mjs)
 */
import { extractEvent, looksLikeImpactQuestion } from "./extract";
import { rankCompanies } from "./universe";

export function runImpactSelftest(): { name: string; ok: boolean; detail?: string }[] {
  const out: { name: string; ok: boolean; detail?: string }[] = [];
  const check = (name: string, ok: boolean, detail?: string) => { out.push({ name, ok, detail }); };

  check("empty is not an impact question", !looksLikeImpactQuestion(""));
  check("short is not an impact question", !looksLikeImpactQuestion("hi"));

  const tariff = extractEvent("What happens if India increases tariffs on Chinese solar panels?");
  check("tariff kind", tariff.kind === "tariff", tariff.kind);
  check("tariff countries IN+CN", tariff.countries.includes("IN") && tariff.countries.includes("CN"), tariff.countries.join(","));
  check("tariff solar tag", tariff.tags.includes("solar") || tariff.industries.includes("Solar"));
  const tRank = rankCompanies(tariff);
  check("tariff has LONGi on negative side", tRank.some((c) => c.symbol === "601012" && c.side === "negative"));
  check("tariff has an Indian beneficiary proxy", tRank.some((c) => c.country === "IN" && c.side === "beneficiary"));

  const oil = extractEvent("Oil just crossed $120. What companies could benefit?");
  check("oil kind", oil.kind === "oil-shock", oil.kind);
  check("oil shock 120", oil.shockValue === 120, String(oil.shockValue));
  const oRank = rankCompanies(oil);
  check("oil XOM beneficiary", oRank.some((c) => c.symbol === "XOM" && c.side === "beneficiary"));
  check("oil does not treat LONGi as a producer", !oRank.some((c) => c.symbol === "601012" && c.side === "beneficiary"));
  check("oil does not treat Airtel as an airline", !oRank.some((c) => c.symbol === "BHARTIARTL"));

  const fed = extractEvent("The Fed cut rates by 50 bps. What sectors are likely to benefit?");
  check("rate-cut kind", fed.kind === "rate-cut", fed.kind);
  check("rate-cut 50 bps", fed.shockValue === 50 && fed.shockUnit === "bps", `${fed.shockValue}${fed.shockUnit}`);

  const inr = extractEvent("What happens to Indian IT stocks if the rupee falls 5%?");
  check("fx kind", inr.kind === "fx-move", inr.kind);
  const iRank = rankCompanies(inr);
  check("INR TCS beneficiary", iRank.some((c) => c.symbol === "TCS" && c.side === "beneficiary"));

  const nvda = extractEvent("NVIDIA announced a new AI chip. Who are the biggest winners and losers?");
  check("ai/product maps", nvda.kind === "ai-cycle" || nvda.kind === "product-announcement", nvda.kind);
  check("NVDA named", nvda.companiesNamed.includes("NVDA"));
  const nRank = rankCompanies(nvda);
  check("NVDA ranked beneficiary", nRank.some((c) => c.symbol === "NVDA" && c.side === "beneficiary"));
  check("TSMC ranked", nRank.some((c) => c.symbol === "2330"));

  const tw = extractEvent("Which stocks could be negatively affected if China invades Taiwan?");
  check("geopolitics kind", tw.kind === "geopolitics", tw.kind);
  const gRank = rankCompanies(tw);
  check("TSMC negative", gRank.some((c) => c.symbol === "2330" && c.side === "negative"));
  check("defence positive", gRank.some((c) => c.sector === "Defence" && c.side === "beneficiary"));

  const high = extractEvent("What should I watch if US interest rates stay high?");
  check("higher-for-longer", high.kind === "rates-stay-high", high.kind);

  const port = extractEvent("I have a portfolio heavily exposed to technology. What risks should I be aware of?");
  check("portfolio-risk kind", port.kind === "portfolio-risk", port.kind);

  check("company fact question is not stolen", !looksLikeImpactQuestion("Why is NVDA moving today?"));
  check("valuation question is not stolen", !looksLikeImpactQuestion("Is AAPL's valuation expensive?"));

  return out;
}
