/**
 * Server-side GFT Signals persistence (file-backed JSON).
 * Prediction fields are never overwritten; only resolution fields update.
 * Historical records are never deleted.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.SIGNALS_DATA_DIR || path.join(__dirname, "../../.data");
const SIGNALS_FILE = path.join(DATA_DIR, "signals.json");
const AUDIT_FILE = path.join(DATA_DIR, "signal_audits.json");

const IMMUTABLE = new Set([
  "id", "assetId", "symbol", "name", "assetType", "market", "exchange",
  "direction", "signalType", "entryLow", "entryHigh", "signalPrice",
  "referencePrice", "targetPrice", "stopPrice", "expectedReturn",
  "expectedMove", "risk", "riskReward", "confidence", "timeframe",
  "modelName", "modelVersion", "reasoning", "factors", "createdAt",
  "expiresAt", "sourceSnapshot", "demo",
]);

function ensure() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(SIGNALS_FILE)) fs.writeFileSync(SIGNALS_FILE, "[]");
  if (!fs.existsSync(AUDIT_FILE)) fs.writeFileSync(AUDIT_FILE, "[]");
}

function readSignals() {
  ensure();
  try { return JSON.parse(fs.readFileSync(SIGNALS_FILE, "utf8")); }
  catch { return []; }
}

function writeSignals(list) {
  ensure();
  fs.writeFileSync(SIGNALS_FILE, JSON.stringify(list, null, 2));
}

function readAudits() {
  ensure();
  try { return JSON.parse(fs.readFileSync(AUDIT_FILE, "utf8")); }
  catch { return []; }
}

function writeAudits(list) {
  ensure();
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(list.slice(-8000), null, 2));
}

export function listSignals() {
  return readSignals().sort((a, b) => b.createdAt - a.createdAt);
}

export function getSignal(id) {
  return readSignals().find((s) => s.id === id) || null;
}

/** Idempotent publish — existing IDs are left untouched. */
export function publishSignals(signals, audits = []) {
  const list = readSignals();
  const ids = new Set(list.map((s) => s.id));
  let added = 0;
  for (const s of signals) {
    if (ids.has(s.id)) continue;
    list.push(s);
    added++;
  }
  writeSignals(list);
  if (audits.length) {
    const a = readAudits();
    a.push(...audits);
    writeAudits(a);
  }
  return added;
}

export function updateResolution(id, patch) {
  const list = readSignals();
  const i = list.findIndex((s) => s.id === id);
  if (i < 0) return null;
  const existing = list[i];
  for (const k of Object.keys(patch)) {
    if (IMMUTABLE.has(k) && JSON.stringify(patch[k]) !== JSON.stringify(existing[k])) {
      throw new Error(`immutable field: ${k}`);
    }
  }
  const next = {
    ...existing,
    status: patch.status ?? existing.status,
    entryPriceActual: patch.entryPriceActual ?? existing.entryPriceActual,
    exitPriceActual: patch.exitPriceActual ?? existing.exitPriceActual,
    realizedReturn: patch.realizedReturn ?? existing.realizedReturn,
    resolvedAt: patch.resolvedAt ?? existing.resolvedAt,
    resolutionNote: patch.resolutionNote ?? existing.resolutionNote,
  };
  list[i] = next;
  writeSignals(list);
  const audits = readAudits();
  audits.push({
    id: `aud_${id}_${Date.now()}`,
    signalId: id,
    action: "resolved",
    at: Date.now(),
    detail: `Status → ${next.status}`,
    prevStatus: existing.status,
    nextStatus: next.status,
  });
  writeAudits(audits);
  return next;
}

export function listAudits(signalId) {
  const all = readAudits();
  return signalId ? all.filter((a) => a.signalId === signalId) : all;
}
