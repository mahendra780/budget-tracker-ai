import { memo } from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  PiggyBank,
  UserRound,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { navigationLinks } from "./navigation";

function Sidebar({ collapsed, onToggle }) {
  const { user } = useAuth();
  const initials = (user?.full_name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <motion.aside
      animate={{
        width: collapsed ? 84 : 272,
      }}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="sticky top-0 hidden h-screen shrink-0 border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] p-3 shadow-[var(--sidebar-shadow)] backdrop-blur-xl lg:block"
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Logo */}
        <div className={`flex items-center gap-3 px-1 ${collapsed ? "justify-center" : "justify-between"}`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)] text-white shadow-lg shadow-indigo-500/20">
              <PiggyBank size={24} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[15px] font-bold tracking-tight text-[var(--text)]">
                  Budget Tracker
                </p>
                <p className="truncate text-xs text-[var(--muted-text)]">
                  Finance OS
                </p>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              type="button"
              onClick={onToggle}
              className="h-9 min-h-9 w-9 min-w-9 rounded-lg border border-[var(--card-border)] p-2 text-[var(--muted-text)] hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={17} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav
          className="sidebar-scroll mt-8 min-h-0 flex-1 space-y-1 overflow-y-auto px-1 pb-4"
          aria-label="Primary navigation"
        >
          {!collapsed && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--subtle-text)]">
              Workspace
            </p>
          )}
          {navigationLinks.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                title={collapsed ? link.label : undefined}
                className={({ isActive }) =>
                  `group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--primary-soft)] text-[var(--primary)] shadow-sm"
                      : "text-[var(--muted-text)] hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                  } ${collapsed ? "justify-center px-0" : ""}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active-indicator"
                        className="absolute left-0 h-5 w-[3px] rounded-r-full bg-[var(--primary)]"
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <Icon size={18} strokeWidth={2} />
                    {!collapsed && <span className="truncate">{link.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Account footer */}
        <div className="border-t border-(--card-border) px-1 pt-3">
          <NavLink
            to="/profile"
            title={collapsed ? "Profile" : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl p-2 transition-all duration-200 ${
                isActive
                  ? "bg-[var(--primary-soft)]"
                  : "hover:bg-(--muted-bg)"
              } ${collapsed ? "justify-center" : ""}`
            }
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--success)] text-xs font-bold text-white shadow-sm shadow-emerald-500/20">
              {initials}
            </span>

            {!collapsed && (
              <>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[var(--text)]">
                    {user?.full_name || "Your profile"}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-[var(--muted-text)]">
                    {user?.email || "Manage your account"}
                  </span>
                </span>
                <UserRound
                  size={16}
                  className="shrink-0 text-[var(--subtle-text)] transition-colors group-hover:text-[var(--primary)]"
                />
              </>
            )}
          </NavLink>

          {collapsed && (
            <button
              type="button"
              onClick={onToggle}
              className="mt-2 h-9 min-h-9 w-full min-w-0 rounded-lg border border-[var(--card-border)] p-2 text-[var(--muted-text)] hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
              aria-label="Expand sidebar"
            >
              <ChevronRight size={17} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

export default memo(Sidebar);
