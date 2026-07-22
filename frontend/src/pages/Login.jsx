import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, KeyRound, LoaderCircle, Mail, PiggyBank } from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import { useAuth } from "../context/AuthContext";
import {
  notifyError,
  notifySuccess,
} from "../utils/notifications";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      await login(formData);
      notifySuccess("Logged in successfully.");
      navigate("/", { replace: true });
    } catch (error) {
      notifyError(error, "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex min-h-screen items-center justify-center px-4 py-8 text-[var(--text)] sm:px-6"
    >
      <AnimatedCard className="w-full max-w-md overflow-hidden p-0">
        <div className="border-b border-[var(--card-border)] bg-[var(--muted-bg)] px-6 py-6 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-white shadow-lg shadow-indigo-500/20">
              <PiggyBank size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                Budget Tracker
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-[var(--text)]">
                Sign in
              </h1>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6 sm:p-7">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-[var(--text)]">
              Email address
            </label>
            <div className="relative">
              <Mail size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtle-text)]" />
              <input
                id="login-email"
                required
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                className="w-full border border-[var(--card-border)] py-3 pl-10 pr-4 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <label htmlFor="login-password" className="text-sm font-semibold text-[var(--text)]">
                Password
              </label>
              <Link to="/forgot-password" className="text-xs font-bold text-[var(--primary)] transition hover:text-[var(--primary-hover)]">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <KeyRound size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtle-text)]" />
              <input
                id="login-password"
                required
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(event) => setFormData({ ...formData, password: event.target.value })}
                className="w-full border border-[var(--card-border)] py-3 pl-10 pr-12 text-sm outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-1 top-1/2 inline-flex min-h-9 min-w-9 -translate-y-1/2 items-center justify-center rounded-lg p-2 text-[var(--muted-text)] hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            aria-busy={submitting}
            className="inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-[var(--primary-hover)]"
          >
            {submitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
            {submitting ? "Signing in" : "Sign in"}
          </button>
        </form>

        <div className="border-t border-[var(--card-border)] px-6 py-4 text-center text-sm text-[var(--muted-text)] sm:px-7">
          New here?{" "}
          <Link to="/register" className="font-bold text-[var(--primary)] transition hover:text-[var(--primary-hover)]">
            Create an account
          </Link>
        </div>
      </AnimatedCard>
    </motion.main>
  );
}

export default Login;
