import {
  Routes,
  Route,
  Outlet
} from "react-router-dom";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import DashboardHeader from "./components/layout/DashboardHeader";
import Sidebar from "./components/layout/Sidebar";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import BudgetHistory from "./pages/BudgetHistory";
import Goals from "./pages/Goals";
import RecurringTransactions from "./pages/RecurringTransactions";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import ResetPassword from "./pages/ResetPassword";

function AppShell({
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

        <Outlet />
      </div>
    </div>
  );
}

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] =
    useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState("light");

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
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route
            element={(
              <AppShell
                theme={theme}
                mobileOpen={mobileOpen}
                sidebarCollapsed={sidebarCollapsed}
                onThemeToggle={() =>
                  setTheme((current) =>
                    current === "dark" ? "light" : "dark"
                  )
                }
                onMobileToggle={() =>
                  setMobileOpen((current) => !current)
                }
                onSidebarToggle={() =>
                  setSidebarCollapsed((current) => !current)
                }
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
