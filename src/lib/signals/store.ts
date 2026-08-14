/**
 * Signal persistence layer.
 * - In-memory + localStorage for browser demo/live client cache
 * - Immutable prediction fields enforced on update
 * - Never deletes historical signals or resolution records
 */
import { assertImmutableUpdate } from "./validate";
import type { AuditEvent, ModelVersion, Signal } from "./types";
import { MODEL_CORE } from "./types";

const LS_KEY = "gft.signals.v1";
const LS_AUDIT = "gft.signals.audit.v1";

type Listener = () => void;

class SignalStore {
  private signals = new Map<string, Signal>();
  private audits: AuditEvent[] = [];
  private models: ModelVersion[] = [{ ...MODEL_CORE }];
  private listeners = new Set<Listener>();
  private hydrated = false;

  hydrate() {
    if (this.hydrated) return;
    this.hydrated = true;
    if (typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const list = JSON.parse(raw) as Signal[];
        for (const s of list) this.signals.set(s.id, s);
      }
      const aud = localStorage.getItem(LS_AUDIT);
      if (aud) this.audits = JSON.parse(aud);
    } catch {
      /* ignore corrupt cache */
    }
  }

  private persist() {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify([...this.signals.values()]));
      localStorage.setItem(LS_AUDIT, JSON.stringify(this.audits.slice(-5000)));
    } catch {
      /* quota */
    }
  }

  private emit() {
    this.persist();
    for (const fn of this.listeners) {
      try { fn(); } catch { /* keep */ }
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  clearAll() {
    this.signals.clear();
    this.audits = [];
    this.emit();
  }

  /** Insert new signals only. Existing IDs are skipped (idempotent publish). */
  publish(signals: Signal[], audits: AuditEvent[] = []) {
    let added = 0;
    for (const s of signals) {
      if (this.signals.has(s.id)) continue;
      this.signals.set(s.id, {
        ...s,
        factors: s.factors.map((f) => ({ ...f })),
        sourceSnapshot: { ...s.sourceSnapshot },
      });
      added++;
    }
    this.audits.push(...audits);
    if (added) this.emit();
    return added;
  }

  /**
   * Resolution / status updates only. Prediction fields are locked.
   * Never deletes.
   */
  updateResolution(id: string, patch: Partial<Signal>): Signal | null {
    const existing = this.signals.get(id);
    if (!existing) return null;
    const check = assertImmutableUpdate(existing, patch);
    if (!check.ok) throw new Error(`Refusing mutable prediction edit: ${check.errors.join(", ")}`);
    const allowed: Partial<Signal> = {
      status: patch.status,
      entryPriceActual: patch.entryPriceActual,
      exitPriceActual: patch.exitPriceActual,
      realizedReturn: patch.realizedReturn,
      resolvedAt: patch.resolvedAt,
      resolutionNote: patch.resolutionNote,
    };
    const next = { ...existing, ...allowed };
    this.signals.set(id, next);
    this.audits.push({
      id: `aud_${id}_${Date.now()}`,
      signalId: id,
      action: "resolved",
      at: Date.now(),
      detail: `Status → ${patch.status}`,
      prevStatus: existing.status,
      nextStatus: patch.status,
    });
    this.emit();
    return next;
  }

  replaceAll(signals: Signal[], audits: AuditEvent[] = []) {
    // Used only for demo bootstrap of a fresh deterministic dataset
    this.signals.clear();
    for (const s of signals) this.signals.set(s.id, s);
    this.audits = audits;
    this.emit();
  }

  get(id: string): Signal | undefined {
    return this.signals.get(id);
  }

  list(): Signal[] {
    return [...this.signals.values()].sort((a, b) => b.createdAt - a.createdAt);
  }

  getAudits(signalId?: string): AuditEvent[] {
    return signalId ? this.audits.filter((a) => a.signalId === signalId) : [...this.audits];
  }

  getModels(): ModelVersion[] {
    return [...this.models];
  }

  registerModel(m: ModelVersion) {
    const i = this.models.findIndex((x) => x.name === m.name && x.version === m.version);
    if (i >= 0) this.models[i] = m;
    else this.models.push(m);
  }

  size = this.list().length;
}

export const signalStore = new SignalStore();
