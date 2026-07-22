import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";
import LoadingSkeleton from "../ui/LoadingSkeleton";

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-8 text-[var(--text)]">
        <div className="w-full max-w-md rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6 shadow-[var(--card-shadow)]">
          <div className="mb-5 text-base font-semibold text-[var(--text)]">Loading dashboard</div>
          <LoadingSkeleton rows={4} />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
