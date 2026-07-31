import { useEffect, useState } from "react";
import { readConsent, setConsent } from "../lib/consent";

/**
 * Consent banner — growth-plan item 11.
 *
 * Deliberately not a dark pattern: decline is a real button with the same
 * weight as accept, nothing is pre-checked, and the copy says plainly what is
 * collected and why. A consent banner that tricks people is both illegal and
 * poisons the very analytics it is trying to enable.
 */
export default function ConsentBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only ask the undecided. A prior answer is respected until they change it.
    if (readConsent() === null) {
      const t = setTimeout(() => setShow(true), 900);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  const choose = (v: "granted" | "denied") => {
    setConsent(v);
    setShow(false);
  };

  return (
    <div className="consent" role="dialog" aria-label="Cookie preferences">
      <div className="consent-body">
        <b>We'd like to measure how the terminal is used.</b>
        <p>
          Anonymous product analytics only — which pages get opened, what breaks.
          No ads, no selling data, no third-party trackers. Signing in and your
          watchlist work either way.
        </p>
      </div>
      <div className="consent-actions">
        <button className="consent-btn ghost" onClick={() => choose("denied")}>
          Decline
        </button>
        <button className="consent-btn accept" onClick={() => choose("granted")}>
          Allow analytics
        </button>
      </div>
    </div>
  );
}
