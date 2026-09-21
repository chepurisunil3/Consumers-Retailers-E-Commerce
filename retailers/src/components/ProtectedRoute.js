import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading your dashboard…</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export function RequirePermission({ action, children }) {
  const { can } = useAuth();

  if (!can(action)) {
    return (
      <div className="page">
        <div className="empty-state card">
          You don't have permission to view this page. Ask an admin for access.
        </div>
      </div>
    );
  }

  return children;
}
