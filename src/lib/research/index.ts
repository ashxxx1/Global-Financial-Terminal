/**
 * Public entry point for the research engine: question in, Answer out.
 *
 * This is the seam the rest of the terminal builds on. A stock page, an alert
 * or a digest can call `ask` and render the same evidence-backed Answer the
 * panel does — the analysis lives here, not in the panel.
 *
 * If a language layer is added later it belongs on top of this boundary,
 * phrasing an Answer that already exists. It must never become the source of a
 * number or a calculation.
 */
import { parseQuestion, type Parsed } from "./intent";
import {
  analyzeMoving, analyzePersistence, analyzeChanged,
  analyzeValuationHistory, analyzeValuationPair, analyzeMomentum,
  analyzeRisks, analyzeFilings, analyzeScreen,
  analyzeMarket, analyzePortfolio, analyzeMacro,
} from "./analyzers";
import { unavailableAnswer } from "./analyzers/shared";
import { CAPABILITIES } from "./capabilities";
import type { Answer } from "./types";
import { metaFor } from "../market";

export interface AskContext {
  /** Carried between turns so "is this temporary?" knows what "this" is. */
  symbol?: string;
  watchlist: string[];
}

export interface AskResult { answer: Answer; parsed: Parsed }

export async function ask(question: string, ctx: AskContext): Promise<AskResult> {
  const parsed = parseQuestion(question, { symbol: ctx.symbol });
  const s = parsed.symbols;
  const name = s[0] ? (metaFor(s[0])?.name || s[0]) : "This question";

  // Asked for something we cannot see: name the capability, offer the nearest
  // valid question, and stop. Do not answer a different question quietly.
  if (parsed.intent === "unavailable" && parsed.wants) {
    const cap = CAPABILITIES[parsed.wants];
    const alt = cap.alternative ? CAPABILITIES[cap.alternative.capability] : null;
    const suggestions: string[] = [];
    if (alt && s[0]) {
      if (alt.id === "earnings-surprises") suggestions.push(`Is earnings momentum improving at ${s[0]}?`);
      if (alt.id === "analyst-ratings") suggestions.push(`Why is ${s[0]} moving today?`);
      if (alt.id === "fundamental-history") suggestions.push(`What changed at ${s[0]}?`);
      if (alt.id === "price-history") suggestions.push(`Why is ${s[0]} moving today?`);
      if (alt.id === "sec-filings") suggestions.push(`Show recent filings for ${s[0]}`);
      if (alt.id === "insider-transactions") suggestions.push(`What are the key risks to ${s[0]}?`);
    }
    return { answer: unavailableAnswer(`${name} — unavailable data`, parsed.wants, suggestions), parsed };
  }

  let answer: Answer;
  switch (parsed.intent) {
    case "moving":         answer = await analyzeMoving(s[0]); break;
    case "persistence":    answer = await analyzePersistence(s[0]); break;
    case "changed":        answer = await analyzeChanged(s[0]); break;
    case "valuation":      answer = await analyzeValuationHistory(s[0]); break;
    case "valuation-pair": answer = await analyzeValuationPair(s[0], s[1]); break;
    case "momentum":       answer = await analyzeMomentum(s[0]); break;
    case "risks":          answer = await analyzeRisks(s[0]); break;
    case "filings":        answer = await analyzeFilings(s[0]); break;
    case "screen":         answer = await analyzeScreen(); break;
    case "portfolio":      answer = await analyzePortfolio(ctx.watchlist); break;
    case "macro":          answer = await analyzeMacro(); break;
    case "impact":
      answer = {
        title: "Financial Impact Copilot",
        mode: "macro",
        headline: "This is an event-transmission question. The Impact Copilot maps EVENT → MECHANISM → SECTORS → COMPANIES with catalog exposure and documented precedents.",
        claims: [{
          text: "Open the Impact Copilot at /impact for winners, losers, confidence, historical precedent and scenario controls. The research panel does not invent that map here.",
          tier: "OPINION",
          confidence: 0.55,
          why: "Impact analysis is a separate engine over the same universe; mixing it into a single-stock fact answer would hide the transmission chain.",
          sources: [],
        }],
        caveats: ["Not investment advice. Open /impact to run the full map on this wording."],
        asOf: Date.now(),
        suggestions: [question, "Oil reaches $150 — who benefits?", "Fed cuts rates — what changes?"],
      };
      break;
    case "market":
    default:               answer = await analyzeMarket(); break;
  }

  if (parsed.unresolved) {
    answer = {
      ...answer,
      caveats: [
        `We could not identify a company in that question, so this answers about the market instead. Naming a ticker or company gets a company-specific answer.`,
        ...answer.caveats,
      ],
    };
  }
  return { answer, parsed };
}

export * from "./types";
export { STARTERS } from "./intent";
export { CAPABILITIES, capabilitySummary, type Capability } from "./capabilities";
