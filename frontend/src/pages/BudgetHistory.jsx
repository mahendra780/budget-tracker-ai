import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { History, WalletCards } from "lucide-react";

import AnimatedCard from "../components/ui/AnimatedCard";
import EmptyState from "../components/ui/EmptyState";
import PageHeader from "../components/ui/PageHeader";
import { getBudgetHistory } from "../services/budgetService";
import { formatCurrency } from "../utils/formatters";
import { notifyError } from "../utils/notifications";

function BudgetHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    let isMounted = true;

    getBudgetHistory()
      .then((data) => {
        if (isMounted) {
          setHistory(data);
        }
      })
      .catch((error) => {
        if (isMounted) {
          notifyError(
            error,
            "Failed to load budget history."
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

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
        eyebrow="Monthly records"
        title="Budget History"
        description="Review budget limits and spending by month."
      />

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          title="No budget history"
          description="Monthly budget records will appear here."
        />
      ) : (
        <AnimatedCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[var(--card-border)] bg-[var(--muted-bg)] text-xs uppercase tracking-[0.12em] text-[var(--muted-text)]">
                <tr>
                  <th scope="col" className="px-5 py-4">Month</th>
                  <th scope="col" className="px-5 py-4">Category</th>
                  <th scope="col" className="px-5 py-4 text-right">Limit</th>
                  <th scope="col" className="px-5 py-4 text-right">Spent</th>
                  <th scope="col" className="px-5 py-4 text-right">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr
                    key={`${item.period}-${item.category}`}
                    className="border-b border-[var(--card-border)] last:border-b-0"
                  >
                    <td className="px-5 py-4 font-semibold text-[var(--text)]">
                      {item.period}
                    </td>
                    <td className="px-5 py-4 capitalize text-[var(--text)]">
                      <span className="inline-flex items-center gap-2">
                        <WalletCards
                          size={16}
                          className="text-[var(--primary)]"
                        />
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-[var(--muted-text)]">
                      {formatCurrency(item.limit)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-[var(--muted-text)]">
                      {formatCurrency(item.spent)}
                    </td>
                    <td className={`px-5 py-4 text-right font-semibold tabular-nums ${
                      Number(item.remaining) < 0
                        ? "text-[var(--danger)]"
                        : "text-[var(--success)]"
                    }`}>
                      {formatCurrency(item.remaining)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      )}
    </motion.main>
  );
}

export default BudgetHistory;
