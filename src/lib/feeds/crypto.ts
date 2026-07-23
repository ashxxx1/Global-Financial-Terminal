/**
 * feeds/crypto.ts — LIVE crypto via Binance public WebSocket (keyless, CORS-open).
 * Streams miniTicker frames for BTC/ETH and pushes real quotes into the market
 * provider's live-override layer — SIM badges flip to LIVE automatically.
 */
import { publish } from "./bus";
import { setLiveQuote } from "../market";

const STREAMS: Record<string, string> = {
  btcusdt: "IDX:BTC/USD",
  ethusdt: "IDX:ETH/USD",
};

let started = false;
let ws: WebSocket | null = null;
let retryMs = 2000;

export function startCryptoFeed(): void {
  if (started) return;
  started = true;
  connect();
}

function connect(): void {
  try {
    ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${Object.keys(STREAMS).map((s) => s + "@miniTicker").join("/")}`);
  } catch {
    scheduleRetry();
    return;
  }

  ws.onopen = () => { retryMs = 2000; };

  ws.onmessage = (m) => {
    try {
      const frame = JSON.parse(m.data as string);
      const d = frame.data;
      const key = STREAMS[(d.s as string).toLowerCase()];
      if (!key) return;
      const price = parseFloat(d.c);
      const open = parseFloat(d.o);
      const changePct = open ? ((price - open) / open) * 100 : 0;
      setLiveQuote(key, { price, changePct, source: "live" });
      publish({
        id: `bnc-${d.s}-${d.E}`,
        kind: "quote",
        timestamp: d.E,
        received: Date.now(),
        source: "Binance WS",
        confidence: 98,
        countryTags: [],
        marketTags: [key, "crypto"],
        industryTags: [],
        summary: `${d.s} ${price.toFixed(2)} (${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}% 24h)`,
        impact: Math.abs(changePct) > 5 ? "High" : "Low",
        payload: d,
      });
    } catch { /* malformed frame — skip */ }
  };

  ws.onclose = scheduleRetry;
  ws.onerror = () => { try { ws?.close(); } catch { /* noop */ } };
}

function scheduleRetry(): void {
  setTimeout(connect, retryMs);
  retryMs = Math.min(retryMs * 2, 60000);
}
