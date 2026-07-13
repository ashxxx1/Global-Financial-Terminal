/**
 * markets.js — live stock-market indices per country (spec "Stock Market" panel).
 * FREE, no key: Yahoo Finance's public chart endpoint. Values are real (delayed).
 * Cached 60s to stay light.
 */
const INDICES = {
  US: [["S&P 500", "^GSPC"], ["Nasdaq", "^IXIC"], ["Dow Jones", "^DJI"]],
  IN: [["Nifty 50", "^NSEI"], ["Sensex", "^BSESN"]],
  JP: [["Nikkei 225", "^N225"]],
  GB: [["FTSE 100", "^FTSE"]],
  DE: [["DAX", "^GDAXI"]],
  FR: [["CAC 40", "^FCHI"]],
  CN: [["SSE Composite", "000001.SS"]],
  HK: [["Hang Seng", "^HSI"]],
  CA: [["TSX", "^GSPTSE"]],
  AU: [["ASX 200", "^AXJO"]],
  BR: [["Bovespa", "^BVSP"]],
  KR: [["KOSPI", "^KS11"]],
  TW: [["TAIEX", "^TWII"]],
  ES: [["IBEX 35", "^IBEX"]],
  IT: [["FTSE MIB", "FTSEMIB.MI"]],
  CH: [["SMI", "^SSMI"]],
  SG: [["STI", "^STI"]],
  ZA: [["JSE Top 40", "^J200.JO"]],
  MX: [["IPC", "^MXX"]],
};

const cache = new Map(); // symbol -> { ts, quote }
const TTL = 60 * 1000;

async function quote(name, symbol) {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.ts < TTL) return { name, ...hit.quote };
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const m = (await res.json())?.chart?.result?.[0]?.meta;
    if (!m || m.regularMarketPrice == null) return null;
    const prev = m.chartPreviousClose ?? m.previousClose ?? m.regularMarketPrice;
    const q = {
      symbol,
      price: Number(m.regularMarketPrice.toFixed(2)),
      changePct: prev ? Number((((m.regularMarketPrice - prev) / prev) * 100).toFixed(2)) : 0,
      currency: m.currency || "",
      marketState: m.marketState || "",
      generated: "fact",
    };
    cache.set(symbol, { ts: Date.now(), quote: q });
    return { name, ...q };
  } catch {
    return null;
  }
}

export async function fetchMarkets(code) {
  const list = INDICES[(code || "").toUpperCase()];
  if (!list) return { country: code, indices: [], supported: false };
  const indices = (await Promise.all(list.map(([n, s]) => quote(n, s)))).filter(Boolean);
  return { country: code, source: "Yahoo Finance", generated: "fact", indices, supported: true };
}
