import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";


export default function RejectedPage() {
  const { currentUser, logout } = useAuth();

  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div className="status-page">
      <div className="status-page__bg">
        <div className="login-bg__glow login-bg__glow--1" style={{ background: "rgba(255,34,68,0.15)" }} />
      </div>

      <div className="status-card">
        <div className="status-card__avatar-wrap">
          <img
            src={currentUser.photoURL}
            alt={currentUser.displayName}
            className="status-card__avatar"
          />
          <div className="status-card__avatar-badge rejected">✕</div>
        </div>

        <div className="status-card__logo-text">
          GLOBAL<span>FIN</span> TERMINAL
        </div>

        <div className="status-card__icon rejected">🚫</div>
        <h1 className="status-card__title" style={{ color: "var(--accent-red)" }}>
          Access Denied
        </h1>
        <p className="status-card__desc">
          Your access request was not approved at this time.
          <br /><br />
          If you believe this is a mistake, please contact the platform administrator.
        </p>

        <div className="status-card__email">
          <strong>{currentUser.email}</strong>
        </div>

        <button className="status-card__signout" onClick={logout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
