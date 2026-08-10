import { useEffect, useRef, useState } from "react";
import { useTerminal } from "../store";

/**
 * Transient toasts for alerts that fire.
 *
 * The alerts inbox in the rail is the durable record; this is the interrupt.
 * A price level breaking is exactly the case where the user is looking at the
 * globe, not the rail, so it needs to come to them.
 */

interface Toast { id: string; text: string; time: string }

const LIFETIME = 6500;

export default function Toasts() {
  const notices = useTerminal((s) => s.notices);
  const [live, setLive] = useState<Toast[]>([]);
  const seen = useRef<Set<string>>(new Set());
  const first = useRef(true);

  useEffect(() => {
    // Don't replay the backlog as toasts on first mount — only new arrivals.
    if (first.current) {
      first.current = false;
      notices.forEach((n) => seen.current.add(n.id));
      return;
    }
    const fresh = notices.filter((n) => !seen.current.has(n.id));
    if (!fresh.length) return;
    fresh.forEach((n) => seen.current.add(n.id));
    setLive((cur) => [...fresh.map((n) => ({ id: n.id, text: n.text, time: n.time })), ...cur].slice(0, 4));
  }, [notices]);

  useEffect(() => {
    if (!live.length) return;
    const timers = live.map((t) =>
      setTimeout(() => setLive((cur) => cur.filter((x) => x.id !== t.id)), LIFETIME),
    );
    return () => timers.forEach(clearTimeout);
  }, [live]);

  if (!live.length) return null;

  return (
    <div className="toast-stack" role="region" aria-label="Alerts">
      {live.map((t) => (
        <div key={t.id} className="toast" role="status">
          <span className="toast-bell" aria-hidden>🔔</span>
          <div className="toast-body">
            <div className="toast-text">{t.text}</div>
            <div className="label">{t.time}</div>
          </div>
          <button className="toast-x" aria-label="Dismiss alert"
            onClick={() => setLive((cur) => cur.filter((x) => x.id !== t.id))}>×</button>
          <span className="toast-timer" style={{ animationDuration: `${LIFETIME}ms` }} />
        </div>
      ))}
    </div>
  );
}
