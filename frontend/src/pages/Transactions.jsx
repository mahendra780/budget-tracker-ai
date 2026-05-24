import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Edit3,
  Plus,
  ReceiptText,
  Search,
  Trash2,
} from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "../services/transactionService";
import { formatCurrency } from "../utils/formatters";
import {
  notifyError,
  notifySuccess,
  notifyWarning,
} from "../utils/notifications";

const initialFormData = {
  title: "",
  amount: "",
  type: "expense",
  category: "",
  date: "",
};

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [pendingDeleteId, setPendingDeleteId] =
    useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const loadTransactions = async () => {
    try {
      const data = await getTransactions();
      setTransactions(data);
    } catch (error) {
      notifyError(error, "Failed to load transactions.");
    }
  };

  useEffect(() => {
    let isMounted = true;

    getTransactions()
      .then((data) => {
        if (isMounted) {
          setTransactions(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          notifyError(error, "Failed to load transactions.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return transactions;

    return transactions.filter((transaction) => {
      return [
        transaction.title,
        transaction.category,
        transaction.type,
        transaction.date,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [search, transactions]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      amount: Number(formData.amount),
    };

    try {
      if (editingId) {
        await updateTransaction(editingId, payload);
        notifySuccess("Transaction updated successfully.");
      } else {
        await createTransaction(payload);
        notifySuccess("Transaction created successfully.");
      }

      resetForm();
      loadTransactions();
    } catch (error) {
      notifyError(error, "Failed to save transaction.");
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      date: transaction.date,
    });

    setEditingId(transaction.id);
  };

  const handleDelete = async () => {
    if (!pendingDeleteId) return;

    try {
      await deleteTransaction(pendingDeleteId);
      notifySuccess("Transaction deleted successfully.");
      setPendingDeleteId(null);
      loadTransactions();
    } catch (error) {
      notifyError(error, "Failed to delete transaction.");
    }
  };

  const cancelDelete = () => {
    setPendingDeleteId(null);
    notifyWarning("Transaction deletion cancelled.");
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
        eyebrow="Money movement"
        title="Transactions"
        description="Create, update, search, and review income or expense records with clean category context."
      />

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <AnimatedCard className="p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-[#FFF4EC] p-3 text-[#F97316]">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">
                {editingId
                  ? "Update transaction"
                  : "Add transaction"}
              </h2>
              <p className="text-sm text-[var(--muted-text)]">
                Keep your cash flow ledger current.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <input
              type="text"
              name="title"
              placeholder="Title"
              value={formData.title}
              onChange={handleChange}
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            />

            <input
              type="number"
              name="amount"
              placeholder="Amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            />

            <input
              type="text"
              name="category"
              placeholder="Category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
            />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>

              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileTap={{
                  scale: 0.98,
                }}
                type="submit"
                className="rounded-2xl bg-[#F97316] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
              >
                {editingId
                  ? "Update Transaction"
                  : "Add Transaction"}
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

        <AnimatedCard className="p-5">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">
                Transaction ledger
              </h2>
              <p className="text-sm text-[var(--muted-text)]">
                {filteredTransactions.length} records shown
              </p>
            </div>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-text)]"
              />
              <input
                type="search"
                placeholder="Search transactions"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-[var(--card-border)] bg-[var(--input-bg)] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#F97316] focus:ring-4 focus:ring-orange-500/10 lg:w-72"
              />
            </div>
          </div>

          {filteredTransactions.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No transactions found"
              description="Add a transaction or adjust your search query."
            />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-[var(--card-border)]">
              <div className="hidden grid-cols-[1.5fr_1fr_1fr_auto] gap-4 bg-[var(--muted-bg)] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[var(--muted-text)] md:grid">
                <span>Transaction</span>
                <span>Category</span>
                <span>Amount</span>
                <span>Actions</span>
              </div>

              {filteredTransactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  className="grid gap-4 border-t border-[var(--card-border)] p-4 md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center"
                >
                  <div>
                    <p className="font-bold text-[var(--text)]">
                      {transaction.title}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-[var(--muted-text)]">
                      <Calendar size={14} />
                      {transaction.date || "No date"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--muted-bg)] px-3 py-1 text-xs font-bold capitalize text-[var(--text)]">
                      {transaction.category}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                        transaction.type === "income"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </div>

                  <p
                    className={`font-bold ${
                      transaction.type === "income"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(transaction)}
                      className="rounded-xl border border-[var(--card-border)] p-2 text-[var(--muted-text)] transition hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                    >
                      <Edit3 size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setPendingDeleteId(transaction.id)
                      }
                      className="rounded-xl border border-rose-200 p-2 text-rose-600 transition hover:bg-rose-50"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatedCard>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDeleteId)}
        title="Delete transaction?"
        description="This transaction will be permanently removed from your ledger."
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />
    </motion.main>
  );
}

export default Transactions;
