import { useEffect, useState } from "react";
import { useAuth } from "../lib/auth";
import GftLogo from "../components/GftLogo";
import "../styles/landing.css";
import { isConfigured } from "../lib/firebase";
import { useSeo } from "../lib/seo";

type Mode = "signin" | "signup" | "reset";

/**
 * Auth gate screen.
 *
 * This is the first thing a visitor sees, so it does double duty: authenticate,
 * and make the case for the product. The left panel sells, the right panel
 * signs in — the standard split that keeps the form short without the page
 * feeling like a dead end.
 */
export default function Login({ initialMode = "signin", onBack }: { initialMode?: "signin" | "signup"; onBack?: () => void } = {}) {
  const { signInGoogle, signInEmail, signUpEmail, resetPassword, error, clearError } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useSeo({
    title: "Sign in",
    description: "Sign in to your GFT Terminal account.",
    noindex: true,
  });

  useEffect(() => { clearError(); setSent(false); }, [mode, clearError]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") await signInEmail(email, password);
    else if (mode === "signup") await signUpEmail("", email, password);
    else { await resetPassword(email); setSent(true); }
    setBusy(false);
  };

  const oauth = async (fn: () => Promise<void>) => { setBusy(true); await fn(); setBusy(false); };

  return (
    <div className="auth-wrap lpx-auth">
      <div className="auth-aurora" aria-hidden />

      <div className="auth-card">
        {/* ── Pitch ── */}
        <aside className="auth-pitch">
          <div className="auth-brand">
            <GftLogo size={22} animated />
            Global Financial Terminal
          </div>

          <h1 className="auth-h1">
            The world's economy, <em>live</em>.
          </h1>
          <p className="auth-sub">
            68 countries, live indices, FX, crypto and a news-to-signal engine —
            on one screen.
          </p>

          <ul className="auth-feats">
            <li><b>Live global coverage</b><span>Indices, FX and commodities across every major session</span></li>
            <li><b>News → signal engine</b><span>Headlines mapped to sectors and the stocks they move</span></li>
            <li><b>Your watchlist, everywhere</b><span>Synced to your account instead of one browser</span></li>
            <li><b>Price alerts</b><span>Get told when a level breaks, not after</span></li>
          </ul>

          <div className="auth-foot">
            Market data is informational only — not investment advice.
          </div>
        </aside>

        {/* ── Form ── */}
        <section className="auth-form">
          {onBack && <button className="auth-back" onClick={onBack}>← Back to home</button>}
          <div className="auth-tabs" role="tablist">
            <button role="tab" aria-selected={mode === "signin"}
              className={`auth-tab ${mode === "signin" ? "on" : ""}`}
              onClick={() => setMode("signin")}>Sign in</button>
            <button role="tab" aria-selected={mode === "signup"}
              className={`auth-tab ${mode === "signup" ? "on" : ""}`}
              onClick={() => setMode("signup")}>Create account</button>
          </div>

          <h2 className="auth-h2">
            {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your terminal" : "Reset your password"}
          </h2>
          <p className="auth-note">
            {mode === "signin" ? "Sign in to load your watchlist and alerts."
              : mode === "signup" ? "Free. Takes about ten seconds."
              : "We'll email you a reset link."}
          </p>

          {!isConfigured && (
            <div className="auth-banner warn">
              Firebase isn't configured on this build, so accounts are disabled.
              Add your <code>VITE_FIREBASE_*</code> keys to <code>.env</code> — see
              the README.
            </div>
          )}

          {mode !== "reset" && (
            <>
              <div className="auth-oauth">
                <button className="oauth-btn" disabled={busy || !isConfigured}
                  onClick={() => oauth(signInGoogle)}>
                  <GoogleIcon /> Continue with Google
                </button>
              </div>
              <div className="auth-or"><span>or use email</span></div>
            </>
          )}

          <form onSubmit={submit}>
            <label className="auth-field">
              <span>Email</span>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com" autoComplete="email" />
            </label>

            {mode !== "reset" && (
              <label className="auth-field">
                <span>
                  Password
                  {mode === "signin" && (
                    <button type="button" className="auth-link"
                      onClick={() => setMode("reset")}>Forgot?</button>
                  )}
                </span>
                <input type="password" required minLength={6} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 6 characters" : "••••••••"}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"} />
              </label>
            )}

            {error && <div className="auth-banner err" role="alert">{error}</div>}
            {sent && <div className="auth-banner ok" role="status">Reset link sent — check your inbox.</div>}

            <button className="auth-submit" type="submit" disabled={busy || !isConfigured}>
              {busy ? "Working…" : mode === "signin" ? "Sign in"
                : mode === "signup" ? "Create account" : "Send reset link"}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "reset" ? (
              <button className="auth-link" onClick={() => setMode("signin")}>← Back to sign in</button>
            ) : mode === "signin" ? (
              <>New here? <button className="auth-link" onClick={() => setMode("signup")}>Create an account</button></>
            ) : (
              <>Already have one? <button className="auth-link" onClick={() => setMode("signin")}>Sign in</button></>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

