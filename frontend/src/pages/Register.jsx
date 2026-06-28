import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PiggyBank } from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import { registerUser } from "../services/authService";
import {
  notifyError,
  notifySuccess,
} from "../utils/notifications";

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSubmitting(true);
      const response = await registerUser(formData);
      setMessage(
        response.message
          || "Account created successfully. You can now log in."
      );
      notifySuccess("Account created successfully. Please log in.");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (error) {
      notifyError(error, "Failed to create account.");
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
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F97316] text-white shadow-lg shadow-orange-500/25">
            <PiggyBank size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F97316]">
              Budget Tracker
            </p>
            <h1 className="text-xl font-bold text-[var(--text)]">
              Register
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Full name"
            value={formData.full_name}
            onChange={(event) =>
              setFormData({
                ...formData,
                full_name: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(event) =>
              setFormData({
                ...formData,
                email: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
          />
          <input
            required
            minLength={8}
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(event) =>
              setFormData({
                ...formData,
                password: event.target.value,
              })
            }
            className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Creating account" : "Create Account"}
          </button>
        </form>

        {message && (
          <div className="mt-5 rounded-2xl bg-[var(--muted-bg)] p-4 text-sm text-[var(--muted-text)]">
            {message}
          </div>
        )}

        <p className="mt-5 text-sm text-[var(--muted-text)]">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-[#F97316]">
            Sign in
          </Link>
        </p>
      </AnimatedCard>
    </motion.main>
  );
}

export default Register;
