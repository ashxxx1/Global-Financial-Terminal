/**
 * graph.ts — knowledge graph v1: typed edges between countries, companies,
 * sectors, indices and FX, derived from the entity dataset. Every node link
 * resolves to a real route, so clicking any entity reveals its neighborhood
 * (per the spec's Knowledge Graph). News entity-linking (news.ts) plugs
 * articles into the same node space via ticker/sector tags.
 */
import { STOCKS_BY_COUNTRY } from "../data/stocksData";
import { COUNTRIES, metaFor } from "./market";

export interface GraphNode {
  type: "country" | "stock" | "sector" | "index" | "fx";
  label: string;
  to?: string;      // route, when navigable
  weight?: number;  // relative importance for display ordering
}

export function connectionsForCountry(iso: string): GraphNode[] {
  const meta = COUNTRIES[iso];
  const stocks = (STOCKS_BY_COUNTRY as Record<string, any[]>)[iso] || [];
  if (!meta && stocks.length === 0) return [];

  const sectorCount = new Map<string, number>();
  for (const s of stocks) sectorCount.set(s.sector, (sectorCount.get(s.sector) || 0) + 1);
  const sectors = [...sectorCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const out: GraphNode[] = [];
  if (meta?.marketIndex) out.push({ type: "index", label: meta.marketIndex });
  if (meta?.currency) out.push({ type: "fx", label: meta.currency });
  for (const [sector, n] of sectors) out.push({ type: "sector", label: sector, weight: n });
  for (const s of stocks.slice(0, 6)) out.push({ type: "stock", label: s.ticker, to: `/stock/${s.ticker}`, weight: s.price });
  return out;
}

export function connectionsForStock(symbol: string): GraphNode[] {
  const m = metaFor(symbol);
  if (!m) return [];
  const out: GraphNode[] = [];
  if (m.country && COUNTRIES[m.country]) {
    out.push({ type: "country", label: COUNTRIES[m.country].name, to: `/country/${m.country}` });
    const idx = COUNTRIES[m.country].marketIndex;
    if (idx) out.push({ type: "index", label: idx });
  }
  out.push({ type: "sector", label: m.sector });
  const peers = ((STOCKS_BY_COUNTRY as Record<string, any[]>)[m.country || ""] || [])
    .filter((s) => s.sector === m.sector && s.ticker !== symbol)
    .slice(0, 5);
  for (const p of peers) out.push({ type: "stock", label: p.ticker, to: `/stock/${p.ticker}` });
  return out;
}
