import {
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { lazy, memo, Suspense, useCallback, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import DashboardHeader from "./components/layout/DashboardHeader";
import Sidebar from "./components/layout/Sidebar";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Transactions = lazy(() => import("./pages/Transactions"));
const Budgets = lazy(() => import("./pages/Budgets"));
const BudgetHistory = lazy(() => import("./pages/BudgetHistory"));
const Goals = lazy(() => import("./pages/Goals"));
const RecurringTransactions = lazy(() => import("./pages/RecurringTransactions"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Login = lazy(() => import("./pages/Login"));
const Profile = lazy(() => import("./pages/Profile"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[280px] items-center justify-center px-4 py-8" role="status" aria-live="polite">
      <span className="sr-only">Loading page</span>
      <span className="loading-skeleton h-11 w-full max-w-sm rounded-2xl" aria-hidden="true" />
    </div>
  );
}

function PublicRouteContent({ children }) {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      {children}
    </Suspense>
  );
}

const AppShell = memo(function AppShell({
  mobileOpen,
  onMobileToggle,
  onSidebarToggle,
  onThemeToggle,
  sidebarCollapsed,
  theme,
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={onSidebarToggle}
      />

      <div className="min-w-0 flex-1">
        <DashboardHeader
          theme={theme}
          onThemeToggle={onThemeToggle}
          mobileOpen={mobileOpen}
          onMobileToggle={onMobileToggle}
        />

        <Suspense fallback={<RouteLoadingFallback />}>
          <Outlet />
        </Suspense>
      </div>
    </div>
  );
});

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const handleThemeToggle = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);
  const handleMobileToggle = useCallback(() => {
    setMobileOpen((current) => !current);
  }, []);
  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((current) => !current);
  }, []);

  return (
    <div
      data-theme={theme}
      className="min-h-screen bg-[var(--app-bg)] text-[var(--text)]"
    >
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />

      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<PublicRouteContent><Login /></PublicRouteContent>} />
          <Route path="/register" element={<PublicRouteContent><Register /></PublicRouteContent>} />
          <Route path="/forgot-password" element={<PublicRouteContent><ForgotPassword /></PublicRouteContent>} />
          <Route path="/reset-password/:token" element={<PublicRouteContent><ResetPassword /></PublicRouteContent>} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route
            element={(
              <AppShell
                theme={theme}
                mobileOpen={mobileOpen}
                sidebarCollapsed={sidebarCollapsed}
                onThemeToggle={handleThemeToggle}
                onMobileToggle={handleMobileToggle}
                onSidebarToggle={handleSidebarToggle}
              />
            )}
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/budgets/history" element={<BudgetHistory />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/recurring" element={<RecurringTransactions />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;
