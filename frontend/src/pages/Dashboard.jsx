import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleDollarSign,
  PiggyBank,
  ReceiptText,
  Target,
  TrendingDown,
  Wallet,
} from "lucide-react";
import {
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AnimatedCard from "../components/ui/AnimatedCard";
import ChartCard from "../components/ui/ChartCard";
import EmptyState from "../components/ui/EmptyState";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import ProgressBar from "../components/ui/ProgressBar";
import StatCard from "../components/ui/StatCard";
import {
  getRecommendations,
  getMonthlyTrend,
  getSpendingBreakdown,
  getSummary as getAiSummary,
  getTopCategory,
} from "../services/aiService";
import { getBudgetStatus } from "../services/budgetService";
import { getSummary } from "../services/dashboardService";
import { getGoalProgress } from "../services/goalService";
import { getTransactions } from "../services/transactionService";
import { formatCurrency } from "../utils/formatters";
import { notifyError } from "../utils/notifications";

const CHART_COLORS = [
  "#F97316",
  "#14B8A6",
  "#6366F1",
  "#EF4444",
  "#A855F7",
  "#84CC16",
];

function Dashboard() {
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    goal_savings: 0,
    balance: 0,
  });
  const [topCategory, setTopCategory] = useState(null);
  const [expenseBreakdown, setExpenseBreakdown] =
    useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [aiSummary, setAiSummary] = useState([]);
  const [recommendations, setRecommendations] =
    useState([]);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      getSummary(),
      getTopCategory(),
      getSpendingBreakdown(),
      getMonthlyTrend(),
      getAiSummary(),
      getRecommendations(),
      getBudgetStatus(),
      getGoalProgress(),
      getTransactions(),
    ])
      .then(([
        summaryData,
        topCategoryData,
        breakdownData,
        trendData,
        aiSummaryData,
        recommendationsData,
        budgetData,
        goalData,
        transactionData,
      ]) => {
        if (isMounted) {
          setSummary(summaryData);
          setTopCategory(topCategoryData);
          setExpenseBreakdown(breakdownData);
          setMonthlyTrend(trendData);
          setAiSummary(aiSummaryData.summary || []);
          setRecommendations(recommendationsData);
          setBudgets(budgetData);
          setGoals(goalData);
          setTransactions(transactionData);
        }
      })
      .catch((error) => {
        if (isMounted) {
          notifyError(
            error,
            "Failed to load financial dashboard."
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => {
        const dateDiff =
          new Date(b.date || 0) - new Date(a.date || 0);

        if (dateDiff !== 0) return dateDiff;

        return Number(b.id || 0) - Number(a.id || 0);
      })
      .slice(0, 6);
  }, [transactions]);

  const overBudgetCount = budgets.filter(
    (budget) => Number(budget.percentage_used || 0) > 100
  ).length;

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
      <AnimatedCard className="mb-6 overflow-hidden p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#F97316]">
              Portfolio-ready fintech dashboard
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight text-[var(--text)]">
              Your finances, budgets, goals, and AI signals
              in one focused workspace.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted-text)]">
              Monitor income, spending behavior, goal momentum,
              and budget utilization without switching contexts.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-[#FFF4EC] p-4">
              <p className="text-sm font-semibold text-[#F97316]">
                Active budgets
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {budgets.length}
              </p>
            </div>
            <div className="rounded-3xl bg-[#EAFBF8] p-4">
              <p className="text-sm font-semibold text-[#0F766E]">
                Savings goals
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-950">
                {goals.length}
              </p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Available Balance"
          value={summary.balance}
          icon={Wallet}
          tone="primary"
          helper="Income minus expenses and goals"
          delay={0.02}
        />
        <StatCard
          title="Total Income"
          value={summary.total_income}
          icon={ArrowUpRight}
          tone="success"
          helper="Recorded inflows"
          delay={0.06}
        />
        <StatCard
          title="Total Expense"
          value={summary.total_expense}
          icon={ArrowDownRight}
          tone="danger"
          helper="Recorded outflows"
          delay={0.1}
        />
        <StatCard
          title="Goal Savings"
          value={summary.goal_savings}
          icon={PiggyBank}
          tone="secondary"
          helper="Saved across goals"
          delay={0.14}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-5">
        <ChartCard
          title="Expense Breakdown"
          description="Category distribution across spending"
          className="xl:col-span-2"
        >
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="h-80"
          >
            {isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : expenseBreakdown.length === 0 ? (
              <EmptyState
                icon={TrendingDown}
                title="No expense data"
                description="Add transactions to generate category analytics."
              />
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={58}
                    outerRadius={104}
                    paddingAngle={3}
                  >
                    {expenseBreakdown.map((_, index) => (
                      <Cell
                        key={index}
                        fill={
                          CHART_COLORS[
                            index % CHART_COLORS.length
                          ]
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </ChartCard>

        <ChartCard
          title="Monthly Expense Trend"
          description="Month-by-month spending movement"
          className="xl:col-span-3"
        >
          <motion.div
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            className="h-80"
          >
            {isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : monthlyTrend.length === 0 ? (
              <EmptyState
                icon={TrendingDown}
                title="No trend data"
                description="Monthly analytics will appear once expenses are available."
              />
            ) : (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <LineChart data={monthlyTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(156, 163, 175, 0.28)"
                  />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#F97316"
                    strokeWidth={3}
                    dot={{
                      r: 4,
                      fill: "#14B8A6",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <ChartCard
          title="Category Statistics"
          description="Top spending categories"
        >
          <div className="space-y-4">
            {expenseBreakdown.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="No category stats"
                description="Your category mix will show here."
              />
            ) : (
              expenseBreakdown.slice(0, 6).map((item) => {
                const percentage =
                  summary.total_expense > 0
                    ? (Number(item.amount || 0) /
                        Number(summary.total_expense)) *
                      100
                    : 0;

                return (
                  <div key={item.category}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold capitalize text-[var(--text)]">
                        {item.category}
                      </span>
                      <span className="text-[var(--muted-text)]">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <ProgressBar
                      value={percentage}
                      tone="primary"
                    />
                  </div>
                );
              })
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="AI Insights"
          description="Spending intelligence and recommendations"
          className="lg:col-span-2"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl bg-[#FFF4EC] p-5">
              <div className="flex items-center gap-3 text-[#F97316]">
                <BrainCircuit size={22} />
                <p className="text-sm font-bold">
                  Top Spending Category
                </p>
              </div>
              {topCategory && !topCategory.message ? (
                <>
                  <p className="mt-4 text-3xl font-bold capitalize text-slate-950">
                    {topCategory.top_category}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatCurrency(topCategory.amount)} total
                    spent
                  </p>
                </>
              ) : (
                <p className="mt-4 text-sm text-slate-600">
                  No top category available yet.
                </p>
              )}
            </div>

            <div className="rounded-3xl bg-[#EAFBF8] p-5">
              <div className="flex items-center gap-3 text-[#0F766E]">
                <Bot size={22} />
                <p className="text-sm font-bold">
                  AI Financial Summary
                </p>
              </div>
              <div className="mt-4 space-y-2">
                {aiSummary.length === 0 ? (
                  <p className="text-sm text-slate-600">
                    No AI summary available yet.
                  </p>
                ) : (
                  aiSummary.slice(0, 3).map((item, index) => (
                    <p
                      key={index}
                      className="text-sm leading-6 text-slate-700"
                    >
                      {item}
                    </p>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {recommendations.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No recommendations"
                description="AI recommendations will show here as spending patterns emerge."
              />
            ) : (
              recommendations
                .slice(0, 4)
                .map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{
                      scale: 1.01,
                    }}
                    className="rounded-3xl border border-[var(--card-border)] bg-[var(--muted-bg)] p-4 text-sm leading-6 text-[var(--text)]"
                  >
                    {item.message}
                  </motion.div>
                ))
            )}
          </div>
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Budget Overview"
          description={`${budgets.length} active budgets, ${overBudgetCount} over budget`}
        >
          <div className="space-y-4">
            {budgets.length === 0 ? (
              <EmptyState
                icon={CircleDollarSign}
                title="No budgets yet"
                description="Create budgets to monitor utilization."
              />
            ) : (
              budgets.slice(0, 5).map((budget) => {
                const percentage = Number(
                  budget.percentage_used || 0
                );
                const isOverBudget = percentage > 100;
                const remaining =
                  Number(budget.limit || 0) -
                  Number(budget.spent || 0);

                return (
                  <div
                    key={budget.id}
                    className="rounded-3xl border border-[var(--card-border)] bg-[var(--muted-bg)] p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold capitalize text-[var(--text)]">
                          {budget.category}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-text)]">
                          {formatCurrency(budget.spent)} spent
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          isOverBudget
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isOverBudget ? "Over budget" : "On track"}
                      </span>
                    </div>
                    <ProgressBar
                      value={percentage}
                      tone={isOverBudget ? "danger" : "secondary"}
                    />
                    <div className="mt-3 flex justify-between text-xs text-[var(--muted-text)]">
                      <span>{percentage.toFixed(0)}% used</span>
                      <span>
                        {isOverBudget
                          ? `${formatCurrency(Math.abs(remaining))} over`
                          : `${formatCurrency(remaining)} left`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Goals Overview"
          description="Savings momentum and completion status"
        >
          <div className="space-y-4">
            {goals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No goals yet"
                description="Create goals to track savings progress."
              />
            ) : (
              goals.slice(0, 5).map((goal) => {
                const progress = Number(
                  goal.progress_percentage || 0
                );
                const isComplete = progress >= 100;

                return (
                  <div
                    key={goal.id}
                    className="rounded-3xl border border-[var(--card-border)] bg-[var(--muted-bg)] p-4"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-[var(--text)]">
                          {goal.goal_name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted-text)]">
                          {formatCurrency(goal.current_amount)}
                          {" saved"}
                        </p>
                      </div>
                      {isComplete && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                          <CheckCircle2 size={14} />
                          Complete
                        </span>
                      )}
                    </div>
                    <ProgressBar
                      value={progress}
                      tone={isComplete ? "success" : "primary"}
                    />
                    <div className="mt-3 flex justify-between text-xs text-[var(--muted-text)]">
                      <span>{progress.toFixed(0)}% complete</span>
                      <span>
                        {formatCurrency(goal.remaining_amount)}
                        {" left"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ChartCard>
      </section>

      <ChartCard
        title="Recent Transactions"
        description="Latest movement from your transaction ledger"
        className="mt-6"
      >
        {recentTransactions.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No recent transactions"
            description="New activity will appear here."
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-[var(--card-border)]">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="grid gap-3 border-b border-[var(--card-border)] p-4 last:border-b-0 sm:grid-cols-[1fr_auto_auto]"
              >
                <div>
                  <p className="font-bold text-[var(--text)]">
                    {transaction.title}
                  </p>
                  <p className="mt-1 text-sm capitalize text-[var(--muted-text)]">
                    {transaction.category} / {transaction.type}
                  </p>
                </div>
                <p className="text-sm text-[var(--muted-text)] sm:text-right">
                  {transaction.date || "No date"}
                </p>
                <p
                  className={`font-bold sm:text-right ${
                    transaction.type === "income"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </motion.main>
  );
}

export default Dashboard;
