/**
 * ingest/crypto.js — LIVE crypto via Binance WebSocket (server-side, keyless).
 * Streams BTC/ETH miniTicker frames and ingests a throttled quote Envelope
 * (≤1 per symbol per 3s) so the SSE fan-out stays light. Auto-reconnects.
 */
import { WebSocket } from "ws";
import { ingest } from "../store.js";

const STREAMS = { btcusdt: "IDX:BTC/USD", ethusdt: "IDX:ETH/USD" };
const lastEmit = {};
let ws = null;
let retryMs = 2000;

function connect() {
  const url = `wss://stream.binance.com:9443/stream?streams=${Object.keys(STREAMS).map((s) => s + "@miniTicker").join("/")}`;
  ws = new WebSocket(url);

  ws.on("open", () => { retryMs = 2000; });

  ws.on("message", (buf) => {
    try {
      const d = JSON.parse(buf.toString()).data;
      const key = STREAMS[(d.s || "").toLowerCase()];
      if (!key) return;
      if (Date.now() - (lastEmit[key] || 0) < 3000) return; // throttle
      lastEmit[key] = Date.now();
      const price = parseFloat(d.c);
      const open = parseFloat(d.o);
      const changePct = open ? ((price - open) / open) * 100 : 0;
      ingest({
        id: `bnc-${d.s}-${Math.floor(d.E / 3000)}`,
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
        payload: { price, changePct },
      });
    } catch { /* malformed frame */ }
  });

  ws.on("close", scheduleReconnect);
  ws.on("error", () => { try { ws.close(); } catch { /* noop */ } });
}

function scheduleReconnect() {
  setTimeout(connect, retryMs);
  retryMs = Math.min(retryMs * 2, 60000);
}

export function startCryptoIngest() {
  connect();
  console.log("[crypto] ingest started (Binance WS)");
}
