import { useMemo } from "react";
import { useStore } from "../store/useStore";
import {
  getFinancialCycle,
  parseLocalDate,
  todayISO,
  addDaysISO,
  amountInBase,
  type FinancialCycle,
} from "../lib/utils";

// ── Insight Types ──────────────────────────────────────────────────

export type InsightSeverity = "bad" | "warn" | "good" | "info";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  icon: string; // lucide icon name
}

export interface CycleStats {
  cycle: FinancialCycle;
  prevCycle: FinancialCycle;
  income: number;
  expenses: number;
  prevIncome: number;
  prevExpenses: number;
  savingsRate: number;
  avgDailySpend: number;
  projectedSpend: number;
  topCategory: string;
  topCategoryAmount: number;
  prevTopCategoryAmount: number;
  biggestExpense: { amount: number; note: string; category: string } | null;
  thisWeekSpend: number;
  lastWeekSpend: number;
  weekChangePercent: number;
  netWorthChange30d: number;
  overdueBills: number;
  upcomingBills7d: number;
  overdueIous: number;
  nearestGoal: { name: string; percent: number; daysLeft: number } | null;
  backupNeeded: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  bad: 0,
  warn: 1,
  good: 2,
  info: 3,
};

function getWeekStart(
  date: Date,
  weekStartsOn: "sunday" | "monday" | "saturday",
): Date {
  const dayMap = { sunday: 0, monday: 1, saturday: 6 };
  const target = dayMap[weekStartsOn];
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = (d.getDay() - target + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

// ── Main Hook ──────────────────────────────────────────────────────

export function useDashboardInsights() {
  const {
    transactions,
    accounts,
    budgets,
    recurring,
    savingsGoals,
    ious,
    settings,
    isBackupNeeded,
    monthlyBudgetTarget,
    exchangeRates,
  } = useStore();

  return useMemo(() => {
    const today = new Date();
    const todayStr = todayISO();
    const startDay = settings.monthStartsOnDay ?? 1;

    // ── Financial Cycles ─────────────────────────────────────────

    const cycle = getFinancialCycle(today, startDay);

    // Previous cycle: get cycle for the day before current cycle start
    const prevRefDate = new Date(
      parseLocalDate(cycle.startDate).getTime() - 864e5,
    );
    const prevCycle = getFinancialCycle(prevRefDate, startDay);

    // ── Currency conversion helper ───────────────────────────────
    const toBase = (amount: number, accountId: string) => {
      const acc = accounts.find((a) => a.id === accountId);
      return amountInBase(amount, acc, exchangeRates);
    };

    // ── Filter transactions ──────────────────────────────────────

    const cycleExpenses = transactions.filter(
      (tx) =>
        tx.type === "expense" &&
        cycle.isDateInCycle(tx.date) &&
        !tx.isIou,
    );

    const cycleIncome = transactions.filter(
      (tx) =>
        tx.type === "income" &&
        cycle.isDateInCycle(tx.date) &&
        !tx.isIou,
    );

    const prevCycleExpenses = transactions.filter(
      (tx) =>
        tx.type === "expense" &&
        prevCycle.isDateInCycle(tx.date) &&
        !tx.isIou,
    );

    const prevCycleIncome = transactions.filter(
      (tx) =>
        tx.type === "income" &&
        prevCycle.isDateInCycle(tx.date) &&
        !tx.isIou,
    );

    // ── Basic Metrics ────────────────────────────────────────────

    const income = cycleIncome.reduce(
      (s, tx) => s + toBase(tx.amount, tx.accountId),
      0,
    );
    const expenses = cycleExpenses.reduce(
      (s, tx) => s + toBase(tx.amount, tx.accountId),
      0,
    );
    const prevIncome = prevCycleIncome.reduce(
      (s, tx) => s + toBase(tx.amount, tx.accountId),
      0,
    );
    const prevExpenses = prevCycleExpenses.reduce(
      (s, tx) => s + toBase(tx.amount, tx.accountId),
      0,
    );

    const savingsRate =
      income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

    const daysElapsed = Math.max(1, cycle.currentDayInCycle);
    const avgDailySpend = expenses / daysElapsed;
    const projectedSpend = avgDailySpend * cycle.totalDays;

    // ── Category analysis ────────────────────────────────────────

    const catSpend: Record<string, number> = {};
    for (const tx of cycleExpenses) {
      if (!tx.isReconciliation) {
        catSpend[tx.category] =
          (catSpend[tx.category] ?? 0) + toBase(tx.amount, tx.accountId);
      }
    }
    const sortedCats = Object.entries(catSpend).sort((a, b) => b[1] - a[1]);
    const topCategory = sortedCats[0]?.[0] ?? "";
    const topCategoryAmount = sortedCats[0]?.[1] ?? 0;

    const prevCatSpend: Record<string, number> = {};
    for (const tx of prevCycleExpenses) {
      if (!tx.isReconciliation) {
        prevCatSpend[tx.category] =
          (prevCatSpend[tx.category] ?? 0) + toBase(tx.amount, tx.accountId);
      }
    }
    const prevTopCategoryAmount = prevCatSpend[topCategory] ?? 0;

    // ── Biggest single expense ───────────────────────────────────

    const biggestExp = cycleExpenses
      .filter((tx) => !tx.isReconciliation)
      .map((tx) => ({
        ...tx,
        baseAmount: toBase(tx.amount, tx.accountId),
      }))
      .sort((a, b) => b.baseAmount - a.baseAmount)[0];

    const biggestExpense = biggestExp
      ? {
          amount: biggestExp.baseAmount,
          note: biggestExp.note || biggestExp.category,
          category: biggestExp.category,
        }
      : null;

    // ── Weekly comparison ────────────────────────────────────────

    const weekStart = getWeekStart(today, settings.weekStartsOn ?? "saturday");
    const lastWeekStart = new Date(weekStart.getTime() - 7 * 864e5);

    const dayOfWeek = Math.max(
      1,
      Math.round((today.getTime() - weekStart.getTime()) / 864e5) + 1,
    );

    // This week spend (up to current day)
    const weekStartStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, "0")}-${String(weekStart.getDate()).padStart(2, "0")}`;
    const thisWeekSpend = transactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          !tx.isIou &&
          tx.date >= weekStartStr &&
          tx.date <= todayStr,
      )
      .reduce((s, tx) => s + toBase(tx.amount, tx.accountId), 0);

    // Last week spend (same number of elapsed days)
    const lastWeekStartStr = `${lastWeekStart.getFullYear()}-${String(lastWeekStart.getMonth() + 1).padStart(2, "0")}-${String(lastWeekStart.getDate()).padStart(2, "0")}`;
    const lastWeekCutoff = new Date(
      lastWeekStart.getTime() + (dayOfWeek - 1) * 864e5,
    );
    const lastWeekCutoffStr = `${lastWeekCutoff.getFullYear()}-${String(lastWeekCutoff.getMonth() + 1).padStart(2, "0")}-${String(lastWeekCutoff.getDate()).padStart(2, "0")}`;

    const lastWeekSpend = transactions
      .filter(
        (tx) =>
          tx.type === "expense" &&
          !tx.isIou &&
          tx.date >= lastWeekStartStr &&
          tx.date <= lastWeekCutoffStr,
      )
      .reduce((s, tx) => s + toBase(tx.amount, tx.accountId), 0);

    const weekChangePercent =
      lastWeekSpend > 0
        ? Math.round(((thisWeekSpend - lastWeekSpend) / lastWeekSpend) * 100)
        : thisWeekSpend > 0
          ? 100
          : 0;

    // ── 30-day net worth change ──────────────────────────────────

    const thirtyDaysAgo = addDaysISO(-30);
    let nw30Income = 0;
    let nw30Expenses = 0;
    for (const tx of transactions) {
      if (tx.date < thirtyDaysAgo || tx.isIou || tx.type === "transfer")
        continue;
      if (tx.type === "income")
        nw30Income += toBase(tx.amount, tx.accountId);
      if (tx.type === "expense")
        nw30Expenses += toBase(tx.amount, tx.accountId);
    }
    const netWorthChange30d = nw30Income - nw30Expenses;

    // ── Bills ────────────────────────────────────────────────────

    const in7DaysStr = addDaysISO(7);
    const overdueBills = recurring.filter(
      (r) =>
        r.type === "expense" &&
        r.status !== "paused" &&
        r.nextDueDate < todayStr,
    ).length;

    const upcomingBills7d = recurring.filter(
      (r) =>
        r.type === "expense" &&
        r.status !== "paused" &&
        r.nextDueDate >= todayStr &&
        r.nextDueDate <= in7DaysStr,
    ).length;

    // ── IOUs ─────────────────────────────────────────────────────

    const overdueIous = ious.filter(
      (i) =>
        i.status === "pending" &&
        i.type === "lent" &&
        i.dueDate &&
        i.dueDate < todayStr,
    ).length;

    // ── Goals ────────────────────────────────────────────────────

    const activeGoals = savingsGoals
      .filter((g) => g.currentAmount < g.targetAmount && g.deadline)
      .map((g) => {
        const pct = Math.round((g.currentAmount / g.targetAmount) * 100);
        const deadlineDate = parseLocalDate(g.deadline!);
        const daysLeft = Math.max(
          0,
          Math.round((deadlineDate.getTime() - today.getTime()) / 864e5),
        );
        return { name: g.name, percent: pct, daysLeft };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const nearestGoal = activeGoals[0] ?? null;

    // ── Backup ───────────────────────────────────────────────────

    const backupNeeded = isBackupNeeded();

    // ── Build Insights ───────────────────────────────────────────

    const insights: Insight[] = [];

    // 1. Projected overspend
    if (
      (monthlyBudgetTarget > 0 && projectedSpend > monthlyBudgetTarget * 1.1) ||
      (income > 0 && projectedSpend > income * 1.1)
    ) {
      const base = monthlyBudgetTarget > 0 ? monthlyBudgetTarget : income;
      const overPct = Math.round(((projectedSpend - base) / base) * 100);
      insights.push({
        id: "projected-overspend",
        severity: "warn",
        title: "Projected Overspend",
        body: `At your current pace you'll spend ~${overPct}% more than ${monthlyBudgetTarget > 0 ? "your target" : "your income"} this cycle.`,
        icon: "TrendingUp",
      });
    }

    // 2. Top category vs previous cycle
    if (topCategory && prevTopCategoryAmount > 0) {
      if (topCategoryAmount > prevTopCategoryAmount * 1.2) {
        const changePct = Math.round(
          ((topCategoryAmount - prevTopCategoryAmount) / prevTopCategoryAmount) * 100,
        );
        insights.push({
          id: "category-spike",
          severity: "warn",
          title: `${topCategory} Up ${changePct}%`,
          body: `Your top category is ${changePct}% higher than last cycle.`,
          icon: "ArrowUpRight",
        });
      }
    }

    // 3. Week-over-week change
    if (lastWeekSpend > 0 && Math.abs(weekChangePercent) >= 15) {
      insights.push({
        id: "week-compare",
        severity: weekChangePercent > 0 ? "warn" : "good",
        title:
          weekChangePercent > 0
            ? `Week Spending Up ${weekChangePercent}%`
            : `Week Spending Down ${Math.abs(weekChangePercent)}%`,
        body:
          weekChangePercent > 0
            ? "You're spending more this week than last week at this point."
            : "Great job — spending less than last week so far.",
        icon: weekChangePercent > 0 ? "TrendingUp" : "TrendingDown",
      });
    }

    // 4. Budget thresholds
    for (const b of budgets) {
      const spent = catSpend[b.category] ?? 0;
      const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
      if (pct >= 100) {
        insights.push({
          id: `budget-over-${b.id}`,
          severity: "bad",
          title: `${b.category} Over Budget`,
          body: `Spent ${Math.round(pct)}% of your ${b.category} budget.`,
          icon: "AlertCircle",
        });
      } else if (pct >= 80) {
        insights.push({
          id: `budget-warn-${b.id}`,
          severity: "warn",
          title: `${b.category} at ${Math.round(pct)}%`,
          body: `Getting close to your ${b.category} budget limit.`,
          icon: "AlertTriangle",
        });
      }
    }

    // 5. Overdue bills
    if (overdueBills > 0) {
      insights.push({
        id: "overdue-bills",
        severity: "bad",
        title: `${overdueBills} Overdue Bill${overdueBills > 1 ? "s" : ""}`,
        body: "You have bills past their due date.",
        icon: "CalendarClock",
      });
    }

    // 6. Upcoming bills
    if (upcomingBills7d > 0) {
      insights.push({
        id: "upcoming-bills",
        severity: "info",
        title: `${upcomingBills7d} Bill${upcomingBills7d > 1 ? "s" : ""} Due Soon`,
        body: "Bills due within the next 7 days.",
        icon: "CalendarCheck",
      });
    }

    // 7. Overdue IOUs
    if (overdueIous > 0) {
      insights.push({
        id: "overdue-ious",
        severity: "warn",
        title: `${overdueIous} Overdue IOU${overdueIous > 1 ? "s" : ""}`,
        body: "Money lent that's past the expected return date.",
        icon: "UserCheck",
      });
    }

    // 8. Goal near deadline
    if (nearestGoal && nearestGoal.daysLeft <= 30 && nearestGoal.percent < 90) {
      insights.push({
        id: "goal-deadline",
        severity: nearestGoal.daysLeft <= 7 ? "bad" : "warn",
        title: `"${nearestGoal.name}" ${nearestGoal.daysLeft}d Left`,
        body: `Goal is ${nearestGoal.percent}% funded with ${nearestGoal.daysLeft} days remaining.`,
        icon: "Target",
      });
    }

    // 9. Good savings rate
    if (savingsRate >= 20 && income > 0) {
      insights.push({
        id: "savings-good",
        severity: "good",
        title: `Saving ${savingsRate}% This Cycle`,
        body: "You're saving a healthy portion of your income.",
        icon: "PiggyBank",
      });
    }

    // 10. Backup reminder
    if (backupNeeded) {
      insights.push({
        id: "backup-needed",
        severity: "info",
        title: "Backup Recommended",
        body: "It's been a while since your last data backup.",
        icon: "ShieldAlert",
      });
    }

    // 11. No budget target set
    if (monthlyBudgetTarget <= 0 && income > 0) {
      insights.push({
        id: "no-target",
        severity: "info",
        title: "Set a Spending Target",
        body: "A monthly spending target helps the Safe-to-Spend engine work better.",
        icon: "Crosshair",
      });
    }

    // Sort by severity then cap at 6
    insights.sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
    );
    const capped = insights.slice(0, 6);

    const stats: CycleStats = {
      cycle,
      prevCycle,
      income,
      expenses,
      prevIncome,
      prevExpenses,
      savingsRate,
      avgDailySpend,
      projectedSpend,
      topCategory,
      topCategoryAmount,
      prevTopCategoryAmount,
      biggestExpense,
      thisWeekSpend,
      lastWeekSpend,
      weekChangePercent,
      netWorthChange30d,
      overdueBills,
      upcomingBills7d,
      overdueIous,
      nearestGoal,
      backupNeeded,
    };

    return { insights: capped, allInsights: insights, stats };
  }, [
    transactions,
    accounts,
    budgets,
    recurring,
    savingsGoals,
    ious,
    settings,
    isBackupNeeded,
    monthlyBudgetTarget,
    exchangeRates,
  ]);
}

