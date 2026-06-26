import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  PiggyBank,
  Repeat,
  ReceiptText,
  Target,
  WalletCards,
  User,
} from "lucide-react";

const links = [
  {
    to: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    to: "/transactions",
    label: "Transactions",
    icon: ReceiptText,
  },
  {
    to: "/budgets",
    label: "Budgets",
    icon: WalletCards,
  },
  {
    to: "/goals",
    label: "Goals",
    icon: Target,
  },
  {
    to: "/recurring",
    label: "Recurring",
    icon: Repeat,
  },
  {
    to: "/profile",
    label: "Profile",
    icon: User,
  },
];

function Sidebar({ collapsed, onToggle }) {
  return (
    <motion.aside
      animate={{
        width: collapsed ? 88 : 280,
      }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
      }}
      className="sticky top-0 hidden h-screen shrink-0 border-r border-[var(--card-border)] bg-[var(--sidebar-bg)] p-4 shadow-[var(--sidebar-shadow)] lg:block"
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F97316] text-white shadow-lg shadow-orange-500/25">
              <PiggyBank size={24} />
            </div>

            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-[var(--text)]">
                  Budget Tracker
                </p>
                <p className="truncate text-xs text-[var(--muted-text)]">
                  Finance OS
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onToggle}
            className="rounded-2xl border border-[var(--card-border)] p-2 text-[var(--muted-text)] transition hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight size={18} />
            ) : (
              <ChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="mt-8 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-semibold transition ${
                    isActive
                      ? "bg-[#F97316] text-white shadow-lg shadow-orange-500/20"
                      : "text-[var(--muted-text)] hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                  } ${collapsed ? "justify-center" : ""}`
                }
              >
                <Icon size={20} />
                {!collapsed && <span>{link.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Card */}
        <div className="mt-auto rounded-3xl bg-[var(--muted-bg)] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#14B8A6] text-white">
              <BarChart3 size={20} />
            </div>

            {!collapsed && (
              <div>
                <p className="text-sm font-bold text-[var(--text)]">
                  Analytics ready
                </p>
                <p className="mt-1 text-xs text-[var(--muted-text)]">
                  AI and budget signals in one view.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  );
}

export default Sidebar;