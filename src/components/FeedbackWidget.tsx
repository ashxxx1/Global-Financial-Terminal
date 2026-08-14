import { useEffect, useState } from "react";
import { submitFeedback, type FeedbackType } from "../lib/feedback";
import { useAuth } from "../lib/auth";
import { track } from "../lib/analytics";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "../lib/support";

/**
 * In-app feedback — growth-plan item 47.
 *
 * At pre-PMF the bottleneck is knowing *why* people leave, and almost nobody
 * emails. A one-click widget with a typed category is the cheapest way to get
 * qualitative signal alongside the quantitative funnel, and it doubles as the
 * support channel (item 48) until volume justifies a real helpdesk.
 */

const TYPES: { id: FeedbackType; label: string; icon: string }[] = [
  { id: "bug", label: "Something's broken", icon: "⚠" },
  { id: "confusing", label: "This is confusing", icon: "?" },
  { id: "idea", label: "I have an idea", icon: "✦" },
  { id: "praise", label: "I like something", icon: "♥" },
];

export default function FeedbackWidget() {
  const user = useAuth((s) => s.user);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      track("feedback_opened");
      setEmail(user?.email ?? "");
    }
  }, [open, user]);

  // Escape closes, like every other dismissible surface in the app.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setBusy(true);
    // Fire and forget. Firestore queues writes it cannot deliver rather than
    // rejecting, so awaiting this can hang the button indefinitely — and the
    // person who just did us a favour should never wait on our persistence.
    void submitFeedback({ type, message: message.trim(), email: email.trim(), uid: user?.uid });
    setBusy(false);
    setDone(true);
    setMessage("");
    // Leave the thank-you up briefly, then reset for next time.
    setTimeout(() => { setOpen(false); setDone(false); }, 1800);
  };

  return (
    <>
      <button
        className="fb-launcher"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Send feedback"
        title="Send feedback"
      >
        <span aria-hidden>✉</span> Feedback
      </button>

      {open && (
        <div className="fb-panel" role="dialog" aria-label="Send feedback">
          {done ? (
            <div className="fb-done">
              <span className="fb-done-mark" aria-hidden>✓</span>
              <b>Thank you — genuinely.</b>
              <span>We read every one of these.</span>
            </div>
          ) : (
            <form onSubmit={send}>
              <div className="fb-head">
                <b>What's on your mind?</b>
                <button type="button" className="fb-x" onClick={() => setOpen(false)} aria-label="Close">×</button>
              </div>

              <div className="fb-types">
                {TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`fb-type ${type === t.id ? "on" : ""}`}
                    onClick={() => setType(t.id)}
                    aria-pressed={type === t.id}
                  >
                    <span aria-hidden>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>

              <textarea
                className="fb-text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Be blunt. Vague praise helps us less than a specific complaint."
                rows={4}
                required
                autoFocus
              />

              {!user && (
                <input
                  className="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional — only so we can reply)"
                />
              )}

              <button className="btn-primary sm fb-send" type="submit" disabled={busy || !message.trim()}>
                {busy ? "Sending…" : "Send feedback"}
              </button>
              <div className="fb-alt">
                Prefer email? <a href={SUPPORT_MAILTO}>{SUPPORT_EMAIL}</a>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
