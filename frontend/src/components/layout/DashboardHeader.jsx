import { NavLink, useLocation } from "react-router-dom";
import {
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

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--card-border)] bg-[var(--app-bg)]/85 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMobileToggle}
            className="rounded-2xl border border-[var(--card-border)] p-2 text-[var(--text)] lg:hidden"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F97316]">
              Budget Tracker
            </p>
            <h1 className="text-xl font-bold text-[var(--text)]">
              {title}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={onThemeToggle}
          className="flex items-center gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-3 py-2 text-sm font-semibold text-[var(--text)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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

      {mobileOpen && (
        <nav className="mt-4 grid gap-2 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-3 shadow-xl lg:hidden">
          {navigationLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                onClick={onMobileToggle}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold ${
                    isActive
                      ? "bg-[#F97316] text-white"
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

export default DashboardHeader;
