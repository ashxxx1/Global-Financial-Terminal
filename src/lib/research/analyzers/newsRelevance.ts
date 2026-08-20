/**
 * Lightweight relevance check for company news items.
 *
 * Intentionally conservative: a simple substring/name check to stop headlines
 * that never mention the company at all from appearing as evidence. This is
 * not an NLP classifier — it catches sector roundups and portfolio pieces
 * that name other companies, not perfect topical relevance.
 */
import type { NewsItem } from "../data";

export function isRelevant(item: NewsItem, name: string, symbol: string): boolean {
  const hay = `${item.headline} ${item.summary ?? ""}`.toLowerCase();
  const needles = [
    name.toLowerCase(),
    symbol.toLowerCase(),
    ...name.toLowerCase().split(/\s+/).filter((w) => w.length > 3),
  ];
  return needles.some((n) => hay.includes(n));
}
