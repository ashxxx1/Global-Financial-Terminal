/**
 * index.js — Global Financial Terminal intelligence backend.
 *
 * Continuously ingests multiple trusted sources server-side (USGS, ECB, Binance
 * WS, GNews), enriches to one Envelope contract, keeps searchable history, and
 * streams everything to the frontend over Server-Sent Events — so the UI updates
 * in real time with zero page refreshes and no API keys in the browser.
 *
 * Endpoints:
 *   GET /health                 — liveness + ingest stats
 *   GET /api/stream             — SSE: every new Envelope as `event: envelope`
 *   GET /api/events?limit=      — recent event/news Envelopes (history)
 *   GET /api/quotes             — latest live quote snapshot (crypto + FX)
 *   GET /api/news/:country      — enriched, deduped, cached country news
 */
import express from "express";
import cors from "cors";
import { recent, quotesSnapshot, subscribe, stats } from "./store.js";
import { startQuakeIngest } from "./ingest/quakes.js";
import { startFxIngest } from "./ingest/fx.js";
import { startCryptoIngest } from "./ingest/crypto.js";
import { getCountryNews, newsEnabled } from "./ingest/news.js";

const app = express();
app.use(cors()); // public read-only data
app.disable("x-powered-by");

app.get("/health", (_req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()), newsEnabled: newsEnabled(), ...stats() });
});

app.get("/api/events", (req, res) => {
  const limit = Math.min(200, parseInt(req.query.limit, 10) || 50);
  // events + high-impact news together, newest first
  const items = [...recent("event", limit), ...recent("news", limit)]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
  res.json({ items });
});

app.get("/api/quotes", (_req, res) => {
  res.json({ quotes: quotesSnapshot() });
});

app.get("/api/news/:country", async (req, res) => {
  try {
    const out = await getCountryNews(req.params.country, Math.min(20, parseInt(req.query.max, 10) || 12));
    res.json(out);
  } catch {
    res.status(502).json({ articles: [], live: false, error: "upstream_failed" });
  }
});

app.get("/api/stream", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });
  res.flushHeaders?.();

  // Replay recent context so a fresh client isn't empty. Events + news are
  // replayed explicitly (they're sparse and would otherwise be crowded out of a
  // flat "recent N" window by the frequent quote stream), then latest quotes.
  const backlog = [
    ...recent("event", 25),
    ...recent("news", 15),
    ...quotesSnapshot(),
  ].sort((a, b) => a.timestamp - b.timestamp);
  for (const e of backlog) {
    res.write(`event: envelope\ndata: ${JSON.stringify(e)}\n\n`);
  }

  const unsubscribe = subscribe((e) => {
    res.write(`event: envelope\ndata: ${JSON.stringify(e)}\n\n`);
  });
  const heartbeat = setInterval(() => res.write(": ping\n\n"), 25000);

  req.on("close", () => { clearInterval(heartbeat); unsubscribe(); });
});

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
  console.log(`[gft] intelligence backend on :${PORT}  (news ${newsEnabled() ? "LIVE" : "off — set GNEWS_API_KEY"})`);
  startQuakeIngest();
  startFxIngest();
  startCryptoIngest();
});
