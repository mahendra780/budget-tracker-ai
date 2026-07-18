import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Edit3,
  Pause,
  Play,
  Plus,
  RefreshCcw,
  Repeat,
  Trash2,
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
import {
  getCategoriesByType,
  resolveCategory,
} from "../utils/categories";
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
      formData.customCategory
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
      payload.last_processed_date =
        currentItem?.last_processed_date || null;
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
        } generated.`
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
      className="px-4 py-6 sm:px-6 lg:px-8"
    >
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <AnimatedCard className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-[#FFF4EC] p-3 text-[#F97316]">
              <Plus size={22} />
            </div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              {editingId ? "Update recurring item" : "Create recurring item"}
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
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
                    e.target.value === "Other"
                      ? formData.customCategory
                      : "",
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            >
              <option value="">Category</option>
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
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

            <div className="flex flex-wrap gap-3">
              <motion.button
                whileTap={{
                  scale: 0.98,
                }}
                className="rounded-2xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
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

        <div className="space-y-6">
          <AnimatedCard className="p-5">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[var(--text)]">
                  Upcoming Payments
                </h2>
                <p className="text-sm text-[var(--muted-text)]">
                  Next scheduled active occurrences.
                </p>
              </div>
              <button
                type="button"
                disabled={processing}
                onClick={handleProcess}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#14B8A6] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-500/20 transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCcw size={17} />
                {processing ? "Processing" : "Process Due"}
              </button>
            </div>

            {upcoming.length === 0 ? (
              <EmptyState
                icon={CalendarClock}
                title="No upcoming payments"
                description="Active recurring items will appear here."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {upcoming.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[var(--card-border)] bg-[var(--muted-bg)] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[var(--text)]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-text)]">
                          Due {formatDate(item.next_due_date)}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-bold ${
                          item.type === "income"
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }`}
                      >
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AnimatedCard>

          <div className="grid gap-4 lg:grid-cols-2">
            {items.length === 0 ? (
              <EmptyState
                icon={Repeat}
                title="No recurring items"
                description="Create rent, salary, bills, or other repeating activity."
              />
            ) : (
              items.map((item) => (
                <AnimatedCard
                  key={item.id}
                  className="p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-bold text-[var(--text)]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted-text)]">
                        {titleCase(item.frequency)} / starts{" "}
                        {formatDate(item.start_date)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.active ? "Active" : "Paused"}
                    </span>
                  </div>
                  <p
                    className={`mt-4 text-2xl font-bold ${
                      item.type === "income"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {formatCurrency(item.amount)}
                  </p>
                  <p className="mt-1 text-sm capitalize text-[var(--muted-text)]">
                    {item.type} / {item.category}
                  </p>
                  <p className="mt-3 text-xs text-[var(--muted-text)]">
                    Last processed: {formatDate(item.last_processed_date)}{" "}
                    &middot;{" "}
                    Ends: {formatDate(item.end_date)}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--muted-bg)] px-3 py-2 text-xs font-bold text-[var(--text)] transition hover:bg-[var(--card-border)]"
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
                      aria-label="Edit recurring transaction"
                    >
                      <Edit3 size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDeleteId(item.id)}
                      className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                      aria-label="Delete recurring transaction"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </AnimatedCard>
              ))
            )}
          </div>
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
