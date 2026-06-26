import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";

import AnimatedCard from "../components/ui/AnimatedCard";
import { resetPassword } from "../services/authService";
import {
  notifyError,
  notifySuccess,
} from "../utils/notifications";

function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      await resetPassword({
        token,
        new_password: password,
      });
      notifySuccess("Password reset successfully.");
      navigate("/login", { replace: true });
    } catch (error) {
      notifyError(error, "Failed to reset password.");
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
          Reset Password
        </h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            required
            minLength={8}
            type="password"
            placeholder="New password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Resetting" : "Reset Password"}
          </button>
        </form>

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

export default ResetPassword;
