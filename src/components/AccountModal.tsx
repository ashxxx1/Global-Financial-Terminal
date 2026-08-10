import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth, exportUserData, deleteAccount, ReauthRequired, fetchMemberNo } from "../lib/auth";
import { track } from "../lib/analytics";
import { SUPPORT_EMAIL } from "../lib/support";

/**
 * Account & privacy controls — growth-plan item 13.
 *
 * Gives every user the two GDPR rights we're obliged to honour before we can
 * charge anyone: export a copy of their data, and permanently delete their
 * account. Deletion is deliberately a two-step, type-to-confirm action, and
 * re-asks for the password when Firebase demands a fresh login.
 */
export default function AccountModal({ onClose }: { onClose: () => void }) {
  const user = useAuth((s) => s.user);
  const [busy, setBusy] = useState<"export" | "delete" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [needPassword, setNeedPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [memberNo, setMemberNo] = useState<number | null>(null);

  useEffect(() => { void fetchMemberNo().then(setMemberNo); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!user) return null;

  const handleExport = async () => {
    setBusy("export"); setError("");
    try {
      const data = await exportUserData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `gft-my-data-${stamp}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      track("data_exported");
    } catch {
      setError("Couldn't build your export. Try again in a moment.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    setBusy("delete"); setError("");
    try {
      await deleteAccount(needPassword ? password : undefined);
      // Auth state flips to signed-out; the modal unmounts with the user.
    } catch (e) {
      if (e instanceof ReauthRequired && e.method === "password") {
        setNeedPassword(true);
        setError("For your security, re-enter your password to confirm deletion.");
      } else {
        setError((e as Error)?.message || "Deletion failed. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  };

  // Portal to <body>: a transformed route wrapper would otherwise re-anchor
  // our position:fixed backdrop and knock the modal off-centre.
  return createPortal(
    <div className="acct-backdrop" onClick={onClose}>
      <div className="acct-modal" role="dialog" aria-modal="true" aria-label="Account and privacy"
        onClick={(e) => e.stopPropagation()}>
        <div className="acct-modal-head">
          <b>Account &amp; privacy</b>
          <button className="fb-x" onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className="acct-id">
          {user.photoURL
            ? <img className="acct-avatar lg" src={user.photoURL} alt="" referrerPolicy="no-referrer" />
            : <span className="acct-avatar lg">{(user.displayName || user.email || "?").slice(0, 1).toUpperCase()}</span>}
          <div>
            <div className="acct-name">
              {user.displayName || "—"}
              {memberNo !== null && <span className="member-no" title="Your permanent member number">#{memberNo}</span>}
            </div>
            <div className="acct-email">{user.email}</div>
          </div>
        </div>

        {/* Export */}
        <section className="acct-row">
          <div>
            <div className="acct-row-title">Export my data</div>
            <p className="acct-row-sub">Download everything we hold on you as a JSON file.</p>
          </div>
          <button className="chip" disabled={busy !== null} onClick={handleExport}>
            {busy === "export" ? "Preparing…" : "Download"}
          </button>
        </section>

        {/* Delete */}
        <section className="acct-row danger">
          <div>
            <div className="acct-row-title">Delete my account</div>
            <p className="acct-row-sub">
              Permanently removes your profile, watchlist and alerts. This cannot be undone.
            </p>
          </div>
          {!confirming && (
            <button className="chip danger" disabled={busy !== null} onClick={() => setConfirming(true)}>
              Delete…
            </button>
          )}
        </section>

        {confirming && (
          <div className="acct-confirm">
            <label className="acct-row-sub" htmlFor="acct-confirm-in">
              Type <b>DELETE</b> to confirm.
            </label>
            <input
              id="acct-confirm-in"
              className="fb-email"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
            {needPassword && (
              <input
                className="fb-email"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            )}
            <div className="acct-confirm-actions">
              <button className="chip" onClick={() => { setConfirming(false); setConfirmText(""); setNeedPassword(false); setPassword(""); setError(""); }}>
                Cancel
              </button>
              <button
                className="chip danger"
                disabled={confirmText !== "DELETE" || busy !== null || (needPassword && !password)}
                onClick={handleDelete}
              >
                {busy === "delete" ? "Deleting…" : "Permanently delete"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="acct-error">{error}</p>}

        <p className="acct-foot">
          Questions about your data? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      </div>
    </div>,
    document.body
  );
}
