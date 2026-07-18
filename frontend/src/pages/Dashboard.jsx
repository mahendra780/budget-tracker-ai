import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Lightbulb,
  PiggyBank,
  ReceiptText,
  Sparkles,
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
import { useAuth } from "../context/AuthContext";
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
  "#4F46E5",
  "#0F9F82",
  "#2583D8",
  "#DC3D57",
  "#A855F7",
  "#D97706",
];

const quickActions = [
  {
    label: "Add transaction",
    description: "Record income or spending",
    to: "/transactions",
    icon: ReceiptText,
    tone: "primary",
  },
  {
    label: "Create budget",
    description: "Set a category limit",
    to: "/budgets",
    icon: CircleDollarSign,
    tone: "warning",
  },
  {
    label: "Add a goal",
    description: "Plan your next milestone",
    to: "/goals",
    icon: Target,
    tone: "success",
  },
];

const greetingForCurrentTime = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

const formatTransactionDate = (value) => {
  if (!value) return "No date";

  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

function Dashboard() {
  const { user } = useAuth();
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
  const userName = user?.full_name?.split(" ")[0] || "there";
  const dashboardDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="px-4 py-6 sm:px-6 sm:py-7 lg:px-8"
    >
      <AnimatedCard className="relative mb-6 overflow-hidden p-5 sm:p-6 lg:p-7">
        <div className="pointer-events-none absolute -right-18 -top-24 h-64 w-64 rounded-full bg-[#FFF4EC] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-1/3 h-28 w-28 rounded-full bg-[#EAFBF8] blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[var(--muted-text)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--card-border)] bg-[var(--muted-bg)] px-3 py-1.5">
                <CalendarDays size={14} className="text-[#F97316]" />
                {dashboardDate}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAFBF8] px-3 py-1.5 text-[#0F766E]">
                <Sparkles size={14} />
                Financial overview
              </span>
            </div>

            <p className="mt-5 text-sm font-semibold text-[#F97316]">
              {greetingForCurrentTime()}, {userName}
              <span aria-hidden="true"> &#128075;</span>
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">
              Your money, clearly in focus.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted-text)]">
              Here&apos;s your financial overview for today. Track your
              spending, protect your budgets, and keep moving toward your
              goals.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:w-auto sm:min-w-74">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium text-[var(--muted-text)]">
                Active budgets
              </p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--text)]">
                {budgets.length}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)]/80 p-4 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-medium text-[var(--muted-text)]">
                Savings goals
              </p>
              <p className="mt-1.5 text-2xl font-bold tracking-tight text-[var(--text)]">
                {goals.length}
              </p>
            </div>
          </div>
        </div>
      </AnimatedCard>

      <section
        className="grid auto-rows-fr gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Financial summary"
      >
        <StatCard
          title="Total Balance"
          value={summary.balance}
          icon={Wallet}
          tone="primary"
          helper="Available after expenses and goals"
          delay={0.02}
        />
        <StatCard
          title="Total Income"
          value={summary.total_income}
          icon={ArrowUpRight}
          tone="success"
          helper="All recorded inflows"
          delay={0.06}
        />
        <StatCard
          title="Total Expenses"
          value={summary.total_expense}
          icon={ArrowDownRight}
          tone="danger"
          helper="All recorded outflows"
          delay={0.1}
        />
        <StatCard
          title="Savings"
          value={summary.goal_savings}
          icon={PiggyBank}
          tone="secondary"
          helper="Allocated across your goals"
          delay={0.14}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-5" aria-label="Spending charts">
        <ChartCard
          title="Expense Breakdown"
          description="How your spending is distributed by category"
          className="xl:col-span-2"
        >
          <div className="h-76 sm:h-80">
            {isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : expenseBreakdown.length === 0 ? (
              <EmptyState
                icon={TrendingDown}
                title="No expense data yet"
                description="Add transactions to generate category analytics."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseBreakdown}
                    dataKey="amount"
                    nameKey="category"
                    innerRadius={60}
                    outerRadius={102}
                    paddingAngle={3}
                  >
                    {expenseBreakdown.map((_, index) => (
                      <Cell
                        key={index}
                        fill={CHART_COLORS[index % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      border: "1px solid var(--card-border)",
                      borderRadius: "12px",
                      background: "var(--card-bg)",
                      boxShadow: "var(--card-shadow)",
                    }}
                    itemStyle={{ color: "var(--text)" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Monthly Expense Trend"
          description="Your spending movement over time"
          className="xl:col-span-3"
        >
          <div className="h-76 sm:h-80">
            {isLoading ? (
              <LoadingSkeleton rows={3} />
            ) : monthlyTrend.length === 0 ? (
              <EmptyState
                icon={TrendingDown}
                title="No trend data yet"
                description="Monthly analytics will appear once expenses are available."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke="var(--card-border)" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "var(--muted-text)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    dy={8}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-text)", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatCurrency(value)}
                  />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid var(--card-border)",
                      borderRadius: "12px",
                      background: "var(--card-bg)",
                      boxShadow: "var(--card-shadow)",
                    }}
                    itemStyle={{ color: "var(--text)" }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#4F46E5"
                    strokeWidth={3}
                    dot={{ r: 3, fill: "#0F9F82", strokeWidth: 2, stroke: "var(--card-bg)" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-5" aria-label="Recent activity and insights">
        <ChartCard
          title="Recent Transactions"
          description="Latest activity from your transaction ledger"
          className="xl:col-span-3"
        >
          {recentTransactions.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="No recent transactions"
              description="Start tracking your expenses and income to see activity here."
            />
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[var(--card-border)]">
              {recentTransactions.map((transaction) => {
                const isIncome = transaction.type === "income";

                return (
                  <div
                    key={transaction.id}
                    className="grid gap-3 border-b border-[var(--card-border)] px-4 py-4 transition-colors last:border-b-0 hover:bg-[var(--muted-bg)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[var(--text)]">
                        {transaction.title}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-[var(--muted-bg)] px-2.5 py-1 text-[11px] font-semibold capitalize text-[var(--muted-text)]">
                          {transaction.category}
                        </span>
                        <span className={`text-xs font-medium ${isIncome ? "text-[#0F766E]" : "text-rose-600"}`}>
                          {isIncome ? "Income" : "Expense"}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-medium text-[var(--muted-text)] sm:text-right">
                      {formatTransactionDate(transaction.date)}
                    </p>
                    <p className={`font-bold tabular-nums sm:text-right ${isIncome ? "text-[#0F766E]" : "text-rose-600"}`}>
                      {isIncome ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="AI Insights"
          description="Signals and recommendations from your spending data"
          className="xl:col-span-2"
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-[var(--card-border)] bg-[#FFF4EC] p-4">
              <div className="flex items-center gap-2 text-[#F97316]">
                <BrainCircuit size={18} />
                <p className="text-xs font-bold uppercase tracking-[0.1em]">
                  Spending observation
                </p>
              </div>
              {topCategory && !topCategory.message ? (
                <div className="mt-3">
                  <p className="text-lg font-bold capitalize text-[var(--text)]">
                    {topCategory.top_category}
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-text)]">
                    {formatCurrency(topCategory.amount)} is your highest recorded spend.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--muted-text)]">
                  No top spending category is available yet.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--card-border)] bg-[#EAFBF8] p-4">
              <div className="flex items-center gap-2 text-[#0F766E]">
                <Sparkles size={18} />
                <p className="text-xs font-bold uppercase tracking-[0.1em]">
                  Insight
                </p>
              </div>
              <div className="mt-3 space-y-2">
                {aiSummary.length === 0 ? (
                  <p className="text-sm leading-6 text-[var(--muted-text)]">
                    Your financial summary will appear as spending patterns emerge.
                  </p>
                ) : (
                  aiSummary.slice(0, 2).map((item, index) => (
                    <p key={index} className="text-sm leading-6 text-[var(--muted-text)]">
                      {item}
                    </p>
                  ))
                )}
              </div>
            </div>

            {recommendations.length === 0 ? (
              <EmptyState
                icon={Bot}
                title="No recommendations"
                description="Recommendations will show here as spending patterns emerge."
              />
            ) : (
              recommendations.slice(0, 2).map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ y: -2 }}
                  className="rounded-2xl border border-[var(--card-border)] bg-[var(--muted-bg)] p-4 transition-shadow duration-200 hover:shadow-sm"
                >
                  <div className="flex items-center gap-2 text-[var(--text)]">
                    <Lightbulb size={17} className="text-[#F97316]" />
                    <p className="text-xs font-bold uppercase tracking-[0.1em]">
                      {item.type === "warning" ? "Budget recommendation" : "Recommendation"}
                    </p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted-text)]">
                    {item.message}
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </ChartCard>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3" aria-label="Financial planning">
        <ChartCard
          title="Category Statistics"
          description="Your highest spending categories"
        >
          <div className="space-y-4">
            {expenseBreakdown.length === 0 ? (
              <EmptyState
                icon={ReceiptText}
                title="No category statistics"
                description="Your category mix will show here."
              />
            ) : (
              expenseBreakdown.slice(0, 6).map((item) => {
                const percentage =
                  summary.total_expense > 0
                    ? (Number(item.amount || 0) / Number(summary.total_expense)) * 100
                    : 0;

                return (
                  <div key={item.category}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold capitalize text-[var(--text)]">
                        {item.category}
                      </span>
                      <span className="tabular-nums text-[var(--muted-text)]">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                    <ProgressBar value={percentage} tone="primary" height="h-2" />
                  </div>
                );
              })
            )}
          </div>
        </ChartCard>

        <ChartCard
          title="Budget Overview"
          description={`${budgets.length} active budgets, ${overBudgetCount} over budget`}
        >
          <div className="space-y-3">
            {budgets.length === 0 ? (
              <EmptyState
                icon={CircleDollarSign}
                title="No budgets yet"
                description="Create budgets to monitor utilization."
              />
            ) : (
              budgets.slice(0, 5).map((budget) => {
                const percentage = Number(budget.percentage_used || 0);
                const isOverBudget = percentage > 100;
                const remaining = Number(budget.limit || 0) - Number(budget.spent || 0);

                return (
                  <div key={budget.id} className="rounded-2xl border border-[var(--card-border)] bg-[var(--muted-bg)] p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold capitalize text-[var(--text)]">
                          {budget.category}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-text)]">
                          {formatCurrency(budget.spent)} spent
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${isOverBudget ? "bg-rose-100 text-rose-700" : "bg-[#EAFBF8] text-[#0F766E]"}`}>
                        {isOverBudget ? "Over budget" : "On track"}
                      </span>
                    </div>
                    <ProgressBar value={percentage} tone={isOverBudget ? "danger" : "secondary"} height="h-2" />
                    <div className="mt-2.5 flex justify-between text-xs text-[var(--muted-text)]">
                      <span>{percentage.toFixed(0)}% used</span>
                      <span>{isOverBudget ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left`}</span>
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
          <div className="space-y-3">
            {goals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No goals yet"
                description="Create goals to track savings progress."
              />
            ) : (
              goals.slice(0, 5).map((goal) => {
                const progress = Number(goal.progress_percentage || 0);
                const isComplete = progress >= 100;

                return (
                  <div key={goal.id} className="rounded-2xl border border-[var(--card-border)] bg-[var(--muted-bg)] p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--text)]">
                          {goal.goal_name}
                        </p>
                        <p className="mt-1 text-xs text-[var(--muted-text)]">
                          {formatCurrency(goal.current_amount)} saved
                        </p>
                      </div>
                      {isComplete && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#EAFBF8] px-2.5 py-1 text-[11px] font-bold text-[#0F766E]">
                          <CheckCircle2 size={13} />
                          Complete
                        </span>
                      )}
                    </div>
                    <ProgressBar value={progress} tone={isComplete ? "success" : "primary"} height="h-2" />
                    <div className="mt-2.5 flex justify-between text-xs text-[var(--muted-text)]">
                      <span>{progress.toFixed(0)}% complete</span>
                      <span>{formatCurrency(goal.remaining_amount)} left</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ChartCard>
      </section>

      <section className="mt-6" aria-labelledby="quick-actions-title">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#F97316]">
              Keep moving
            </p>
            <h2 id="quick-actions-title" className="mt-1 text-lg font-bold tracking-tight text-[var(--text)]">
              Quick actions
            </h2>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            const toneClasses = {
              primary: "bg-[#FFF4EC] text-[#F97316]",
              warning: "bg-[var(--warning-soft)] text-[var(--warning)]",
              success: "bg-[#EAFBF8] text-[#0F766E]",
            };

            return (
              <Link
                key={action.to}
                to={action.to}
                className="group flex items-center gap-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg)] p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[action.tone]}`}>
                  <Icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--text)]">
                    {action.label}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted-text)]">
                    {action.description}
                  </span>
                </span>
                <ArrowRight size={18} className="shrink-0 text-[var(--subtle-text)] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#F97316]" />
              </Link>
            );
          })}
        </div>
      </section>
    </motion.main>
  );
}

export default Dashboard;
