import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Radio } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const FEATURES = [
  { icon: "◈", title: "Geo Nexus Map", desc: "Interactive globe with live news heatmap across 25+ markets" },
  { icon: "◎", title: "Country Signal Drill", desc: "Click any nation — headlines, local index, AI sentiment score" },
  { icon: "▣", title: "Live Market Lattice", desc: "Global indices, FX, commodities, and crypto in one view" },
  { icon: "⬡", title: "AI Signal Engine", desc: "News-to-price impact scoring with directional signals" },
  { icon: "◉", title: "Pulse Community", desc: "Trader intel feed, servers, and direct messages" },
];

export default function LoginPage() {
  const { currentUser, userStatus, isAdmin, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  if (currentUser) {
    if (isAdmin || userStatus === "approved") return <Navigate to="/" replace />;
    if (userStatus === "pending") return <Navigate to="/pending" replace />;
    if (userStatus === "rejected") return <Navigate to="/rejected" replace />;
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      if (isMobile) {
        setRedirecting(true);
        await signInWithGoogle();
      } else {
        await signInWithGoogle();
      }
    } catch (err) {
      console.error("Sign-in error:", err.code, err.message);
      if (err.code === "auth/popup-blocked") {
        setError("Popup was blocked — try disabling your popup blocker.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in window was closed. Please try again.");
      } else {
        setError("Sign-in failed. Please try again.");
      }
    } finally {
      setLoading(false);
      setRedirecting(false);
    }
  }

  return (
    <div className="nx-login-page">
      <div className="nexus-ambient" aria-hidden="true">
        <div className="nexus-ambient__grid" />
        <div className="nexus-ambient__aurora nexus-ambient__aurora--1" />
        <div className="nexus-ambient__aurora nexus-ambient__aurora--2" />
      </div>

      <div className="nx-login-ticker">
        {["S&P 500 +1.24%", "NIKKEI +0.79%", "BTC $67,234", "GOLD $2,387", "EUR/USD 1.0876", "DAX -0.78%", "SSE +1.47%"].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>

      <div className="nx-login-card nx-panel">
        <div className="p-6 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="nx-logo__glyph">
              <div className="nx-logo__hex" />
              <Radio className="nx-logo__core h-4 w-4" strokeWidth={2.5} />
            </div>
            <div>
              <div className="nx-logo__text">SIGNAL<em>NEXUS</em></div>
              <div className="nx-section-sub mt-1">Geospatial Market Intelligence</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: "Markets", val: "25+" },
              { label: "Signals", val: "1.8K" },
              { label: "Live", val: "2026" },
            ].map((s) => (
              <div key={s.label} className="text-center py-3" style={{ border: "1px solid var(--nx-border)", background: "rgba(0,0,0,0.3)" }}>
                <div style={{ fontFamily: "var(--nx-font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--nx-cyan)" }}>{s.val}</div>
                <div className="nx-section-sub mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-5" style={{ borderTop: "1px solid var(--nx-border)" }}>
          <h1 style={{ fontFamily: "var(--nx-font-display)", fontSize: "20px", fontWeight: 700, color: "#f0f4ff", marginBottom: "8px" }}>
            Access Terminal
          </h1>
          <p style={{ fontFamily: "var(--nx-font-mono)", fontSize: "11px", color: "rgba(255,255,255,0.45)", lineHeight: 1.6, marginBottom: "16px" }}>
            Institutional-grade global market intelligence. Sign in to request access — approved by admin.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading || redirecting}
            className="w-full flex items-center justify-center gap-3 py-3 cursor-pointer transition-all"
            style={{
              fontFamily: "var(--nx-font-mono)",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              border: "1px solid var(--nx-border-strong)",
              background: "rgba(0,229,255,0.06)",
              color: "var(--nx-cyan)",
            }}
            id="google-signin-btn"
          >
            {(loading || redirecting) ? (
              <span className="login-card__btn-spinner" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
            )}
            {redirecting ? "Redirecting to Google…" : loading ? "Signing in…" : "Continue with Google"}
          </button>

          {error && (
            <div className="mt-3 px-3 py-2 text-[11px]" style={{ fontFamily: "var(--nx-font-mono)", color: "var(--nx-rose)", background: "var(--nx-rose-dim)", border: "1px solid rgba(255,51,102,0.3)" }}>
              {error}
            </div>
          )}

          <p className="mt-4 text-[9px] leading-relaxed" style={{ fontFamily: "var(--nx-font-mono)", color: "rgba(255,255,255,0.3)" }}>
            Access is private and invite-only. New sign-ins require admin approval.
          </p>
        </div>

        <div className="px-6 py-3 flex items-center justify-center gap-2" style={{ borderTop: "1px solid var(--nx-border)", fontFamily: "var(--nx-font-mono)", fontSize: "8px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
          <span>Signal Nexus v0.6</span><span>·</span><span>Private Beta</span><span>·</span><span>© 2026</span>
        </div>
      </div>

      <div className="nx-login-features">
        <div className="nx-section-sub mb-3">Inside the terminal</div>
        {FEATURES.map((f) => (
          <div key={f.title} className="nx-login-feature">
            <span style={{ fontFamily: "var(--nx-font-mono)", fontSize: "16px", color: "var(--nx-gold)", width: "28px" }}>{f.icon}</span>
            <div>
              <div style={{ fontFamily: "var(--nx-font-display)", fontSize: "13px", fontWeight: 600, color: "#f0f4ff", marginBottom: "3px" }}>{f.title}</div>
              <div style={{ fontFamily: "var(--nx-font-mono)", fontSize: "10px", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
