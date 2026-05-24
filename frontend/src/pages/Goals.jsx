import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Edit3,
  Plus,
  Target,
  Trash2,
} from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  getGoals,
  getGoalProgress,
} from "../services/goalService";
import { formatCurrency } from "../utils/formatters";
import {
  notifyError,
  notifySuccess,
  notifyWarning,
} from "../utils/notifications";

const initialFormData = {
  goal_name: "",
  target_amount: "",
  current_amount: "",
  target_date: "",
};

function Goals() {
  const [goals, setGoals] = useState([]);
  const [goalDetails, setGoalDetails] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] =
    useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const loadGoals = async () => {
    try {
      const progressData = await getGoalProgress();
      const goalsData = await getGoals();

      setGoals(progressData);
      setGoalDetails(goalsData);
    } catch (error) {
      notifyError(error, "Failed to load goals.");
    }
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getGoalProgress(),
      getGoals(),
    ])
      .then(([
        progressData,
        goalsData,
      ]) => {
        if (isMounted) {
          setGoals(progressData);
          setGoalDetails(goalsData);
        }
      })
      .catch((error) => {
        if (isMounted) {
          notifyError(error, "Failed to load goals.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    return goals.reduce(
      (currentTotals, goal) => ({
        saved:
          currentTotals.saved +
          Number(goal.current_amount || 0),
        target:
          currentTotals.target +
          Number(goal.target_amount || 0),
      }),
      {
        saved: 0,
        target: 0,
      }
    );
  }, [goals]);

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      goal_name: formData.goal_name,
      target_amount: Number(formData.target_amount),
      current_amount: Number(formData.current_amount),
      target_date: formData.target_date,
    };

    try {
      if (editingId) {
        await updateGoal(editingId, payload);
        notifySuccess("Goal updated successfully.");
      } else {
        await createGoal(payload);
        notifySuccess("Goal created successfully.");
      }

      resetForm();
      loadGoals();
    } catch (error) {
      notifyError(error, "Failed to save goal.");
    }
  };

  const handleEdit = (goalId) => {
    const goal = goalDetails.find((item) => item.id === goalId);

    if (!goal) return;

    setFormData({
      goal_name: goal.goal_name,
      target_amount: goal.target_amount,
      current_amount: goal.current_amount,
      target_date: goal.target_date,
    });

    setEditingId(goal.id);
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteGoal(pendingDeleteId);
      notifySuccess("Goal deleted successfully.");
      setPendingDeleteId(null);
      loadGoals();
    } catch (error) {
      notifyError(error, "Failed to delete goal.");
    }
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    notifyWarning("Goal deletion cancelled.");
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
      transition={{
        duration: 0.35,
      }}
      className="px-4 py-6 sm:px-6 lg:px-8"
    >
      <PageHeader
        eyebrow="Savings momentum"
        title="Goals"
        description="Plan financial targets, track saved amounts, and celebrate milestones as you complete them."
      />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <AnimatedCard className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-[#EAFBF8] p-3 text-[#14B8A6]">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">
                {editingId ? "Update goal" : "Create goal"}
              </h2>
              <p className="text-sm text-[var(--muted-text)]">
                Track target date and saved progress.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <input
              placeholder="Goal Name"
              value={formData.goal_name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  goal_name: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#14B8A6] focus:ring-4 focus:ring-teal-500/10"
            />

            <input
              type="number"
              placeholder="Target Amount"
              value={formData.target_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  target_amount: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#14B8A6] focus:ring-4 focus:ring-teal-500/10"
            />

            <input
              type="number"
              placeholder="Current Amount"
              value={formData.current_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  current_amount: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#14B8A6] focus:ring-4 focus:ring-teal-500/10"
            />

            <input
              type="date"
              value={formData.target_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  target_date: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#14B8A6] focus:ring-4 focus:ring-teal-500/10"
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileTap={{
                  scale: 0.98,
                }}
                className="rounded-2xl bg-[#14B8A6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-600"
              >
                {editingId ? "Update Goal" : "Add Goal"}
              </motion.button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-[var(--card-border)] px-5 py-3 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--muted-bg)]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </AnimatedCard>

        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <AnimatedCard className="p-5">
              <p className="text-sm text-[var(--muted-text)]">
                Total Target
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--text)]">
                {formatCurrency(totals.target)}
              </p>
            </AnimatedCard>

            <AnimatedCard className="p-5">
              <p className="text-sm text-[var(--muted-text)]">
                Saved So Far
              </p>
              <p className="mt-2 text-2xl font-bold text-[#14B8A6]">
                {formatCurrency(totals.saved)}
              </p>
            </AnimatedCard>

            <AnimatedCard className="p-5">
              <p className="text-sm text-[var(--muted-text)]">
                Remaining
              </p>
              <p className="mt-2 text-2xl font-bold text-[#F97316]">
                {formatCurrency(totals.target - totals.saved)}
              </p>
            </AnimatedCard>
          </div>

          {goals.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No goals yet"
              description="Create your first goal to visualize savings progress."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {goals.map((goal, index) => {
                const progress = Number(
                  goal.progress_percentage || 0
                );
                const isComplete = progress >= 100;

                return (
                  <AnimatedCard
                    key={goal.id}
                    delay={index * 0.04}
                    className="p-5"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold text-[var(--text)]">
                          {goal.goal_name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-text)]">
                          {formatCurrency(goal.current_amount)}
                          {" saved of "}
                          {formatCurrency(goal.target_amount)}
                        </p>
                      </div>

                      {isComplete && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 size={13} />
                          Complete
                        </span>
                      )}
                    </div>

                    <ProgressBar
                      value={progress}
                      tone={isComplete ? "success" : "primary"}
                    />

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--text)]">
                        {progress.toFixed(0)}% complete
                      </span>
                      <span className="text-[var(--muted-text)]">
                        {formatCurrency(goal.remaining_amount)}
                        {" left"}
                      </span>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(goal.id)}
                        className="rounded-xl border border-[var(--card-border)] p-2 text-[var(--muted-text)] transition hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDeleteId(goal.id)
                        }
                        className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </AnimatedCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete goal?"
        description="This savings goal and its progress will be permanently removed."
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </motion.main>
  );
}

export default Goals;
