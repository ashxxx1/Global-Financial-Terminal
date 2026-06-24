import { useState, useEffect } from "react";
import { Navigate, Link } from "react-router-dom";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../contexts/AuthContext";

const ADMIN_EMAILS = ["aarushkapoor23@gmail.com", "anchitaduggal7@gmail.com", "anchitaduggal@7gmail.com"];
const DEPLOY_HOOK = import.meta.env.VITE_VERCEL_DEPLOY_HOOK || "";

// ── User row in the admin table ──────────────────────────────
function UserRow({ user, onApprove, onReject, onRevoke }) {
  const [busy, setBusy] = useState(false);

  async function handle(action) {
    setBusy(true);
    try { await action(); } finally { setBusy(false); }
  }

  const statusColor = {
    pending: "var(--accent-amber)",
    approved: "var(--accent-green)",
    rejected: "var(--accent-red)",
  }[user.status] || "var(--text-muted)";

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="admin-user-row">
      <img
        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=111118&color=00ff88`}
        alt={user.displayName}
        className="admin-user-row__avatar"
      />
      <div className="admin-user-row__info">
        <div className="admin-user-row__name">{user.displayName || "Unknown"}</div>
        <div className="admin-user-row__email">{user.email}</div>
        <div className="admin-user-row__date">Requested: {formatDate(user.requestedAt)}</div>
      </div>
      <div className="admin-user-row__status" style={{ color: statusColor }}>
        ● {user.status?.toUpperCase()}
      </div>
      <div className="admin-user-row__actions">
        {user.status === "pending" && (
          <>
            <button
              className="admin-btn admin-btn--approve"
              onClick={() => handle(onApprove)}
              disabled={busy}
            >
              {busy ? "…" : "✓ Approve"}
            </button>
            <button
              className="admin-btn admin-btn--reject"
              onClick={() => handle(onReject)}
              disabled={busy}
            >
              {busy ? "…" : "✕ Reject"}
            </button>
          </>
        )}
        {user.status === "approved" && (
          <button
            className="admin-btn admin-btn--reject"
            onClick={() => handle(onRevoke)}
            disabled={busy}
          >
            {busy ? "…" : "⊘ Revoke"}
          </button>
        )}
        {user.status === "rejected" && (
          <button
            className="admin-btn admin-btn--approve"
            onClick={() => handle(onApprove)}
            disabled={busy}
          >
            {busy ? "…" : "↺ Re-approve"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Deploy panel ─────────────────────────────────────────────
function DeployPanel() {
  const [deploying, setDeploying] = useState(false);
  const [lastDeploy, setLastDeploy] = useState(null);
  const [deployStatus, setDeployStatus] = useState(null);

  async function triggerDeploy() {
    if (!DEPLOY_HOOK) {
      setDeployStatus("error");
      return;
    }
    setDeploying(true);
    setDeployStatus(null);
    try {
      await fetch(DEPLOY_HOOK, { method: "POST" });
      setLastDeploy(new Date().toLocaleTimeString());
      setDeployStatus("success");
    } catch {
      setDeployStatus("error");
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="admin-deploy-panel">
      <div className="admin-section-title">🚀 Deployment</div>
      <div className="admin-deploy-desc">
        Trigger a fresh Vercel deployment pulling latest code from{" "}
        <a
          href="https://github.com/ashxxx1/Global-Financial-Terminal"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent-blue)" }}
        >
          GitHub/Global-Financial-Terminal
        </a>
      </div>

      <div className="admin-deploy-row">
        <button
          className={`admin-deploy-btn ${deploying ? "loading" : ""}`}
          onClick={triggerDeploy}
          disabled={deploying || !DEPLOY_HOOK}
          id="trigger-deploy-btn"
        >
          {deploying ? (
            <>
              <span className="admin-deploy-spinner" /> Deploying…
            </>
          ) : (
            "⚡ Trigger Deploy"
          )}
        </button>

        {deployStatus === "success" && (
          <div className="admin-deploy-status success">
            ✓ Deploy triggered at {lastDeploy} — live in ~60s
          </div>
        )}
        {deployStatus === "error" && (
          <div className="admin-deploy-status error">
            ✕ {DEPLOY_HOOK ? "Deploy failed. Check your Vercel hook URL." : "No deploy hook configured. Add VITE_VERCEL_DEPLOY_HOOK to environment."}
          </div>
        )}
      </div>

      <div className="admin-deploy-links">
        <a
          href="https://github.com/ashxxx1/Global-Financial-Terminal"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-link-btn"
        >
          📂 GitHub Repo
        </a>
        <a
          href="https://vercel.com/dashboard"
          target="_blank"
          rel="noopener noreferrer"
          className="admin-link-btn"
        >
          🔺 Vercel Dashboard
        </a>
      </div>
    </div>
  );
}

// ── Main Admin Panel ──────────────────────────────────────────
export default function AdminPanel() {
  const { currentUser, isAdmin, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("pending");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    const q = query(collection(db, "users"), orderBy("requestedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, [isAdmin]);

  if (!isAdmin) return <Navigate to="/" replace />;

  async function approveUser(uid) {
    await updateDoc(doc(db, "users", uid), {
      status: "approved",
      approvedAt: serverTimestamp(),
      approvedBy: currentUser?.email || "Admin",
    });
  }

  async function rejectUser(uid) {
    await updateDoc(doc(db, "users", uid), {
      status: "rejected",
      rejectedAt: serverTimestamp(),
    });
  }

  const pendingUsers = users.filter((u) => u.status === "pending");
  const approvedUsers = users.filter((u) => u.status === "approved" && !ADMIN_EMAILS.includes(u.email));
  const rejectedUsers = users.filter((u) => u.status === "rejected");

  const tabUsers = { pending: pendingUsers, approved: approvedUsers, rejected: rejectedUsers }[tab] || [];

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-sidebar__logo">
          <span style={{ fontSize: 20 }}>🌐</span>
          <div>
            <div className="admin-sidebar__logo-text">GLOBALFIN</div>
            <div className="admin-sidebar__logo-sub">ADMIN PANEL</div>
          </div>
        </div>

        {/* Admin avatar */}
        <div className="admin-sidebar__profile">
          <img
            src={currentUser.photoURL}
            alt="admin"
            className="admin-sidebar__avatar"
          />
          <div>
            <div className="admin-sidebar__profile-name">{currentUser.displayName}</div>
            <div className="admin-sidebar__profile-role">ADMINISTRATOR</div>
          </div>
        </div>

        <nav className="admin-nav">
          {[
            { key: "pending", label: "Pending", icon: "⏳", count: pendingUsers.length },
            { key: "approved", label: "Approved", icon: "✓", count: approvedUsers.length },
            { key: "rejected", label: "Rejected", icon: "✕", count: rejectedUsers.length },
            { key: "deploy", label: "Deploy", icon: "🚀", count: null },
          ].map((item) => (
            <button
              key={item.key}
              className={`admin-nav__item ${tab === item.key ? "active" : ""}`}
              onClick={() => setTab(item.key)}
            >
              <span className="admin-nav__icon">{item.icon}</span>
              <span className="admin-nav__label">{item.label}</span>
              {item.count !== null && (
                <span className={`admin-nav__badge ${item.key === "pending" && item.count > 0 ? "pulse" : ""}`}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__bottom">
          <Link to="/" className="admin-link-btn" style={{ display: "block", textAlign: "center", marginBottom: 8 }}>
            ← Back to Terminal
          </Link>
          <button className="admin-link-btn" onClick={logout} style={{ width: "100%", cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="admin-main">
        {/* Stats bar */}
        <div className="admin-stats-bar">
          {[
            { label: "Total Users", val: users.filter(u => !ADMIN_EMAILS.includes(u.email)).length, color: "var(--accent-blue)" },
            { label: "Pending", val: pendingUsers.length, color: "var(--accent-amber)" },
            { label: "Approved", val: approvedUsers.length, color: "var(--accent-green)" },
            { label: "Rejected", val: rejectedUsers.length, color: "var(--accent-red)" },
          ].map((s) => (
            <div key={s.label} className="admin-stat-card">
              <div className="admin-stat-card__val" style={{ color: s.color }}>{s.val}</div>
              <div className="admin-stat-card__label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Content area */}
        {tab === "deploy" ? (
          <DeployPanel />
        ) : (
          <div className="admin-content">
            <div className="admin-section-title">
              {tab === "pending" && `⏳ Pending Approval (${pendingUsers.length})`}
              {tab === "approved" && `✓ Approved Users (${approvedUsers.length})`}
              {tab === "rejected" && `✕ Rejected Users (${rejectedUsers.length})`}
            </div>

            {loading && (
              <div className="admin-empty">
                <div className="globe-loading__text" style={{ fontSize: 12 }}>LOADING...</div>
              </div>
            )}

            {!loading && tabUsers.length === 0 && (
              <div className="admin-empty">
                <div className="admin-empty__icon">
                  {tab === "pending" ? "✓" : tab === "approved" ? "👥" : "🚫"}
                </div>
                <div className="admin-empty__text">
                  {tab === "pending" && "No pending requests — you're all caught up!"}
                  {tab === "approved" && "No approved users yet."}
                  {tab === "rejected" && "No rejected users."}
                </div>
              </div>
            )}

            {!loading && tabUsers.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                onApprove={() => approveUser(user.id)}
                onReject={() => rejectUser(user.id)}
                onRevoke={() => rejectUser(user.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
