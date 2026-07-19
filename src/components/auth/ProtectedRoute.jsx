import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, userStatus, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="globe-loading">
        <span className="globe-loading__text">LOADING TERMINAL...</span>
      </div>
    );
  }

  // Admin area still requires a signed-in admin.
  if (adminOnly && !currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  // Open access: anonymous visitors see the terminal directly. Signed-in
  // users flagged suspended/rejected are still locked out.
  if (currentUser && (userStatus === "suspended" || userStatus === "rejected")) {
    return <Navigate to="/rejected" replace />;
  }

  return children;
}
