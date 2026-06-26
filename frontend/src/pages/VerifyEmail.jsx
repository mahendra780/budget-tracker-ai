import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";

import AnimatedCard from "../components/ui/AnimatedCard";
import { verifyEmail } from "../services/authService";

function VerifyEmail() {
  const { token } = useParams();
  const [message, setMessage] = useState("Verifying email...");

  useEffect(() => {
    verifyEmail(token)
      .then((response) => setMessage(response.message))
      .catch(() => setMessage("Email verification failed."));
  }, [token]);

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
          Email Verification
        </h1>
        <p className="mt-4 text-sm text-[var(--muted-text)]">
          {message}
        </p>
        <Link
          to="/login"
          className="mt-5 inline-block rounded-2xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20"
        >
          Go to Login
        </Link>
      </AnimatedCard>
    </motion.main>
  );
}

export default VerifyEmail;
