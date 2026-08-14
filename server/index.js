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
import { listSignals, getSignal, listAudits } from "./signals/store.js";
import {
  generateDailySignals,
  resolveActiveSignals,
  calculateDailyPerformance,
} from "./signals/jobs.js";

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

/* ── GFT Signals (public read; mutation only via cron secret) ── */
app.get("/api/signals", (req, res) => {
  const limit = Math.min(500, parseInt(req.query.limit, 10) || 200);
  res.json({
    signals: listSignals().slice(0, limit),
    demo: process.env.SIGNALS_DEMO_MODE !== "false",
    disclaimer: "GFT Signals are model-generated market forecasts for informational purposes only and are not investment advice or a guarantee of future returns.",
  });
});

app.get("/api/signals/performance", (_req, res) => {
  res.json({ daily: calculateDailyPerformance(), signals: listSignals().length });
});

app.get("/api/signals/:id", (req, res) => {
  const s = getSignal(req.params.id);
  if (!s) return res.status(404).json({ error: "not_found" });
  res.json({ signal: s, audits: listAudits(s.id) });
});

function authorizeCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // open in local/dev
  return req.get("authorization") === `Bearer ${secret}` || req.query.secret === secret;
}

app.post("/api/signals/jobs/generate", (req, res) => {
  if (!authorizeCron(req)) return res.status(401).json({ error: "unauthorized" });
  const out = generateDailySignals();
  res.json({ ok: true, ...out });
});

app.post("/api/signals/jobs/resolve", (req, res) => {
  if (!authorizeCron(req)) return res.status(401).json({ error: "unauthorized" });
  const out = resolveActiveSignals();
  res.json({ ok: true, ...out });
});

app.post("/api/signals/jobs/daily-performance", (req, res) => {
  if (!authorizeCron(req)) return res.status(401).json({ error: "unauthorized" });
  res.json({ ok: true, daily: calculateDailyPerformance() });
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

  // Scheduled signal jobs (interval-based; also exposed as HTTP cron endpoints)
  const tick = () => {
    try {
      generateDailySignals();
      resolveActiveSignals();
    } catch (err) {
      console.warn("[gft:signals]", err?.message || err);
    }
  };
  // Resolve frequently; generate once near start and every 6h
  tick();
  setInterval(() => { try { resolveActiveSignals(); } catch { /* keep */ } }, 5 * 60 * 1000);
  setInterval(() => { try { generateDailySignals(); } catch { /* keep */ } }, 6 * 60 * 60 * 1000);
});
