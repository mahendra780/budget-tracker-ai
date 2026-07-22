import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Clapperboard,
  Edit3,
  GraduationCap,
  Heart,
  PiggyBank,
  Plane,
  Plus,
  ReceiptText,
  ShoppingBag,
  Tag,
  Trash2,
  Utensils,
  WalletCards,
} from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
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

const categoryMeta = {
  Food: {
    icon: Utensils,
    className: "bg-[var(--warning-soft)] text-[var(--warning)]",
  },
  Travel: {
    icon: Plane,
    className: "bg-[var(--info-soft)] text-[var(--info)]",
  },
  Shopping: {
    icon: ShoppingBag,
    className: "bg-[var(--primary-soft)] text-[var(--primary)]",
  },
  Bills: {
    icon: ReceiptText,
    className: "bg-[var(--danger-soft)] text-[var(--danger)]",
  },
  Entertainment: {
    icon: Clapperboard,
    className: "bg-[var(--primary-soft)] text-[var(--primary)]",
  },
  Healthcare: {
    icon: Heart,
    className: "bg-[var(--danger-soft)] text-[var(--danger)]",
  },
  Education: {
    icon: GraduationCap,
    className: "bg-[var(--info-soft)] text-[var(--info)]",
  },
  Savings: {
    icon: PiggyBank,
    className: "bg-[var(--success-soft)] text-[var(--success)]",
  },
  Salary: {
    icon: WalletCards,
    className: "bg-[var(--success-soft)] text-[var(--success)]",
  },
};

const getCategoryMeta = (category) =>
  categoryMeta[category] || {
    icon: Tag,
    className: "bg-[var(--muted-bg)] text-[var(--muted-text)]",
  };

const getBudgetStatusMeta = (percentage) => {
  if (percentage > 100) {
    return {
      label: "Over budget",
      progressClassName: "bg-[var(--danger)]",
      badgeClassName: "bg-[var(--danger-soft)] text-[var(--danger)]",
      amountClassName: "text-[var(--danger)]",
      hasAlert: true,
    };
  }

  if (percentage > 85) {
    return {
      label: "Critical",
      progressClassName: "bg-[var(--danger)]",
      badgeClassName: "bg-[var(--danger-soft)] text-[var(--danger)]",
      amountClassName: "text-[var(--danger)]",
      hasAlert: true,
    };
  }

  if (percentage > 60) {
    return {
      label: "Warning",
      progressClassName: "bg-[var(--warning)]",
      badgeClassName: "bg-[var(--warning-soft)] text-[var(--warning)]",
      amountClassName: "text-[var(--warning)]",
      hasAlert: true,
    };
  }

  return {
    label: "Healthy",
    progressClassName: "bg-[var(--success)]",
    badgeClassName: "bg-[var(--success-soft)] text-[var(--success)]",
    amountClassName: "text-[var(--success)]",
    hasAlert: false,
  };
};

function BudgetProgress({ value, status }) {
  const width = Math.min(Math.max(Number(value) || 0, 0), 100);
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      role="progressbar"
      aria-label="Budget utilization"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={width}
      aria-valuetext={`${Number(value || 0).toFixed(0)}% used, ${status.label}`}
      className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--muted-bg)]"
    >
      <motion.div
        initial={prefersReducedMotion ? false : { width: 0 }}
        animate={{ width: `${width}%` }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.75, ease: "easeOut" }}
        className={`h-full rounded-full ${status.progressClassName}`}
      />
    </div>
  );
}

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
      className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
    >
      <h1 className="sr-only">Budgets</h1>

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.6fr)]">
        <AnimatedCard className="h-fit overflow-hidden p-0 2xl:sticky 2xl:top-6">
          <div className="flex items-start gap-3 border-b border-[var(--card-border)] px-5 py-5">
            <div className="rounded-2xl bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
              {editingId ? <Edit3 size={21} /> : <Plus size={21} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold tracking-tight text-[var(--text)]">
                {editingId ? "Update budget" : "Add budget"}
              </h2>
              <p className="mt-1 text-sm leading-5 text-[var(--muted-text)]">
                Set a monthly category limit.
              </p>
            </div>
          </div>

          <form id="budget-form" onSubmit={handleSubmit} className="space-y-4 p-5">
            <div>
              <label
                htmlFor="budget-category"
                className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
              >
                Category
              </label>
              <input
                id="budget-category"
                placeholder="e.g. Food"
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                  })
                }
                className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="budget-limit"
                className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
              >
                Monthly limit
              </label>
              <input
                id="budget-limit"
                type="number"
                placeholder="0.00"
                value={formData.monthly_limit}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monthly_limit: e.target.value,
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
                {editingId ? "Update budget" : "Add budget"}
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
          <section
            aria-label="Budget totals"
            className="grid gap-3 sm:grid-cols-3"
          >
            <AnimatedCard className="min-w-0 p-4 sm:p-5" delay={0.02}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--muted-text)]">
                    Total budget
                  </p>
                  <p className="mt-2 truncate text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
                    {formatCurrency(budgetTotals.limit)}
                  </p>
                </div>
                <span className="rounded-xl bg-[var(--primary-soft)] p-2.5 text-[var(--primary)]">
                  <WalletCards size={19} aria-hidden="true" />
                </span>
              </div>
            </AnimatedCard>

            <AnimatedCard className="min-w-0 p-4 sm:p-5" delay={0.06}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--muted-text)]">
                    Spent so far
                  </p>
                  <p className="mt-2 truncate text-xl font-bold tracking-tight text-[var(--text)] sm:text-2xl">
                    {formatCurrency(budgetTotals.spent)}
                  </p>
                </div>
                <span className="rounded-xl bg-[var(--warning-soft)] p-2.5 text-[var(--warning)]">
                  <ReceiptText size={19} aria-hidden="true" />
                </span>
              </div>
            </AnimatedCard>

            <AnimatedCard className="min-w-0 p-4 sm:p-5" delay={0.1}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--muted-text)]">
                    Remaining
                  </p>
                  <p
                    className={`mt-2 truncate text-xl font-bold tracking-tight sm:text-2xl ${
                      budgetTotals.limit - budgetTotals.spent < 0
                        ? "text-[var(--danger)]"
                        : "text-[var(--success)]"
                    }`}
                  >
                    {formatCurrency(
                      budgetTotals.limit - budgetTotals.spent
                    )}
                  </p>
                </div>
                <span className="rounded-xl bg-[var(--success-soft)] p-2.5 text-[var(--success)]">
                  <PiggyBank size={19} aria-hidden="true" />
                </span>
              </div>
            </AnimatedCard>
          </section>

          <section aria-labelledby="active-budgets-title">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-[var(--muted-bg)] p-2 text-[var(--primary)]">
                  <WalletCards size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2
                    id="active-budgets-title"
                    className="text-base font-bold tracking-tight text-[var(--text)]"
                  >
                    Current budgets
                  </h2>
                  <p className="mt-0.5 text-sm text-[var(--muted-text)]">
                    {budgets.length} active {budgets.length === 1 ? "category" : "categories"}
                  </p>
                </div>
              </div>
            </div>

            {budgets.length === 0 ? (
              <AnimatedCard className="min-h-[360px] p-0">
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl bg-[var(--muted-bg)] px-6 py-10 text-center">
                  <div className="mb-5 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-[var(--primary)] shadow-[var(--card-shadow)]">
                    <WalletCards size={30} strokeWidth={1.7} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--text)]">
                    No budgets yet
                  </h3>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted-text)]">
                    Add a category limit to start monitoring your monthly spending.
                  </p>
                  <a
                    href="#budget-form"
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/15 transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
                  >
                    <Plus size={16} />
                    Add budget
                  </a>
                </div>
              </AnimatedCard>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {budgets.map((budget, index) => {
                  const progress = Number(
                    budget.percentage_used || 0
                  );
                  const isOverBudget = progress > 100;
                  const remaining =
                    Number(budget.limit || 0) -
                    Number(budget.spent || 0);
                  const category = getCategoryMeta(budget.category);
                  const CategoryIcon = category.icon;
                  const status = getBudgetStatusMeta(progress);

                  return (
                    <AnimatedCard
                      key={budget.id}
                      delay={index * 0.04}
                      className="min-w-0 overflow-hidden p-0"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)] px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className={`shrink-0 rounded-2xl p-2.5 ${category.className}`}>
                            <CategoryIcon size={19} aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold capitalize text-[var(--text)]">
                              {budget.category || "Uncategorized"}
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-[var(--muted-text)]">
                              Monthly budget
                            </p>
                          </div>
                        </div>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${status.badgeClassName}`}
                        >
                          {status.hasAlert && (
                            <AlertTriangle size={13} aria-hidden="true" />
                          )}
                          {status.label}
                        </span>
                      </div>

                      <div className="space-y-5 p-5">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--subtle-text)]">
                              Budget
                            </p>
                            <p className="mt-1 truncate text-sm font-bold tabular-nums text-[var(--text)]">
                              {formatCurrency(budget.limit)}
                            </p>
                          </div>
                          <div className="min-w-0 border-x border-[var(--card-border)] px-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--subtle-text)]">
                              Spent
                            </p>
                            <p className="mt-1 truncate text-sm font-bold tabular-nums text-[var(--text)]">
                              {formatCurrency(budget.spent)}
                            </p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--subtle-text)]">
                              Remaining
                            </p>
                            <p className={`mt-1 truncate text-sm font-bold tabular-nums ${status.amountClassName}`}>
                              {formatCurrency(remaining)}
                            </p>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2.5 flex items-center justify-between gap-3">
                            <span className="text-sm font-semibold text-[var(--text)]">
                              Utilization
                            </span>
                            <span className={`shrink-0 text-sm font-bold tabular-nums ${status.amountClassName}`}>
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                          <BudgetProgress value={progress} status={status} />
                          <div className="mt-2.5 flex items-center justify-between gap-3 text-xs">
                            <span className="text-[var(--muted-text)]">
                              {formatCurrency(budget.spent)} spent
                            </span>
                            <span className={`font-semibold ${status.amountClassName}`}>
                              {isOverBudget
                                ? `${formatCurrency(Math.abs(remaining))} over`
                                : `${formatCurrency(remaining)} left`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 border-t border-[var(--card-border)] pt-4">
                          <button
                            type="button"
                            onClick={() => handleEdit(budget)}
                            className="inline-flex items-center justify-center border border-[var(--card-border)] p-2 text-[var(--muted-text)] hover:-translate-y-0.5 hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                            aria-label={`Edit ${budget.category} budget`}
                            title="Edit budget"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingDeleteId(budget.id)
                            }
                            className="inline-flex items-center justify-center border border-rose-200 p-2 text-rose-600 hover:-translate-y-0.5 hover:bg-rose-50"
                            aria-label={`Delete ${budget.category} budget`}
                            title="Delete budget"
                          >
                            <Trash2 size={16} />
                          </button>
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
        title="Delete budget?"
        description="This budget will be removed, but existing transactions will remain untouched."
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </motion.main>
  );
}

export default Budgets;
