/**
 * store.js — append-only intelligence knowledge base (spec Step 6).
 *
 * Nothing is overwritten. Every processed event is appended with its AI
 * analysis, predictions and (later) the actual market outcome, building
 * historical intelligence over time. Persists to a JSON file on disk.
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const EVENTS_FILE = join(DATA_DIR, "events.json");
const STATS_FILE = join(DATA_DIR, "accuracy.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function loadJSON(file, fallback) {
  try {
    if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    /* corrupt file — start fresh, don't crash the engine */
  }
  return fallback;
}

let events = loadJSON(EVENTS_FILE, []);
// Self-learning accuracy tracker (spec Step 7): running tallies per sector.
let accuracy = loadJSON(STATS_FILE, { total: 0, correct: 0, bySector: {} });

let dirty = false;
function persist() {
  if (!dirty) return;
  try {
    writeFileSync(EVENTS_FILE, JSON.stringify(events, null, 0));
    writeFileSync(STATS_FILE, JSON.stringify(accuracy, null, 2));
    dirty = false;
  } catch (e) {
    console.error("[store] persist failed:", e.message);
  }
}
// Batch writes so we don't hammer the disk on every event.
setInterval(persist, 5000).unref();

export const store = {
  /** Append a processed event. Returns false if it's a duplicate of a recent one. */
  add(event) {
    // Dedup: same canonical key within the last 6h = merge sources, don't re-add.
    const existing = events.find(
      (e) => e.canonicalKey === event.canonicalKey &&
        Date.now() - new Date(e.firstSeen).getTime() < 6 * 3600 * 1000
    );
    if (existing) {
      for (const s of event.sources || []) {
        if (!existing.sources.some((x) => x.name === s.name)) existing.sources.push(s);
      }
      dirty = true;
      return false;
    }
    events.push(event);
    dirty = true;
    return true;
  },

  recent(limit = 50) {
    return events.slice(-limit).reverse();
  },

  forCountry(code, limit = 20) {
    return events
      .filter((e) => e.country === code)
      .slice(-limit)
      .reverse();
  },

  count() {
    return events.length;
  },

  /** Record a prediction outcome for self-learning stats (spec Step 7). */
  recordOutcome(sector, wasCorrect) {
    accuracy.total += 1;
    if (wasCorrect) accuracy.correct += 1;
    const s = (accuracy.bySector[sector] ||= { total: 0, correct: 0 });
    s.total += 1;
    if (wasCorrect) s.correct += 1;
    dirty = true;
  },

  accuracyStats() {
    const pct = (c, t) => (t ? Math.round((c / t) * 100) : null);
    return {
      overall: pct(accuracy.correct, accuracy.total),
      samples: accuracy.total,
      bySector: Object.fromEntries(
        Object.entries(accuracy.bySector).map(([k, v]) => [k, pct(v.correct, v.total)])
      ),
    };
  },
};
