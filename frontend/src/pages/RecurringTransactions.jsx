import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarClock,
  Clapperboard,
  Edit3,
  GraduationCap,
  Heart,
  Pause,
  PiggyBank,
  Plane,
  Play,
  Plus,
  RefreshCcw,
  ReceiptText,
  Repeat,
  ShoppingBag,
  Tag,
  Trash2,
  Utensils,
  WalletCards,
} from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  getRecurringTransactions,
  getUpcomingRecurringTransactions,
  processRecurringTransactions,
  toggleRecurringTransaction,
  updateRecurringTransaction,
} from "../services/recurringService";
import { formatCurrency } from "../utils/formatters";
import { getCategoriesByType, resolveCategory } from "../utils/categories";
import {
  notifyError,
  notifySuccess,
  notifyWarning,
} from "../utils/notifications";

const initialForm = {
  title: "",
  amount: "",
  type: "expense",
  category: "",
  customCategory: "",
  frequency: "monthly",
  start_date: "",
  end_date: "",
  active: true,
};

const formatDate = (value) => value || "Not set";

const titleCase = (value) =>
  value ? value.charAt(0).toUpperCase() + value.slice(1) : "";

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

function RecurringTransactions() {
  const [items, setItems] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const loadItems = async () => {
    try {
      const [itemData, upcomingData] = await Promise.all([
        getRecurringTransactions(),
        getUpcomingRecurringTransactions(),
      ]);

      setItems(itemData);
      setUpcoming(upcomingData);
    } catch (error) {
      notifyError(error, "Failed to load recurring transactions.");
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const resetForm = () => {
    setFormData(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const category = resolveCategory(
      formData.category,
      formData.customCategory,
    );

    if (!category) {
      notifyWarning("Please choose or enter a category.");
      return;
    }

    const payload = {
      title: formData.title,
      amount: Number(formData.amount),
      type: formData.type,
      category,
      frequency: formData.frequency,
      start_date: formData.start_date,
      end_date: formData.end_date || null,
      active: formData.active,
    };

    if (editingId) {
      const currentItem = items.find((item) => item.id === editingId);
      payload.last_processed_date = currentItem?.last_processed_date || null;
    }

    try {
      if (editingId) {
        await updateRecurringTransaction(editingId, payload);
        notifySuccess("Recurring transaction updated.");
      } else {
        await createRecurringTransaction(payload);
        notifySuccess("Recurring transaction created.");
      }

      resetForm();
      loadItems();
    } catch (error) {
      notifyError(error, "Failed to save recurring transaction.");
    }
  };

  const handleEdit = (item) => {
    const categories = getCategoriesByType(item.type);
    const isKnownCategory = categories.includes(item.category);

    setFormData({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: isKnownCategory ? item.category : "Other",
      customCategory: isKnownCategory ? "" : item.category,
      frequency: item.frequency,
      start_date: item.start_date,
      end_date: item.end_date || "",
      active: item.active,
    });
    setEditingId(item.id);
  };

  const handleToggle = async (id) => {
    try {
      await toggleRecurringTransaction(id);
      notifySuccess("Recurring transaction status updated.");
      loadItems();
    } catch (error) {
      notifyError(error, "Failed to update recurring status.");
    }
  };

  const handleProcess = async () => {
    try {
      setProcessing(true);
      const result = await processRecurringTransactions();
      notifySuccess(
        `${result.generated_count} recurring transaction${
          result.generated_count === 1 ? "" : "s"
        } generated.`,
      );
      loadItems();
    } catch (error) {
      notifyError(error, "Failed to process recurring transactions.");
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteRecurringTransaction(pendingDeleteId);
      notifySuccess("Recurring transaction deleted.");
      setPendingDeleteId(null);
      loadItems();
    } catch (error) {
      notifyError(error, "Failed to delete recurring transaction.");
    }
  };

  const categories = getCategoriesByType(formData.type);

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
      className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
    >
      <h1 className="sr-only">Recurring transactions</h1>
      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.6fr)]">
        <AnimatedCard className="h-fit overflow-hidden p-0 2xl:sticky 2xl:top-6">
          <div className="flex items-start gap-3 border-b border-[var(--card-border)] px-5 py-5">
            <div className="rounded-2xl bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
              {editingId ? <Edit3 size={21} /> : <Plus size={21} />}
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-[var(--text)]">
                {editingId ? "Update recurring item" : "Add recurring item"}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-text)]">
                Create a repeating payment or deposit.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            <input
              required
              placeholder="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            />
            <input
              required
              min="0"
              step="0.01"
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            />
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value,
                  category: "",
                  customCategory: "",
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value,
                  customCategory:
                    e.target.value === "Other" ? formData.customCategory : "",
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="">Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {formData.category === "Other" && (
              <input
                required
                placeholder="Custom category"
                value={formData.customCategory}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customCategory: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
              />
            )}
            <select
              value={formData.frequency}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  frequency: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  Start Date <span className="text-red-500">*</span>
                </label>

                <input
                  required
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      start_date: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--text)]">
                  End Date{" "}
                  <span className="text-[var(--muted-text)]">(Optional)</span>
                </label>

                <input
                  type="date"
                  value={formData.end_date}
                  min={formData.start_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      end_date: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
                />

                <p className="mt-1 text-xs text-[var(--muted-text)]">
                  Leave empty if this recurring transaction should continue
                  indefinitely.
                </p>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    active: e.target.checked,
                  })
                }
              />
              Active
            </label>

            <div className="flex flex-wrap gap-3 border-t border-[var(--card-border)] pt-5">
              <motion.button
                whileTap={{
                  scale: 0.98,
                }}
                className="inline-flex items-center gap-2 bg-[var(--primary)] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/15 hover:bg-[var(--primary-hover)]"
              >
                {editingId ? <Edit3 size={16} /> : <Plus size={16} />}
                {editingId ? "Update" : "Create"}
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

        <div className="min-w-0 space-y-5">
          <AnimatedCard className="overflow-hidden p-0">
            <div className="flex flex-col gap-3 border-b border-[var(--card-border)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold tracking-tight text-[var(--text)]">
                  Upcoming Payments
                </h2>
                <p className="mt-1 text-sm text-[var(--muted-text)]">
                  Next scheduled active occurrences.
                </p>
              </div>
              <button
                type="button"
                disabled={processing}
                aria-busy={processing}
                onClick={handleProcess}
                className="inline-flex items-center justify-center gap-2 bg-[var(--success)] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/15 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCcw size={17} />
                {processing ? "Processing" : "Process Due"}
              </button>
            </div>

            <div className="p-4 sm:p-5">
              {upcoming.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="No upcoming payments"
                  description="Active recurring items will appear here."
                />
              ) : (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {upcoming.map((item) => {
                    const category = getCategoryMeta(item.category);
                    const CategoryIcon = category.icon;
                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-[var(--card-border)] bg-[var(--muted-bg)] p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`shrink-0 rounded-xl p-2 ${category.className}`}
                            >
                              <CategoryIcon size={17} aria-hidden="true" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-bold text-[var(--text)]">
                                {item.title}
                              </p>
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--muted-text)]">
                                <Calendar size={13} aria-hidden="true" />
                                Due {formatDate(item.next_due_date)}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              item.type === "income"
                                ? "text-[var(--success)]"
                                : "text-[var(--danger)]"
                            }`}
                          >
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </AnimatedCard>

          <section aria-labelledby="recurring-items-title">
            <div className="mb-4 flex items-center gap-3">
              <span className="rounded-xl bg-[var(--muted-bg)] p-2 text-[var(--primary)]">
                <Repeat size={18} aria-hidden="true" />
              </span>
              <div>
                <h2
                  id="recurring-items-title"
                  className="text-base font-bold tracking-tight text-[var(--text)]"
                >
                  Recurring items
                </h2>
                <p className="mt-0.5 text-sm text-[var(--muted-text)]">
                  {items.length} scheduled{" "}
                  {items.length === 1 ? "item" : "items"}
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.length === 0 ? (
                <EmptyState
                  icon={Repeat}
                  title="No recurring items"
                  description="Create rent, salary, bills, or other repeating activity."
                  className="md:col-span-2 xl:col-span-3"
                />
              ) : (
                items.map((item) => {
                  const category = getCategoryMeta(item.category);
                  const CategoryIcon = category.icon;
                  return (
                    <AnimatedCard
                      key={item.id}
                      className="min-w-0 overflow-hidden p-0"
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-[var(--card-border)] px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={`shrink-0 rounded-2xl p-2.5 ${category.className}`}
                          >
                            <CategoryIcon size={19} aria-hidden="true" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-[var(--text)]">
                              {item.title}
                            </p>
                            <p className="mt-1 text-xs capitalize text-[var(--muted-text)]">
                              {item.category || "Uncategorized"}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${
                            item.active
                              ? "bg-[var(--success-soft)] text-[var(--success)]"
                              : "bg-[var(--muted-bg)] text-[var(--muted-text)]"
                          }`}
                        >
                          {item.active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <div className="space-y-4 p-5">
                        <div className="flex items-end justify-between gap-3">
                          <p
                            className={`mt-4 text-2xl font-bold ${
                              item.type === "income"
                                ? "text-[var(--success)]"
                                : "text-[var(--danger)]"
                            }`}
                          >
                            {formatCurrency(item.amount)}
                          </p>
                          <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--primary)]">
                            {titleCase(item.frequency)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[var(--muted-bg)] p-3 text-xs">
                          <span className="flex items-center gap-1.5 text-[var(--muted-text)]">
                            <Calendar size={13} aria-hidden="true" />
                            Starts {formatDate(item.start_date)}
                          </span>
                          <span className="text-right text-[var(--muted-text)]">
                            Ends {formatDate(item.end_date)}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--muted-text)]">
                          Last processed: {formatDate(item.last_processed_date)}
                        </p>
                        <div className="flex flex-wrap gap-2 border-t border-[var(--card-border)] pt-4">
                          <button
                            type="button"
                            onClick={() => handleToggle(item.id)}
                            className="inline-flex items-center gap-2 bg-[var(--muted-bg)] px-3 py-2 text-xs font-bold text-[var(--text)] hover:bg-[var(--card-border)]"
                          >
                            {item.active ? (
                              <Pause size={15} />
                            ) : (
                              <Play size={15} />
                            )}
                            {item.active ? "Pause" : "Resume"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-xl border border-[var(--card-border)] p-2 text-[var(--muted-text)] transition hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                            aria-label={`Edit ${item.title}`}
                            title="Edit recurring transaction"
                          >
                            <Edit3 size={17} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(item.id)}
                            className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                            aria-label={`Delete ${item.title}`}
                            title="Delete recurring transaction"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                    </AnimatedCard>
                  );
                })
              )}
            </div>
          </section>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete recurring transaction?"
        description="This schedule will stop generating future transactions."
        onConfirm={handleDelete}
        onCancel={() => {
          setPendingDeleteId(null);
          notifyWarning("Recurring transaction deletion cancelled.");
        }}
      />
    </motion.main>
  );
}

export default RecurringTransactions;
