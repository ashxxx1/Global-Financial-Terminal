/**
 * AlertWatcher — evaluates every alert kind against the same quotes the UI
 * shows. Renders nothing.
 *
 * Growth-plan item 71 widened this from price levels to four kinds. A level
 * alert only catches what you already thought to watch for; the others catch
 * the day something happens without you having guessed the number first.
 *
 * Everything except news alerts is one-shot. An alert that re-fires on every
 * tick past its threshold is not a notification, it is a stuck horn — and the
 * first thing a user does is delete it.
 */
import { useEffect, useRef } from "react";
import { subscribe, quoteFor, historyFor } from "../lib/market";
import { useTerminal, type PriceAlert } from "../store";

/** Rolling baseline per symbol, for crossing detection. */
interface Baseline { price: number; at: number }

export default function AlertWatcher() {
  const prev = useRef<Record<string, Baseline>>({});
  /** Session-local guard so a fired alert cannot repeat before the store persists. */
  const firedThisSession = useRef<Set<string>>(new Set());

  useEffect(() => {
    return subscribe((t) => {
      const { alerts, fireAlert, markAlertFired } = useTerminal.getState();
      if (alerts.length === 0) return;

      for (const alert of alerts) {
        const kind = alert.kind ?? "price";
        const repeat = alert.repeat ?? kind === "news";
        if (!repeat && (alert.firedAt || firedThisSession.current.has(alert.id))) continue;

        const q = quoteFor(alert.symbol, t);
        if (!q) continue;

        const last = prev.current[alert.symbol];
        prev.current[alert.symbol] = { price: q.price, at: t };

        let hit = false;
        switch (kind) {
          case "price": {
            // Crossing, not level: firing because the price is already past the
            // threshold when the page loads would be noise, not news.
            if (!last) break;
            hit =
              (alert.direction === "above" && last.price < alert.targetValue && q.price >= alert.targetValue) ||
              (alert.direction === "below" && last.price > alert.targetValue && q.price <= alert.targetValue);
            break;
          }
          case "percent": {
            // The day's move against a threshold, in the direction asked for.
            const moved = alert.direction === "below"
              ? q.changePct <= -Math.abs(alert.targetValue)
              : q.changePct >= Math.abs(alert.targetValue);
            hit = moved;
            break;
          }
          case "volume": {
            // Today's volume against its own recent median, as a multiple.
            const { candles } = historyFor(alert.symbol, "3M");
            if (candles.length < 20) break;
            const vols = candles.slice(-21, -1)
              .map((c) => (c as { v?: number }).v)
              .filter((v): v is number => typeof v === "number" && v > 0);
            const today = (candles[candles.length - 1] as { v?: number }).v;
            if (vols.length < 10 || typeof today !== "number" || today <= 0) break;
            const sorted = [...vols].sort((a, b) => a - b);
            const med = sorted[Math.floor(sorted.length / 2)];
            hit = med > 0 && today / med >= alert.targetValue;
            break;
          }
          case "news":
            // Fired by the news feed rather than the price tick — see below.
            break;
        }

        if (hit) {
          firedThisSession.current.add(alert.id);
          fireAlert(alert, q.price);
          if (!repeat) markAlertFired(alert.id);
        }
      }
    });
  }, []);

  return null;
}

/**
 * Called by the news feed when a headline lands for a symbol someone watches.
 * Kept separate because news arrives on its own schedule, not the price tick.
 */
export function fireNewsAlerts(symbol: string, headline: string): void {
  const { alerts, notices, fireAlert } = useTerminal.getState();
  const matching = alerts.filter((a: PriceAlert) => a.symbol === symbol && a.kind === "news");
  if (matching.length === 0) return;
  // Do not repeat the same headline if the feed re-delivers it.
  if (notices.some((n) => n.text.includes(headline.slice(0, 40)))) return;
  for (const a of matching) fireAlert(a, 0);
}
