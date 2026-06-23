import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, userStatus, userProfileData, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="globe-loading">
        <span className="globe-loading__text">AUTHENTICATING...</span>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  if (!isAdmin && userStatus === "pending") return <Navigate to="/pending" replace />;
  if (!isAdmin && userStatus === "rejected") return <Navigate to="/rejected" replace />;
  if (userStatus === "approved" && !userProfileData?.username) return <Navigate to="/setup-username" replace />;

  return children;
}
