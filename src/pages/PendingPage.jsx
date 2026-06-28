import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function PendingPage() {
  const { currentUser, userStatus, logout } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;
  if (userStatus === "approved") return <Navigate to="/" replace />;
  if (userStatus === "rejected") return <Navigate to="/rejected" replace />;

  return (
    <div className="nx-status-page">
      <div className="nexus-ambient" aria-hidden="true">
        <div className="nexus-ambient__grid" />
        <div className="nexus-ambient__aurora nexus-ambient__aurora--1" />
      </div>

      <div className="nx-status-card">
        <div className="relative mb-2">
          <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-[72px] h-[72px] rounded-sm object-cover" style={{ border: "2px solid var(--nx-border-strong)" }} />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-sm flex items-center justify-center text-[10px]" style={{ background: "var(--nx-gold)", border: "2px solid var(--nx-void)" }}>⏳</div>
        </div>

        <div className="nx-logo__text" style={{ fontSize: "11px" }}>GLOBAL<em>FINANCIAL</em> TERMINAL</div>
        <h1 style={{ fontFamily: "var(--nx-font-display)", fontSize: "22px", fontWeight: 700, color: "#f0f4ff" }}>Access Pending</h1>
        <p style={{ fontFamily: "var(--nx-font-mono)", fontSize: "12px", color: "rgba(255,255,255,0.45)", lineHeight: 1.7 }}>
          Hi, {currentUser.displayName?.split(" ")[0]}! Your request is queued for admin review.
          This page updates automatically when access is granted.
        </p>

        <div className="flex items-center gap-2 px-4 py-2" style={{ border: "1px solid var(--nx-border)", background: "rgba(0,255,136,0.06)" }}>
          <span className="nx-ticker__live-dot" />
          <span style={{ fontFamily: "var(--nx-font-mono)", fontSize: "9px", color: "var(--nx-mint)", letterSpacing: "0.1em" }}>AWAITING APPROVAL</span>
        </div>

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
