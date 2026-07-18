import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Briefcase,
  Calendar,
  Clapperboard,
  Edit3,
  GraduationCap,
  Heart,
  Landmark,
  Plus,
  PiggyBank,
  Plane,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
  Utensils,
  Wallet,
} from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import ConfirmDialog from "../components/ui/ConfirmDialog";
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
  category: "Food",
  customCategory: "",
  date: "",
};

const incomeCategories = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Bonus",
  "Other",
];

const expenseCategories = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Entertainment",
  "Healthcare",
  "Education",
  "Savings",
  "Other",
];

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
    icon: Wallet,
    className: "bg-[var(--success-soft)] text-[var(--success)]",
  },
  Freelance: {
    icon: Briefcase,
    className: "bg-[var(--info-soft)] text-[var(--info)]",
  },
  Business: {
    icon: Landmark,
    className: "bg-[var(--primary-soft)] text-[var(--primary)]",
  },
  Investment: {
    icon: Landmark,
    className: "bg-[var(--success-soft)] text-[var(--success)]",
  },
  Bonus: {
    icon: Sparkles,
    className: "bg-[var(--warning-soft)] text-[var(--warning)]",
  },
};

const getCategoryMeta = (category) =>
  categoryMeta[category] || {
    icon: Tag,
    className: "bg-[var(--muted-bg)] text-[var(--muted-text)]",
  };

const getTypeMeta = (type) => {
  if (type === "income") {
    return {
      label: "Income",
      prefix: "+",
      amountLabel: "Inflow",
      icon: ArrowUpRight,
      badgeClassName: "bg-[var(--success-soft)] text-[var(--success)]",
      iconClassName: "bg-[var(--success-soft)] text-[var(--success)]",
      amountClassName: "text-[var(--success)]",
    };
  }

  return {
    label: "Expense",
    prefix: "−",
    amountLabel: "Outflow",
    icon: ArrowDownRight,
    badgeClassName: "bg-[var(--danger-soft)] text-[var(--danger)]",
    iconClassName: "bg-[var(--danger-soft)] text-[var(--danger)]",
    amountClassName: "text-[var(--danger)]",
  };
};

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
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
    const { name, value } = e.target;

    if (name === "type") {
      setFormData({
        ...formData,
        type: value,
        category: value === "income" ? "Salary" : "Food",
        customCategory: "",
      });

      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const finalCategory =
      formData.category === "Other"
        ? formData.customCategory.trim()
        : formData.category;

    if (!finalCategory) {
      notifyWarning("Please enter a custom category.");
      return;
    }

    const payload = {
      ...formData,
      category: finalCategory,
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
    const predefinedCategories =
      transaction.type === "income" ? incomeCategories : expenseCategories;

    const isCustom = !predefinedCategories.includes(transaction.category);

    setFormData({
      title: transaction.title,
      amount: transaction.amount,
      type: transaction.type,
      category: isCustom ? "Other" : transaction.category,
      customCategory: isCustom ? transaction.category : "",
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
      className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8"
    >
      <PageHeader
        eyebrow="Cash flow"
        title="Transactions"
        description="Review income and expenses, then keep every movement in your ledger up to date."
        action={(
          <button
            type="submit"
            form="transaction-form"
            className="inline-flex items-center justify-center gap-2 bg-[var(--primary)] px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/15 hover:bg-[var(--primary-hover)]"
          >
            <Plus size={17} />
            {editingId ? "Update transaction" : "Add transaction"}
          </button>
        )}
      />

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(320px,0.72fr)_minmax(0,1.6fr)]">
        <AnimatedCard className="h-fit overflow-hidden p-0 2xl:sticky 2xl:top-6">
          <div className="flex items-start gap-3 border-b border-[var(--card-border)] px-5 py-5">
            <div className="rounded-2xl bg-[var(--primary-soft)] p-3 text-[var(--primary)]">
              {editingId ? <Edit3 size={21} /> : <Plus size={21} />}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                {editingId ? "Editing record" : "New record"}
              </p>
              <h2 className="mt-1 text-lg font-bold tracking-tight text-[var(--text)]">
                {editingId ? "Update transaction" : "Add a transaction"}
              </h2>
              <p className="mt-1 text-sm leading-5 text-[var(--muted-text)]">
                Keep a clear, complete view of your cash flow.
              </p>
            </div>
          </div>

          <form id="transaction-form" onSubmit={handleSubmit} className="space-y-4 p-5">
            <div>
              <label
                htmlFor="transaction-title"
                className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
              >
                Title
              </label>
              <input
                id="transaction-title"
                type="text"
                name="title"
                placeholder="e.g. Weekly groceries"
                value={formData.title}
                onChange={handleChange}
                className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="transaction-amount"
                className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
              >
                Amount
              </label>
              <input
                id="transaction-amount"
                type="number"
                name="amount"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
              <div>
                <label
                  htmlFor="transaction-type"
                  className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
                >
                  Type
                </label>
                <select
                  id="transaction-type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
                >
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="transaction-category"
                  className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
                >
                  Category
                </label>
                <select
                  id="transaction-category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
                >
                  {(formData.type === "income"
                    ? incomeCategories
                    : expenseCategories
                  ).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.category === "Other" && (
              <div>
                <label
                  htmlFor="transaction-custom-category"
                  className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
                >
                  Custom category
                </label>
                <input
                  id="transaction-custom-category"
                  type="text"
                  name="customCategory"
                  placeholder="Enter a category"
                  value={formData.customCategory}
                  onChange={handleChange}
                  className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] px-4 py-3 text-sm outline-none"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="transaction-date"
                className="mb-1.5 block text-sm font-semibold text-[var(--text)]"
              >
                Date
              </label>
              <input
                id="transaction-date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
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
                {editingId ? "Update transaction" : "Add transaction"}
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

        <AnimatedCard className="min-w-0 overflow-hidden p-0">
          <div className="border-b border-[var(--card-border)] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold tracking-tight text-[var(--text)]">
                    Transaction ledger
                  </h2>
                  <span
                    aria-live="polite"
                    aria-atomic="true"
                    className="rounded-full bg-[var(--muted-bg)] px-2.5 py-1 text-xs font-bold text-[var(--muted-text)]"
                  >
                    {filteredTransactions.length} shown
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--muted-text)]">
                  Search and manage every recorded movement.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:w-auto">
                <div className="hidden items-center gap-2 sm:flex" aria-label="Amount legend">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--success)]">
                    <ArrowUpRight size={13} />
                    Income
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--danger)]">
                    <ArrowDownRight size={13} />
                    Expense
                  </span>
                </div>

                <div className="relative w-full sm:w-[300px]">
                  <label htmlFor="transaction-search" className="sr-only">
                    Search transactions
                  </label>
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-text)]"
                    aria-hidden="true"
                  />
                  <input
                    id="transaction-search"
                    type="search"
                    placeholder="Search title, category, or type"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full border border-[var(--card-border)] bg-[var(--input-bg)] py-3 pl-10 pr-4 text-sm outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-4">
            {filteredTransactions.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--card-border)] bg-[var(--muted-bg)] px-6 py-10 text-center">
                <div className="mb-5 rounded-3xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 text-[var(--primary)] shadow-[var(--card-shadow)]">
                  <ReceiptText size={30} strokeWidth={1.7} />
                </div>
                <h3 className="text-lg font-bold text-[var(--text)]">
                  {search ? "No matching transactions" : "Your ledger is ready"}
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--muted-text)]">
                  {search
                    ? "Try a different title, category, type, or date."
                    : "Add your first income or expense to start building a clearer cash-flow picture."}
                </p>
                <a
                  href="#transaction-form"
                  className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/15 transition hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]"
                >
                  <Plus size={16} />
                  Add transaction
                </a>
              </div>
            ) : (
              <>
                <div className="hidden overflow-hidden rounded-2xl border border-[var(--card-border)] lg:block">
                  <div className="max-h-[620px] overflow-auto">
                    <table className="w-full min-w-[700px] table-fixed text-left">
                      <thead className="z-10 bg-[var(--muted-bg)] text-[var(--muted-text)]">
                        <tr>
                          <th scope="col" className="w-[35%] px-5 py-3.5 text-left">
                            Transaction
                          </th>
                          <th scope="col" className="w-[20%] px-4 py-3.5 text-left">
                            Category
                          </th>
                          <th scope="col" className="w-[15%] px-4 py-3.5 text-left">
                            Type
                          </th>
                          <th scope="col" className="w-[19%] px-4 py-3.5 text-right">
                            Amount
                          </th>
                          <th scope="col" className="w-[11%] px-5 py-3.5 text-right">
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--card-border)]">
                        {filteredTransactions.map((transaction) => {
                          const category = getCategoryMeta(transaction.category);
                          const CategoryIcon = category.icon;
                          const type = getTypeMeta(transaction.type);
                          const TypeIcon = type.icon;

                          return (
                            <motion.tr
                              key={transaction.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.22 }}
                              className="group"
                            >
                              <td className="px-5 py-4">
                                <p className="truncate font-semibold text-[var(--text)]">
                                  {transaction.title}
                                </p>
                                <time
                                  dateTime={transaction.date || undefined}
                                  className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--muted-text)]"
                                >
                                  <Calendar size={14} aria-hidden="true" />
                                  {transaction.date || "No date"}
                                </time>
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${category.className}`}
                                >
                                  <CategoryIcon size={14} aria-hidden="true" />
                                  <span className="truncate">
                                    {transaction.category || "Uncategorized"}
                                  </span>
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${type.badgeClassName}`}
                                >
                                  <TypeIcon size={14} aria-hidden="true" />
                                  {type.label}
                                </span>
                              </td>
                              <td className="px-4 py-4 text-right">
                                <div className={`inline-flex items-center gap-2 ${type.amountClassName}`}>
                                  <span className={`rounded-xl p-1.5 ${type.iconClassName}`}>
                                    <TypeIcon size={15} aria-hidden="true" />
                                  </span>
                                  <div className="text-right">
                                    <p className="font-bold tabular-nums">
                                      {type.prefix}
                                      {formatCurrency(transaction.amount)}
                                    </p>
                                    <p className="mt-0.5 text-[11px] font-medium text-[var(--muted-text)]">
                                      {type.amountLabel}
                                    </p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEdit(transaction)}
                                    className="inline-flex items-center justify-center border border-[var(--card-border)] p-2 text-[var(--muted-text)] hover:-translate-y-0.5 hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                                    aria-label={`Edit ${transaction.title}`}
                                    title="Edit transaction"
                                  >
                                    <Edit3 size={16} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPendingDeleteId(transaction.id)}
                                    className="inline-flex items-center justify-center border border-rose-200 p-2 text-rose-600 hover:-translate-y-0.5 hover:bg-rose-50"
                                    aria-label={`Delete ${transaction.title}`}
                                    title="Delete transaction"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="grid gap-3 lg:hidden">
                  {filteredTransactions.map((transaction) => {
                    const category = getCategoryMeta(transaction.category);
                    const CategoryIcon = category.icon;
                    const type = getTypeMeta(transaction.type);
                    const TypeIcon = type.icon;

                    return (
                      <motion.article
                        key={transaction.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.22 }}
                        className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-[var(--card-shadow)] transition hover:border-[color-mix(in_srgb,var(--primary)_22%,var(--card-border))] hover:shadow-[var(--card-shadow-hover)]"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-[var(--text)]">
                              {transaction.title}
                            </p>
                            <time
                              dateTime={transaction.date || undefined}
                              className="mt-1.5 flex items-center gap-1.5 text-sm text-[var(--muted-text)]"
                            >
                              <Calendar size={14} aria-hidden="true" />
                              {transaction.date || "No date"}
                            </time>
                          </div>
                          <div className={`shrink-0 text-right ${type.amountClassName}`}>
                            <p className="font-bold tabular-nums">
                              {type.prefix}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="mt-0.5 text-[11px] font-medium text-[var(--muted-text)]">
                              {type.amountLabel}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${category.className}`}
                          >
                            <CategoryIcon size={14} aria-hidden="true" />
                            <span className="truncate">
                              {transaction.category || "Uncategorized"}
                            </span>
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold ${type.badgeClassName}`}
                          >
                            <TypeIcon size={14} aria-hidden="true" />
                            {type.label}
                          </span>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[var(--card-border)] pt-3">
                          <span className="text-xs font-medium text-[var(--muted-text)]">
                            Transaction record
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(transaction)}
                              className="inline-flex items-center justify-center border border-[var(--card-border)] p-2 text-[var(--muted-text)] hover:-translate-y-0.5 hover:bg-[var(--muted-bg)] hover:text-[var(--text)]"
                              aria-label={`Edit ${transaction.title}`}
                              title="Edit transaction"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(transaction.id)}
                              className="inline-flex items-center justify-center border border-rose-200 p-2 text-rose-600 hover:-translate-y-0.5 hover:bg-rose-50"
                              aria-label={`Delete ${transaction.title}`}
                              title="Delete transaction"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              </>
            )}
          </div>
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
