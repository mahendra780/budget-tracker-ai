import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarDays, LogOut, Mail, ShieldCheck, UserRound } from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
};

function Profile() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const initials = user?.full_name
    ?.split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8"
    >
      <h1 className="sr-only">Profile</h1>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)] lg:gap-6">
        <AnimatedCard className="overflow-hidden p-0">
          <div className="h-20 bg-[linear-gradient(135deg,var(--primary-soft),var(--success-soft))]" />
          <div className="px-6 pb-6">
            <div className="-mt-10 flex h-20 w-20 items-center justify-center rounded-3xl border-4 border-[var(--card-bg)] bg-[var(--primary)] text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
              {initials}
            </div>
            <h2 className="mt-4 truncate text-xl font-bold tracking-tight text-[var(--text)]">
              {user?.full_name || "Your profile"}
            </h2>
            <p className="mt-1 truncate text-sm text-[var(--muted-text)]">
              {user?.email || "No email available"}
            </p>
            <div className="mt-5 inline-flex max-w-full items-center gap-2 rounded-full bg-[var(--muted-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-text)]">
              <CalendarDays size={14} aria-hidden="true" className="shrink-0 text-[var(--primary)]" />
              <span className="truncate">Member since {formatDate(user?.created_at)}</span>
            </div>
          </div>
        </AnimatedCard>

        <div className="space-y-5">
          <AnimatedCard className="overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] px-5 py-4 sm:px-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]">
                <UserRound size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold tracking-tight text-[var(--text)]">
                  Account information
                </h2>
                <p className="mt-0.5 text-sm text-[var(--muted-text)]">
                  Your account details
                </p>
              </div>
            </div>

            <dl className="divide-y divide-[var(--card-border)]">
              <div className="grid gap-1 px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-[var(--muted-text)]">Full name</dt>
                <dd className="truncate text-sm font-semibold text-[var(--text)]">{user?.full_name || "Not available"}</dd>
              </div>
              <div className="grid gap-1 px-5 py-4 sm:grid-cols-[150px_minmax(0,1fr)] sm:items-center sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-[var(--muted-text)]">Email address</dt>
                <dd className="flex min-w-0 items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <Mail size={16} aria-hidden="true" className="shrink-0 text-[var(--primary)]" />
                  <span className="truncate">{user?.email || "Not available"}</span>
                </dd>
              </div>
            </dl>
          </AnimatedCard>

          <AnimatedCard className="overflow-hidden p-0">
            <div className="flex items-center gap-3 border-b border-[var(--card-border)] px-5 py-4 sm:px-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
                <ShieldCheck size={18} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-bold tracking-tight text-[var(--text)]">
                  Account session
                </h2>
                <p className="mt-0.5 text-sm text-[var(--muted-text)]">
                  Manage access to this device
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="max-w-sm text-sm leading-6 text-[var(--muted-text)]">
                Sign out securely when you are finished using this device.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex shrink-0 items-center justify-center gap-2 border border-[color-mix(in_srgb,var(--danger)_32%,var(--card-border))] px-4 py-3 text-sm font-bold text-[var(--danger)] hover:-translate-y-0.5 hover:bg-[var(--danger-soft)]"
              >
                <LogOut size={17} aria-hidden="true" />
                Sign out
              </button>
            </div>
          </AnimatedCard>
        </div>
      </div>
    </motion.main>
  );
}

export default Profile;
