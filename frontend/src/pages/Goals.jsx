import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  History,
  PiggyBank,
  Plus,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import ProgressBar from "../components/ui/ProgressBar";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  getGoals,
  getGoalProgress,
  createGoalContribution,
  getGoalContributions,
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
  target_date: "",
};

const getGoalStatusMeta = (progress) => {
  if (progress >= 100) {
    return {
      label: "Completed",
      tone: "success",
      badgeClassName: "bg-[var(--success-soft)] text-[var(--success)]",
    };
  }

  if (progress >= 75) {
    return {
      label: "Almost complete",
      tone: "warning",
      badgeClassName: "bg-[var(--warning-soft)] text-[var(--warning)]",
    };
  }

  return {
    label: "On track",
    tone: "primary",
    badgeClassName: "bg-[var(--primary-soft)] text-[var(--primary)]",
  };
};

function Goals() {
  const [goals, setGoals] = useState([]);
  const [goalDetails, setGoalDetails] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] =
    useState(null);
  const [contributionGoal, setContributionGoal] =
    useState(null);
  const [contributionAction, setContributionAction] =
    useState("add");
  const [contributionAmount, setContributionAmount] =
    useState("");
  const [historyGoal, setHistoryGoal] = useState(null);
  const [contributionHistory, setContributionHistory] =
    useState([]);
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

  const openContributionModal = (goal, action) => {
    setContributionGoal(goal);
    setContributionAction(action);
    setContributionAmount("");
  };

  const closeContributionModal = () => {
    setContributionGoal(null);
    setContributionAmount("");
  };

  const handleContributionSubmit = async (e) => {
    e.preventDefault();

    if (!contributionGoal) return;

    try {
      await createGoalContribution(contributionGoal.id, {
        action: contributionAction,
        amount: Number(contributionAmount),
      });

      notifySuccess(
        contributionAction === "add"
          ? "Savings added successfully"
          : "Savings withdrawn successfully"
      );

      closeContributionModal();
      loadGoals();
    } catch (error) {
      notifyError(error, "Failed to save contribution.");
    }
  };

  const openHistoryModal = async (goal) => {
    setHistoryGoal(goal);

    try {
      const history = await getGoalContributions(goal.id);
      setContributionHistory(history);
    } catch (error) {
      notifyError(error, "Failed to load contribution history.");
    }
  };

  const closeHistoryModal = () => {
    setHistoryGoal(null);
    setContributionHistory([]);
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
      className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
    >
      <h1 className="sr-only">Goals</h1>

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.6fr)]">
        <AnimatedCard className="h-fit overflow-hidden p-0 2xl:sticky 2xl:top-6">
          <div className="flex items-start gap-3 border-b border-[var(--card-border)] px-5 py-5">
            <div className="rounded-2xl bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
              {editingId ? <Edit3 size={21} /> : <Plus size={21} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight text-[var(--text)]">
                {editingId ? "Update goal" : "Add goal"}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-text)]">
                Set a target and deadline.
              </p>
            </div>
          </div>

          <form id="goal-form" onSubmit={handleSubmit} className="space-y-4 p-5">
            <div>
              <label
                htmlFor="goal-name"
                className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
              >
                Goal name
              </label>
              <input
                id="goal-name"
                placeholder="e.g. Emergency fund"
                value={formData.goal_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    goal_name: e.target.value,
                  })
                }
                className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="goal-target"
                className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
              >
                Target amount
              </label>
              <input
                id="goal-target"
                type="number"
                placeholder="0.00"
                value={formData.target_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_amount: e.target.value,
                  })
                }
                className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="goal-date"
                className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
              >
                Target date
              </label>
              <input
                id="goal-date"
                type="date"
                value={formData.target_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    target_date: e.target.value,
                  })
                }
                className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-[var(--card-border)] pt-5 sm:flex-row">
              <motion.button
                whileTap={{
                  scale: 0.98,
                }}
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-2 bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/15 hover:bg-[var(--primary-hover)]"
              >
                {editingId ? <Edit3 size={17} /> : <Plus size={17} />}
                {editingId ? "Update goal" : "Add goal"}
              </motion.button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="border border-[var(--card-border)] px-5 py-3 text-sm font-bold text-[var(--text)] hover:bg-[var(--muted-bg)]"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </AnimatedCard>

        <div className="min-w-0 space-y-5">
          <section aria-label="Goal totals" className="grid gap-3 sm:grid-cols-3">
            <AnimatedCard className="min-w-0 p-4 sm:p-5" delay={0.02}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--muted-text)]">
                    Total target
                  </p>
                  <p className="mt-2 truncate text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
                    {formatCurrency(totals.target)}
                  </p>
                </div>
                <span className="rounded-xl bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]">
                  <Target size={19} aria-hidden="true" />
                </span>
              </div>
            </AnimatedCard>

            <AnimatedCard className="min-w-0 p-4 sm:p-5" delay={0.06}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--muted-text)]">
                    Saved so far
                  </p>
                  <p className="mt-2 truncate text-xl font-bold tracking-tight text-[var(--success)] sm:text-2xl">
                    {formatCurrency(totals.saved)}
                  </p>
                </div>
                <span className="rounded-xl bg-[var(--success-soft)] p-2.5 text-[var(--success)]">
                  <PiggyBank size={19} aria-hidden="true" />
                </span>
              </div>
            </AnimatedCard>

            <AnimatedCard className="min-w-0 p-4 sm:p-5" delay={0.1}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--muted-text)]">
                    Remaining
                  </p>
                  <p className="mt-2 truncate text-xl font-bold tracking-tight text-[var(--primary)] sm:text-2xl">
                    {formatCurrency(totals.target - totals.saved)}
                  </p>
                </div>
                <span className="rounded-xl bg-[var(--muted-bg)] p-2.5 text-[var(--primary)]">
                  <Wallet size={19} aria-hidden="true" />
                </span>
              </div>
            </AnimatedCard>
          </section>

          <section aria-labelledby="active-goals-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-[var(--muted-bg)] p-2 text-[var(--primary)]">
                  <Target size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="active-goals-title"
                    className="text-base font-bold tracking-tight text-[var(--text)]"
                  >
                    Current goals
                  </h2>
                  <p className="mt-0.5 text-sm text-[var(--muted-text)]">
                    {goals.length} active {goals.length === 1 ? "goal" : "goals"}
                  </p>
                </div>
              </div>
            </div>

            {goals.length === 0 ? (
              <AnimatedCard className="min-h-[360px] p-0">
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl bg-[var(--muted-bg)] px-6 py-10 text-center">
                  <div className="mb-5 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-[var(--primary)] shadow-[var(--card-shadow)]">
                    <Target size={30} strokeWidth={1.7} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    No goals yet
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted-text)]">
                    Add a target to begin tracking your progress.
                  </p>
                  <a
                    href="#goal-form"
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/15 transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
                  >
                    <Plus size={16} />
                    Add goal
                  </a>
                </div>
              </AnimatedCard>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {goals.map((goal, index) => {
                  const progress = Number(
                    goal.progress_percentage || 0
                  );
                  const isComplete = progress >= 100;
                  const status = getGoalStatusMeta(progress);

                  return (
                    <AnimatedCard
                      key={goal.id}
                      delay={index * 0.04}
                      className="min-w-0 overflow-hidden p-0"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)] px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="shrink-0 rounded-2xl bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]">
                            <Target size={19} aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[var(--text)]">
                              {goal.goal_name}
                            </p>
                            {goal.target_date && (
                              <time
                                dateTime={goal.target_date}
                                className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[var(--muted-text)]"
                              >
                                <Calendar size={13} aria-hidden="true" />
                                {goal.target_date}
                              </time>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${status.badgeClassName}`}
                        >
                          {isComplete && <CheckCircle2 size={13} aria-hidden="true" />}
                          {status.label}
                        </span>
                      </div>

                      <div className="space-y-5 p-5">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--subtle-text)]">
                              Target
                            </p>
                            <p className="mt-1 truncate text-sm font-bold tabular-nums text-[var(--text)]">
                              {formatCurrency(goal.target_amount)}
                            </p>
                          </div>
                          <div className="min-w-0 border-x border-[var(--card-border)] px-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--subtle-text)]">
                              Saved
                            </p>
                            <p className="mt-1 truncate text-sm font-bold tabular-nums text-[var(--success)]">
                              {formatCurrency(goal.current_amount)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--subtle-text)]">
                              Remaining
                            </p>
                            <p className="mt-1 truncate text-sm font-bold tabular-nums text-[var(--primary)]">
                              {formatCurrency(goal.remaining_amount)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2.5 flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-[var(--text)]">
                              Progress
                            </span>
                            <span className="shrink-0 text-sm font-bold tabular-nums text-[var(--text)]">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <ProgressBar value={progress} tone={status.tone} />
                          <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
                            <span className="text-[var(--muted-text)]">
                              {formatCurrency(goal.current_amount)} saved
                            </span>
                            <span className="font-semibold text-[var(--muted-text)]">
                              {formatCurrency(goal.target_amount)} target
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--card-border)] pt-4">
                          <button
                            type="button"
                            onClick={() =>
                              openContributionModal(goal, "add")
                            }
                            className="inline-flex items-center gap-1.5 bg-[var(--primary)] px-3 py-2 text-xs font-bold text-white hover:bg-[var(--primary-hover)]"
                          >
                            <Plus size={15} />
                            Add savings
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openContributionModal(goal, "withdraw")
                            }
                            className="inline-flex items-center gap-1.5 bg-[var(--primary-soft)] px-3 py-2 text-xs font-bold text-[var(--primary)] hover:bg-[var(--muted-bg)]"
                          >
                            Withdraw
                          </button>

                          <div className="ml-auto flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openHistoryModal(goal)}
                              className="inline-flex items-center justify-center border border-[var(--card-border)] p-2 text-[var(--muted-text)] hover:-translate-y-0.5 hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                              aria-label={`View ${goal.goal_name} history`}
                              title="Contribution history"
                            >
                              <History size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEdit(goal.id)}
                              className="inline-flex items-center justify-center border border-[var(--card-border)] p-2 text-[var(--muted-text)] hover:-translate-y-0.5 hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                              aria-label={`Edit ${goal.goal_name}`}
                              title="Edit goal"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDeleteId(goal.id)
                              }
                              className="inline-flex items-center justify-center border border-rose-200 p-2 text-rose-600 hover:-translate-y-0.5 hover:bg-rose-50"
                              aria-label={`Delete ${goal.goal_name}`}
                              title="Delete goal"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete goal?"
        description="This savings goal and its progress will be permanently removed."
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />

      {contributionGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            className="w-full max-w-md rounded-3xl bg-[var(--card-bg)] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-[#EAFBF8] p-3 text-[#14B8A6]">
                <Wallet size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">
                  {contributionAction === "add"
                    ? "Add Savings"
                    : "Withdraw Savings"}
                </h2>
                <p className="text-sm text-[var(--muted-text)]">
                  {contributionGoal.goal_name}
                </p>
              </div>
            </div>

            <form
              onSubmit={handleContributionSubmit}
              className="space-y-4"
            >
              <input
                type="number"
                min="1"
                placeholder="Amount"
                value={contributionAmount}
                onChange={(e) =>
                  setContributionAmount(e.target.value)
                }
                className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#14B8A6] focus:ring-4 focus:ring-teal-500/10"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeContributionModal}
                  className="rounded-2xl border border-[var(--card-border)] px-5 py-3 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--muted-bg)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-[#14B8A6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-600"
                >
                  Save
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {historyGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 12,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            className="w-full max-w-2xl rounded-3xl bg-[var(--card-bg)] p-6 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">
                  Contribution History
                </h2>
                <p className="text-sm text-[var(--muted-text)]">
                  {historyGoal.goal_name}
                </p>
              </div>
              <button
                type="button"
                onClick={closeHistoryModal}
                className="rounded-2xl border border-[var(--card-border)] px-4 py-2 text-sm font-bold text-[var(--text)] transition hover:bg-[var(--muted-bg)]"
              >
                Close
              </button>
            </div>

            {contributionHistory.length === 0 ? (
              <EmptyState
                icon={History}
                title="No contributions yet"
                description="Add or withdraw savings to build this goal history."
              />
            ) : (
              <div className="max-h-96 overflow-auto rounded-3xl border border-[var(--card-border)]">
                {contributionHistory.map((item) => (
                  <div
                    key={item.id}
                    className="grid gap-3 border-b border-[var(--card-border)] p-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto]"
                  >
                    <span
                      className={`font-bold capitalize ${
                        item.action === "add"
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {item.action}
                    </span>
                    <span className="text-sm text-[var(--muted-text)]">
                      {item.created_at}
                    </span>
                    <span className="font-bold text-[var(--text)]">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </motion.main>
  );
}

export default Goals;
