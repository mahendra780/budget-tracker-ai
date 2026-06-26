import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, User } from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import PageHeader from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";

const formatDate = (value) => {
  if (!value) return "Not available";

  return new Date(value).toLocaleDateString();
};

function Profile() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
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
      className="px-4 py-6 sm:px-6 lg:px-8"
    >
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="View your account details and sign out."
      />

      <AnimatedCard className="max-w-2xl p-5">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-2xl bg-[#FFF4EC] p-3 text-[#F97316]">
            <User size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              {user?.full_name}
            </h2>
            <p className="text-sm text-[var(--muted-text)]">
              {user?.is_verified ? "Verified account" : "Email not verified"}
            </p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="rounded-2xl bg-[var(--muted-bg)] p-4">
            <p className="font-bold text-[var(--text)]">Full Name</p>
            <p className="mt-1 text-[var(--muted-text)]">
              {user?.full_name}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--muted-bg)] p-4">
            <p className="font-bold text-[var(--text)]">Email</p>
            <p className="mt-1 text-[var(--muted-text)]">
              {user?.email}
            </p>
          </div>
          <div className="rounded-2xl bg-[var(--muted-bg)] p-4">
            <p className="font-bold text-[var(--text)]">Account Created</p>
            <p className="mt-1 text-[var(--muted-text)]">
              {formatDate(user?.created_at)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
        >
          <LogOut size={18} />
          Logout
        </button>
      </AnimatedCard>
    </motion.main>
  );
}

export default Profile;
