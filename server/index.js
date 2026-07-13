/**
 * index.js — the intelligence service.
 *
 * - Background worker: collect → process → store → broadcast, on an interval
 *   (spec Step 1 + real-time updates). Runs continuously while the process is up.
 * - SSE endpoint /stream pushes new events to the frontend live (no refresh).
 * - REST: /api/country/:code, /api/recent, /api/stats, /health.
 *
 * Dependency-free (built-in http). Run: `node server/index.js`.
 * Configure via env: PORT, GNEWS_API_KEY, POLL_MS.
 */
import http from "node:http";
import { collect } from "./sources.js";
import { processEvent } from "./engine.js";
import { store } from "./store.js";
import { fetchEconomy } from "./economy.js";

const PORT = Number(process.env.PORT || 8787);
const POLL_MS = Number(process.env.POLL_MS || 8000);

// ── SSE client registry ──────────────────────────────────────────────────────
const clients = new Set();
function broadcast(type, data) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of clients) res.write(payload);
}

// ── Background intelligence worker ───────────────────────────────────────────
let ticks = 0;
let live = false;
async function tick() {
  try {
    const { items, live: isLive } = await collect();
    live = isLive;
    for (const raw of items) {
      const event = processEvent(raw);
      const isNew = store.add(event);
      if (isNew) broadcast("event", event); // push to all connected clients
    }
    ticks++;
  } catch (e) {
    console.error("[worker] tick error:", e.message);
  }
}
setInterval(tick, POLL_MS);
tick(); // prime immediately

// ── HTTP + SSE server ────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (res, code, body) => {
  res.writeHead(code, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify(body));
};

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }

  if (url.pathname === "/health") {
    return json(res, 200, { ok: true, ticks, live, events: store.count(), clients: clients.size });
  }
  if (url.pathname === "/api/recent") {
    return json(res, 200, store.recent(Number(url.searchParams.get("limit")) || 40));
  }
  if (url.pathname === "/api/stats") {
    return json(res, 200, store.accuracyStats());
  }
  if (url.pathname.startsWith("/api/country/")) {
    const code = url.pathname.split("/").pop().toUpperCase();
    return json(res, 200, { country: code, live, events: store.forCountry(code) });
  }
  if (url.pathname.startsWith("/api/economy/")) {
    const code = url.pathname.split("/").pop().toUpperCase();
    fetchEconomy(code)
      .then((data) => json(res, 200, data))
      .catch((e) => json(res, 502, { error: e.message }));
    return;
  }
  if (url.pathname === "/stream") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...CORS,
    });
    res.write(`event: hello\ndata: ${JSON.stringify({ events: store.count(), live })}\n\n`);
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }
  json(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`[intel] service on http://localhost:${PORT}  (poll ${POLL_MS}ms, ${live ? "LIVE" : "SAMPLE"} mode)`);
});
