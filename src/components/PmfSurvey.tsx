import { useEffect, useState } from "react";
import { submitPmf, type PmfAnswer } from "../lib/feedback";
import { useAuth } from "../lib/auth";
import { useTerminal } from "../store";
import { track } from "../lib/analytics";

/**
 * Sean Ellis PMF survey — growth-plan item 49.
 *
 * "How would you feel if you could no longer use this?" The benchmark is
 * **>40% answering "very disappointed"**; below that, keep iterating rather
 * than pouring money into acquisition.
 *
 * Timing is the whole game. Asking a first-time visitor is noise — they have
 * no basis to answer. This only appears once the user has actually formed an
 * opinion: activated, and on a later visit. Asked once, ever.
 */

const ANSWERS: { id: PmfAnswer; label: string }[] = [
  { id: "very", label: "Very disappointed" },
  { id: "somewhat", label: "Somewhat disappointed" },
  { id: "not", label: "Not disappointed" },
];

/** Sessions before we're entitled to ask. */
const MIN_VISITS = 3;
const STORAGE_KEY = "gft-pmf";

interface PmfState { asked: boolean; visits: number }

function readState(): PmfState {
  try {
    return { asked: false, visits: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { asked: false, visits: 0 };
  }
}

function writeState(s: PmfState): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

export default function PmfSurvey() {
  const user = useAuth((s) => s.user);
  const activated = useTerminal((s) => s.activated);
  const [show, setShow] = useState(false);
  const [answer, setAnswer] = useState<PmfAnswer | null>(null);
  const [reason, setReason] = useState("");
  const [sent, setSent] = useState(false);

  // Count this visit once on mount, then decide whether we've earned the ask.
  useEffect(() => {
    const s = readState();
    if (s.asked) return;
    const next = { ...s, visits: s.visits + 1 };
    writeState(next);
    if (next.visits >= MIN_VISITS && activated) {
      // Let the user get oriented before interrupting them.
      const t = setTimeout(() => { setShow(true); track("pmf_shown"); }, 20000);
      return () => clearTimeout(t);
    }
  }, [activated]);

  const dismiss = () => {
    writeState({ ...readState(), asked: true });
    track("pmf_dismissed");
    setShow(false);
  };

  // Same reasoning as the feedback widget: never block the UI on a write.
  const choose = (a: PmfAnswer) => {
    setAnswer(a);
    void submitPmf({ answer: a, uid: user?.uid });
  };

  const sendReason = () => {
    if (answer && reason.trim()) {
      void submitPmf({ answer, reason: reason.trim(), uid: user?.uid });
    }
    writeState({ ...readState(), asked: true });
    setSent(true);
    setTimeout(() => setShow(false), 1600);
  };

  if (!show) return null;

  return (
    <div className="pmf" role="dialog" aria-label="Quick question">
      <button className="fb-x pmf-x" onClick={dismiss} aria-label="Dismiss">×</button>

      {sent ? (
        <div className="fb-done"><span className="fb-done-mark" aria-hidden>✓</span><b>Thank you.</b></div>
      ) : !answer ? (
        <>
          <div className="label" style={{ color: "var(--cyan)" }}>ONE QUESTION</div>
          <b className="pmf-q">How would you feel if you could no longer use GFT Terminal?</b>
          <div className="pmf-answers">
            {ANSWERS.map((a) => (
              <button key={a.id} className="pmf-answer" onClick={() => choose(a.id)}>{a.label}</button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="label" style={{ color: "var(--cyan)" }}>THANK YOU — ONE MORE?</div>
          <b className="pmf-q">
            {answer === "very"
              ? "What would you miss most?"
              : "What would make it genuinely useful to you?"}
          </b>
          <textarea
            className="fb-text"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="A sentence is plenty."
            autoFocus
          />
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn-primary sm" onClick={sendReason}>Send</button>
            <button className="auth-link" onClick={dismiss}>Skip</button>
          </div>
        </>
      )}
    </div>
  );
}
