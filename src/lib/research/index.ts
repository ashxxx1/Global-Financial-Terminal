/**
 * Public entry point for the research copilot: question in, Answer out.
 */
import { parseQuestion, type Parsed } from "./intent";
import {
  analyzeMove, analyzePersistence, analyzeValuation, analyzeEarnings,
  analyzeRisks, analyzeFilings, analyzeScreen, analyzeMarket,
  analyzePortfolio, analyzeMacro,
} from "./analyzers";
import type { Answer } from "./types";

export interface AskContext {
  /** Carried between turns so "is this temporary?" knows what "this" is. */
  symbol?: string;
  watchlist: string[];
}

export interface AskResult { answer: Answer; parsed: Parsed }

export async function ask(question: string, ctx: AskContext): Promise<AskResult> {
  const parsed = parseQuestion(question, { symbol: ctx.symbol });
  const s = parsed.symbols;

  let answer: Answer;
  switch (parsed.intent) {
    case "move":        answer = await analyzeMove(s[0]); break;
    case "persistence": answer = await analyzePersistence(s[0]); break;
    case "valuation":   answer = await analyzeValuation(s[0], s[1]); break;
    case "earnings":    answer = await analyzeEarnings(s[0]); break;
    case "risks":       answer = await analyzeRisks(s[0]); break;
    case "filings":     answer = await analyzeFilings(s[0]); break;
    case "screen":      answer = await analyzeScreen(); break;
    case "portfolio":   answer = await analyzePortfolio(ctx.watchlist); break;
    case "macro":       answer = await analyzeMacro(); break;
    case "market":
    default:            answer = await analyzeMarket(); break;
  }

  if (parsed.unresolved) {
    answer = { ...answer, caveats: [`We could not identify a company in that question (${parsed.unresolved}), so this answers about the market instead. Naming a ticker gets a company-specific answer.`, ...answer.caveats] };
  }
  return { answer, parsed };
}

export * from "./types";
export { STARTERS } from "./intent";
