import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Anomaly } from "../../types/anomaly";
import { getAnomalyService } from "../../services/anomalies/AnomalyService";
import { CATEGORY_LABEL, formatAnomalyRank } from "../../lib/anomalies/format";
import AnomalyScoreBadge from "./AnomalyScoreBadge";
import AnomalyInvestigationDrawer from "./AnomalyInvestigationDrawer";

export default function AnomaliesWidget({ limit = 5 }: { limit?: number }) {
  const [params, setParams] = useSearchParams();
  const service = useMemo(() => getAnomalyService(), []);
  const rows = useMemo(() => service.top(limit), [service, limit]);
  const [openId, setOpenId] = useState<string | null>(() => params.get("anomaly"));

  useEffect(() => {
    setOpenId(params.get("anomaly"));
  }, [params]);

  const open = useCallback((id: string) => {
    setOpenId(id);
    const next = new URLSearchParams(params);
    next.set("anomaly", id);
    setParams(next, { replace: true });
  }, [params, setParams]);

  const close = useCallback(() => {
    setOpenId(null);
    const next = new URLSearchParams(params);
    next.delete("anomaly");
    setParams(next, { replace: true });
  }, [params, setParams]);

  const selected: Anomaly | undefined = openId
    ? service.getById(openId) ?? rows.find((r) => r.id === openId)
    : undefined;

  return (
    <>
      <section className="panel anom-widget" aria-labelledby="anom-widget-title">
        <div className="panel-head">
          <h2 className="anom-widget-title" id="anom-widget-title">🚨 GFT Anomalies</h2>
          <span className="label">{rows.length} ranked · evidence only</span>
        </div>
        {rows.length === 0 ? (
          <p className="alert-empty" style={{ padding: "12px 14px" }}>
            No anomalies above the scan threshold.
          </p>
        ) : (
          <ol className="anom-list">
            {rows.map((row, i) => (
              <li key={row.id} className="anom-row">
                <button
                  type="button"
                  className="anom-row-main"
                  onClick={() => open(row.id)}
                  aria-label={`${row.tickerOrSector}. ${row.title}. Score ${row.anomalyScore}. Open investigation.`}
                >
                  <span className="anom-rank" aria-hidden>{formatAnomalyRank(i)}</span>
                  <span className="anom-copy">
                    <span className="anom-row-top">
                      <span className="anom-sym">{row.tickerOrSector}</span>
                      <span className="anom-cat">{CATEGORY_LABEL[row.category]}</span>
                    </span>
                    <span className="anom-headline">{row.title}</span>
                  </span>
                  <AnomalyScoreBadge score={row.anomalyScore} size="sm" />
                </button>
                <button
                  type="button"
                  className="chip anom-investigate"
                  onClick={() => open(row.id)}
                  aria-label={`Investigate ${row.tickerOrSector}`}
                >
                  Investigate →
                </button>
              </li>
            ))}
          </ol>
        )}
      </section>
      {selected && (
        <AnomalyInvestigationDrawer anomaly={selected} onClose={close} />
      )}
    </>
  );
}
