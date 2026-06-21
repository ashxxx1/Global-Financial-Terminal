import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function PendingPage() {
  const { currentUser, userStatus, logout } = useAuth();

  // Auto-redirect when status changes (real-time Firestore listener in AuthContext)
  if (!currentUser) return <Navigate to="/login" replace />;
  if (userStatus === "approved") return <Navigate to="/" replace />;
  if (userStatus === "rejected") return <Navigate to="/rejected" replace />;

  return (
    <div className="status-page">
      <div className="status-page__bg">
        <div className="login-bg__glow login-bg__glow--1" />
        <div className="login-bg__glow login-bg__glow--2" />
      </div>

      <div className="status-card">
        {/* Avatar */}
        <div className="status-card__avatar-wrap">
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName}
            className="status-card__avatar"
          />
          <div className="status-card__avatar-badge pending">⏳</div>
        </div>

        <div className="status-card__logo-text">
          GLOBAL<span>FIN</span> TERMINAL
        </div>

        <div className="status-card__icon pending">⏳</div>
        <h1 className="status-card__title">Access Pending</h1>
        <p className="status-card__name">Hi, {currentUser.displayName?.split(" ")[0]}!</p>
        <p className="status-card__desc">
          Your access request has been received. The admin will review and approve your account shortly.
          <br /><br />
          <strong>This page will automatically update</strong> the moment your access is granted — no need to refresh.
        </p>

        {/* Animated waiting indicator */}
        <div className="status-card__waiting">
          <div className="status-card__dot" />
          <div className="status-card__dot" style={{ animationDelay: "0.3s" }} />
          <div className="status-card__dot" style={{ animationDelay: "0.6s" }} />
          <span className="status-card__waiting-text">Waiting for admin approval</span>
        </div>

        <div className="status-card__email">
          Signed in as <strong>{currentUser.email}</strong>
        </div>

        <button className="status-card__signout" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
