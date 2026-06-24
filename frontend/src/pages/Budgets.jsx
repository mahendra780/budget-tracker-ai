import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Edit3,
  History,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import ProgressBar from "../components/ui/ProgressBar";
import {
  createBudget,
  getBudgetStatus,
  updateBudget,
  deleteBudget,
} from "../services/budgetService";
import { formatCurrency } from "../utils/formatters";
import {
  notifyError,
  notifySuccess,
  notifyWarning,
} from "../utils/notifications";

const initialFormData = {
  category: "",
  monthly_limit: "",
};

function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] =
    useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const loadBudgets = async () => {
    try {
      const data = await getBudgetStatus();
      setBudgets(data);
    } catch (error) {
      notifyError(error, "Failed to load budgets.");
    }
  };

  useEffect(() => {
    let isMounted = true;

    getBudgetStatus()
      .then((data) => {
        if (isMounted) {
          setBudgets(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          notifyError(error, "Failed to load budgets.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const budgetTotals = useMemo(() => {
    return budgets.reduce(
      (totals, budget) => ({
        limit: totals.limit + Number(budget.limit || 0),
        spent: totals.spent + Number(budget.spent || 0),
      }),
      {
        limit: 0,
        spent: 0,
      }
    );
  }, [budgets]);

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      category: formData.category,
      monthly_limit: Number(formData.monthly_limit),
    };

    try {
      if (editingId) {
        await updateBudget(editingId, payload);
        notifySuccess("Budget updated successfully.");
      } else {
        await createBudget(payload);
        notifySuccess("Budget created successfully.");
      }

      resetForm();
      loadBudgets();
    } catch (error) {
      notifyError(error, "Failed to save budget.");
    }
  };

  const handleEdit = (budget) => {
    setFormData({
      category: budget.category,
      monthly_limit: budget.limit,
    });

    setEditingId(budget.id);
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteBudget(pendingDeleteId);
      notifySuccess("Budget deleted successfully.");
      setPendingDeleteId(null);
      loadBudgets();
    } catch (error) {
      notifyError(error, "Failed to delete budget.");
    }
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    notifyWarning("Budget deletion cancelled.");
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
        eyebrow="Spending guardrails"
        title="Budgets"
        description="Set category limits, track utilization, and spot overspending before it grows."
        action={
          <Link
            to="/budgets/history"
            className="inline-flex items-center gap-2 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] px-4 py-3 text-sm font-bold text-[var(--text)] shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <History size={18} />
            History
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <AnimatedCard className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-[#FFF4EC] p-3 text-[#F97316]">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">
                {editingId ? "Update budget" : "Create budget"}
              </h2>
              <p className="text-sm text-[var(--muted-text)]">
                Define a monthly category limit.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <input
              placeholder="Category"
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            />

            <input
              type="number"
              placeholder="Monthly Limit"
              value={formData.monthly_limit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  monthly_limit: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            />

            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileTap={{
                  scale: 0.98,
                }}
                className="rounded-2xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
                {editingId ? "Update Budget" : "Add Budget"}
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
                Total Limit
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--text)]">
                {formatCurrency(budgetTotals.limit)}
              </p>
            </AnimatedCard>

            <AnimatedCard className="p-5">
              <p className="text-sm text-[var(--muted-text)]">
                Total Spent
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--text)]">
                {formatCurrency(budgetTotals.spent)}
              </p>
            </AnimatedCard>

            <AnimatedCard className="p-5">
              <p className="text-sm text-[var(--muted-text)]">
                Remaining
              </p>
              <p className="mt-2 text-2xl font-bold text-[#14B8A6]">
                {formatCurrency(
                  budgetTotals.limit - budgetTotals.spent
                )}
              </p>
            </AnimatedCard>
          </div>

          {budgets.length === 0 ? (
            <EmptyState
              icon={WalletCards}
              title="No budgets yet"
              description="Create your first budget to start tracking category utilization."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {budgets.map((budget, index) => {
                const progress = Number(
                  budget.percentage_used || 0
                );
                const isOverBudget = progress > 100;
                const remaining =
                  Number(budget.limit || 0) -
                  Number(budget.spent || 0);

                return (
                  <AnimatedCard
                    key={budget.id}
                    delay={index * 0.04}
                    className="p-5"
                  >
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-lg font-bold capitalize text-[var(--text)]">
                          {budget.category}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-text)]">
                          {formatCurrency(budget.spent)}
                          {" spent of "}
                          {formatCurrency(budget.limit)}
                        </p>
                      </div>

                      <span
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                          isOverBudget
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isOverBudget && (
                          <AlertTriangle size={13} />
                        )}
                        {isOverBudget ? "Over" : "On track"}
                      </span>
                    </div>

                    <ProgressBar
                      value={progress}
                      tone={isOverBudget ? "danger" : "secondary"}
                    />

                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--text)]">
                        {progress.toFixed(0)}% utilized
                      </span>
                      <span className="text-[var(--muted-text)]">
                        {isOverBudget
                          ? `${formatCurrency(Math.abs(remaining))} over`
                          : `${formatCurrency(remaining)} left`}
                      </span>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(budget)}
                        className="rounded-xl border border-[var(--card-border)] p-2 text-[var(--muted-text)] transition hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                      >
                        <Edit3 size={17} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPendingDeleteId(budget.id)
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
        title="Delete budget?"
        description="This budget will be removed, but existing transactions will remain untouched."
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </motion.main>
  );
}

export default Budgets;
