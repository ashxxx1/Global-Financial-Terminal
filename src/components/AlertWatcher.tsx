/**
 * AlertWatcher — evaluates price alerts against the SAME provider quotes the
 * UI shows (crossing detection on each shared tick). Renders nothing.
 */
import { useEffect, useRef } from "react";
import { subscribe, quoteFor } from "../lib/market";
import { useTerminal } from "../store";

export default function AlertWatcher() {
  const prev = useRef<Record<string, number>>({});

  useEffect(() => {
    return subscribe((t) => {
      const { alerts, fireAlert } = useTerminal.getState();
      if (alerts.length === 0) return;
      for (const alert of alerts) {
        const q = quoteFor(alert.symbol, t);
        if (!q) continue;
        const last = prev.current[alert.symbol];
        prev.current[alert.symbol] = q.price;
        if (last === undefined) continue; // need a baseline before crossing detection
        const hit =
          (alert.direction === "above" && last < alert.price && q.price >= alert.price) ||
          (alert.direction === "below" && last > alert.price && q.price <= alert.price);
        if (hit) fireAlert(alert, q.price);
      }
    });
  }, []);

  return null;
}
