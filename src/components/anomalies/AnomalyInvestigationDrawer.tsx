import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import type { Anomaly } from "../../types/anomaly";
import { CATEGORY_LABEL, FACTOR_STATUS_LABEL, factorStatusTone, formatAnomalyTime, resolveAnomalyLinks } from "../../lib/anomalies/format";
import AnomalyScoreBadge from "./AnomalyScoreBadge";

export default function AnomalyInvestigationDrawer({
  anomaly,
  onClose,
}: {
  anomaly: Anomaly;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const links = resolveAnomalyLinks(anomaly);

  useEffect(() => {
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const root = panelRef.current;
      if (!root) return;
      const focusable = [...root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )].filter((el) => !el.hasAttribute("disabled") && el.tabIndex !== -1);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    const html = document.documentElement;
    const prior = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      html.style.overflow = prior;
      if (prev instanceof HTMLElement) prev.focus();
    };
  }, [onClose, anomaly.id]);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  return createPortal(
    <div className="anom-backdrop" onClick={onClose}>
      <div
        ref={panelRef}
        className="anom-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="anom-drawer-handle" aria-hidden />
        <header className="anom-drawer-head">
          <div style={{ minWidth: 0 }}>
            <div className="label" style={{ marginBottom: 6 }}>
              {CATEGORY_LABEL[anomaly.category].toUpperCase()}
            </div>
            <h2 id={titleId} className="anom-drawer-title">
              {anomaly.tickerOrSector}
            </h2>
            <div className="anom-drawer-meta">
              <span>{formatAnomalyTime(anomaly.timestamp)}</span>
            </div>
          </div>
          <div className="anom-drawer-head-right">
            <AnomalyScoreBadge score={anomaly.anomalyScore} />
            <button ref={closeRef} type="button" className="fb-x" onClick={onClose} aria-label="Close investigation">
              ×
            </button>
          </div>
        </header>

        <div className="anom-drawer-body">
          <p className="anom-kicker">{anomaly.title}</p>

          <section className="anom-block">
            <div className="label">Summary</div>
            <p className="anom-prose">{anomaly.summary}</p>
          </section>

          <section className="anom-block">
            <div className="label">Interpretation</div>
            <p className="anom-prose">{anomaly.interpretation}</p>
          </section>

          <section className="anom-block">
            <div className="label">Evidence</div>
            <div className="anom-table-wrap">
              <table className="tbl anom-evidence">
                <thead>
                  <tr>
                    <th>Factor</th>
                    <th>Normal</th>
                    <th>Current</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {anomaly.factors.map((f) => (
                    <tr key={f.factor}>
                      <td style={{ fontWeight: 600 }}>{f.factor}</td>
                      <td className="mono" style={{ color: "var(--muted)", fontSize: 12 }}>{f.normalBaseline}</td>
                      <td className="mono" style={{ fontSize: 12, fontWeight: 700 }}>{f.currentObserved}</td>
                      <td>
                        <span
                          className="anom-status"
                          style={{ color: factorStatusTone(f.status) }}
                        >
                          {FACTOR_STATUS_LABEL[f.status]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="anom-block">
            <div className="label">Possible explanations</div>
            <ul className="anom-expl">
              {anomaly.possibleExplanations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p className="anom-disclaimer">
              Evidence only — not a recommendation to buy, sell, or hold. Investigate the drivers, then decide.
            </p>
          </section>

          <section className="anom-block">
            <div className="label">Quick links</div>
            <div className="anom-links">
              <button type="button" className="chip active" onClick={() => go(links.chartPath)}>
                Chart
              </button>
              <button type="button" className="chip" onClick={() => go(links.newsPath)}>
                News feed
              </button>
              <button type="button" className="chip" onClick={() => go(links.impactPath)}>
                Impact
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  );
}
