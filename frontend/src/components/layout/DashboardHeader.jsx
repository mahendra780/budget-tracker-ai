import { memo } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  History,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";

import { navigationLinks, routeTitles } from "./navigation";

function DashboardHeader({
  theme,
  onThemeToggle,
  mobileOpen,
  onMobileToggle,
}) {
  const location = useLocation();
  const title = routeTitles[location.pathname] || "Dashboard";
  const showBudgetHistory = location.pathname === "/budgets";

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--card-border)] bg-[var(--app-bg)]/88 px-4 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileToggle}
            className="rounded-xl border border-[var(--card-border)] p-2 text-[var(--text)] hover:bg-[var(--muted-bg)] lg:hidden"
            aria-label="Toggle navigation"
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
              Budget Tracker
            </p>
            <h1 className="truncate text-lg font-bold tracking-tight text-[var(--text)]">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {showBudgetHistory && (
            <Link
              to="/budgets/history"
              aria-label="Budget history"
              className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text)] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            >
              <History size={18} />
              <span className="hidden sm:inline">History</span>
            </Link>
          )}

          <button
            type="button"
            onClick={onThemeToggle}
            className="flex items-center gap-2 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text)] shadow-sm hover:-translate-y-0.5 hover:shadow-md"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            aria-pressed={theme === "dark"}
          >
            {theme === "dark" ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
            <span className="hidden sm:inline">
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-navigation"
          className="mb-3 grid gap-1.5 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-2 shadow-xl lg:hidden"
          aria-label="Mobile navigation"
        >
          {navigationLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={onMobileToggle}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--muted-text)] hover:bg-[var(--muted-bg)]"
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      )}
    </header>
  );
}

export default memo(DashboardHeader);
