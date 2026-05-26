import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Edit3,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  getRecurringTransactions,
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
  frequency: "Monthly",
  next_due_date: "",
  is_active: true,
};

function RecurringTransactions() {
  const [items, setItems] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] =
    useState(null);

  const loadItems = async () => {
    try {
      const data = await getRecurringTransactions();
      setItems(data);
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

    const payload = {
      title: formData.title,
      amount: Number(formData.amount),
      type: formData.type,
      category: resolveCategory(
        formData.category,
        formData.customCategory
      ),
      frequency: formData.frequency,
      next_due_date: formData.next_due_date,
      is_active: formData.is_active,
    };

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
      next_due_date: item.next_due_date,
      is_active: item.is_active,
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
      <PageHeader
        eyebrow="Autopay system"
        title="Recurring Transactions"
        description="Manage scheduled income and expenses. Due items generate real transactions when processed from the dashboard."
      />

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
              placeholder="Title"
              value={formData.title}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  title: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
            />
            <input
              type="number"
              placeholder="Amount"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
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
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
            <select
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
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
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
                placeholder="Custom category"
                value={formData.customCategory}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    customCategory: e.target.value,
                  })
                }
                className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
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
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
            <input
              type="date"
              value={formData.next_due_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  next_due_date: e.target.value,
                })
              }
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
            />
            <label className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: e.target.checked,
                  })
                }
              />
              Active
            </label>

            <div className="flex gap-3">
              <button className="rounded-2xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white">
                {editingId ? "Update" : "Create"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-[var(--card-border)] px-5 py-3 text-sm font-bold"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
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
                      {item.frequency} / due {item.next_due_date}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      item.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.is_active ? "Active" : "Paused"}
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
                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className="rounded-xl bg-[var(--muted-bg)] px-3 py-2 text-xs font-bold text-[var(--text)]"
                  >
                    {item.is_active ? "Disable" : "Enable"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="rounded-xl border border-[var(--card-border)] p-2 text-[var(--muted-text)]"
                  >
                    <Edit3 size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(item.id)}
                    className="rounded-xl border border-rose-200 p-2 text-rose-600"
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </AnimatedCard>
            ))
          )}
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
