import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import AnimatedCard from "../components/ui/AnimatedCard";
import { forgotPassword } from "../services/authService";
import {
  notifyError,
  notifySuccess,
} from "../utils/notifications";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await forgotPassword({ email });
      setResetToken(response.reset_token || "");
      notifySuccess("Password reset request processed.");
    } catch (error) {
      notifyError(error, "Failed to request password reset.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.main
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4 py-8 text-[var(--text)]"
    >
      <AnimatedCard className="w-full max-w-md p-6">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F97316]">
          Budget Tracker
        </p>
        <h1 className="mt-2 text-xl font-bold text-[var(--text)]">
          Forgot Password
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            required
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Requesting" : "Request Reset"}
          </button>
        </form>

        {resetToken && (
          <div className="mt-5 rounded-2xl bg-[var(--muted-bg)] p-4 text-sm text-[var(--muted-text)]">
            <p className="font-bold text-[var(--text)]">
              Local reset link
            </p>
            <button
              type="button"
              onClick={() => navigate(`/reset-password/${resetToken}`)}
              className="mt-3 rounded-xl bg-[#14B8A6] px-4 py-2 text-xs font-bold text-white"
            >
              Reset Password
            </button>
          </div>
        )}

        <Link
          to="/login"
          className="mt-5 inline-block text-sm font-bold text-[#F97316]"
        >
          Back to login
        </Link>
      </AnimatedCard>
    </motion.main>
  );
}

export default ForgotPassword;
