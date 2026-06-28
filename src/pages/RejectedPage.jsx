import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function RejectedPage() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="nx-status-page">
      <div className="nexus-ambient" aria-hidden="true">
        <div className="nexus-ambient__grid" />
        <div className="nexus-ambient__aurora nexus-ambient__aurora--3" />
      </div>

      <div className="nx-status-card">
        <div className="relative mb-2">
          <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-[72px] h-[72px] rounded-sm object-cover" style={{ border: "2px solid rgba(255,51,102,0.4)" }} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-sm flex items-center justify-center text-[10px] text-white" style={{ background: "var(--nx-rose)", border: "2px solid var(--nx-void)" }}>✕</div>
        </div>

        <div className="nx-logo__text" style={{ fontSize: "11px" }}>SIGNAL<em>NEXUS</em></div>
        <h1 style={{ fontFamily: "var(--nx-font-display)", fontSize: "22px", fontWeight: 700, color: "var(--nx-rose)" }}>Access Denied</h1>
        <p style={{ fontFamily: "var(--nx-font-mono)", fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
          Your access request was not approved. Contact the platform administrator if you believe this is an error.
        </p>

        <div style={{ fontFamily: "var(--nx-font-mono)", fontSize: "9px", color: "rgba(255,255,255,0.35)", padding: "6px 12px", border: "1px solid var(--nx-border)" }}>
          {currentUser.email}
        </div>

        <button
          onClick={logout}
          className="mt-2 px-5 py-2 cursor-pointer transition-colors hover:text-[var(--nx-rose)]"
          style={{ fontFamily: "var(--nx-font-mono)", fontSize: "10px", letterSpacing: "0.08em", border: "1px solid var(--nx-border)", background: "transparent", color: "rgba(255,255,255,0.45)" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
