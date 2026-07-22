import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, LoaderCircle, Mail, PiggyBank } from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import { forgotPassword } from "../services/authService";
import {
  notifyError,
  notifySuccess,
} from "../utils/notifications";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await forgotPassword({ email });
      setMessage(response.message || "If an account with this email exists, a password reset link has been sent.");
      notifySuccess("Password reset request processed.");
    } catch (error) {
      notifyError(error, "Failed to request password reset.");
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
                Reset your password
              </h1>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-7">
          <p className="text-sm leading-6 text-[var(--muted-text)]">
            Enter the email address associated with your account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-sm font-semibold text-[var(--text)]">
                Email address
              </label>
              <div className="relative">
                <Mail size={17} aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--subtle-text)]" />
                <input
                  id="forgot-email"
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full border border-[var(--card-border)] py-3 pl-10 pr-4 text-sm outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting}
              className="inline-flex w-full items-center justify-center gap-2 bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-[var(--primary-hover)]"
            >
              {submitting && <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />}
              {submitting ? "Sending reset link" : "Send reset link"}
            </button>
          </form>

          {message && (
            <div role="status" className="mt-5 rounded-2xl border border-[var(--success)] bg-[var(--success-soft)] px-4 py-3 text-sm font-medium leading-6 text-[var(--success)]">
              {message}
            </div>
          )}

          <Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[var(--primary)] transition hover:text-[var(--primary-hover)]">
            <ArrowLeft size={16} aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </AnimatedCard>
    </motion.main>
  );
}

export default ForgotPassword;
