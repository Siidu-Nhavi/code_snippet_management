import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { token, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="screen-center">Checking session...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
