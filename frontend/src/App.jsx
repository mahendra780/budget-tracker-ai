import {
  Routes,
  Route
} from "react-router-dom";
import { useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import DashboardHeader from "./components/layout/DashboardHeader";
import Sidebar from "./components/layout/Sidebar";

import Dashboard from "./pages/Dashboard";
import Transactions from "./pages/Transactions";
import Budgets from "./pages/Budgets";
import Goals from "./pages/Goals";

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

      <div className="flex min-h-screen">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() =>
            setSidebarCollapsed((current) => !current)
          }
        />

        <div className="min-w-0 flex-1">
          <DashboardHeader
            theme={theme}
            onThemeToggle={() =>
              setTheme((current) =>
                current === "dark" ? "light" : "dark"
              )
            }
            mobileOpen={mobileOpen}
            onMobileToggle={() =>
              setMobileOpen((current) => !current)
            }
          />

          <Routes>

            <Route
              path="/"
              element={<Dashboard />}
            />

            <Route
              path="/transactions"
              element={<Transactions />}
            />

            <Route
              path="/budgets"
              element={<Budgets />}
            />

            <Route
              path="/goals"
              element={<Goals />}
            />

          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
