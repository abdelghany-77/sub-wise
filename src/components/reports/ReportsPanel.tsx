import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { IncomeExpenseChart } from "../charts/IncomeExpenseChart";
import {
  amountInBase,
  formatCurrency,
  getFinancialCycle,
  cn,
} from "../../lib/utils";
import { CATEGORY_COLORS } from "../../types";

export function ReportsPanel() {
  const {
    transactions,
    accounts,
    customCategories,
    exchangeRates,
    settings,
    privacyMode,
  } = useStore();
  const paydayStart = settings.monthStartsOnDay ?? 1;
  const [monthOffset, setMonthOffset] = useState(0);
  const [periodMode, setPeriodMode] = useState<"calendar" | "cycle">(
    paydayStart > 1 ? "cycle" : "calendar",
  );
  const [breakdownTab, setBreakdownTab] = useState<"spending" | "income">(
    "spending",
  );

  // Safe month arithmetic avoiding day-31 overflow (e.g., Mar 31 -> Mar 3 instead of Feb)
  const { periodLabel, isDateInPeriod, isDateInPrevPeriod } = useMemo(() => {
    const now = new Date();
    if (periodMode === "cycle" && paydayStart > 1) {
      const refCurrent = new Date(
        now.getFullYear(),
        now.getMonth() - monthOffset,
        Math.min(now.getDate(), 28),
      );
      const cycle = getFinancialCycle(refCurrent, paydayStart);
      const refPrev = new Date(
        now.getFullYear(),
        now.getMonth() - monthOffset - 1,
        Math.min(now.getDate(), 28),
      );
      const prevCycle = getFinancialCycle(refPrev, paydayStart);
      return {
        periodLabel: cycle.cycleLabel,
        isDateInPeriod: cycle.isDateInCycle,
        isDateInPrevPeriod: prevCycle.isDateInCycle,
      };
    }

    const target = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const prev = new Date(now.getFullYear(), now.getMonth() - monthOffset - 1, 1);
    const mKey = `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
    const pKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
    return {
      periodLabel: target.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
      isDateInPeriod: (d: string) => d.startsWith(mKey),
      isDateInPrevPeriod: (d: string) => d.startsWith(pKey),
    };
  }, [monthOffset, periodMode, paydayStart]);

  const stats = useMemo(() => {
    const periodTxs = transactions.filter(
      (tx) =>
        !tx.isIou && !tx.isReconciliation && isDateInPeriod(tx.date),
    );
    let income = 0,
      expenses = 0;
    const catSpend: Record<string, number> = {};
    const incomeSources: Record<string, number> = {};

    for (const tx of periodTxs) {
      const acc = accounts.find((a) => a.id === tx.accountId);
      const baseAmt = amountInBase(tx.amount, acc, exchangeRates);
      if (tx.type === "income") {
        income += baseAmt;
        incomeSources[tx.category] =
          (incomeSources[tx.category] ?? 0) + baseAmt;
      } else if (tx.type === "expense") {
        expenses += baseAmt;
        catSpend[tx.category] = (catSpend[tx.category] ?? 0) + baseAmt;
      }
    }

    const topCategories = Object.entries(catSpend)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const topIncome = Object.entries(incomeSources)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    const prevTxs = transactions.filter(
      (tx) =>
        !tx.isIou && !tx.isReconciliation && isDateInPrevPeriod(tx.date),
    );
    let prevIncome = 0,
      prevExpenses = 0;
    for (const tx of prevTxs) {
      const acc = accounts.find((a) => a.id === tx.accountId);
      const baseAmt = amountInBase(tx.amount, acc, exchangeRates);
      if (tx.type === "income") prevIncome += baseAmt;
      else if (tx.type === "expense") prevExpenses += baseAmt;
    }

    const incomeChange =
      prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
    const expenseChange =
      prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

    return {
      income,
      expenses,
      topCategories,
      topIncome,
      incomeChange,
      expenseChange,
      txCount: periodTxs.length,
    };
  }, [transactions, accounts, exchangeRates, isDateInPeriod, isDateInPrevPeriod]);

  const net = stats.income - stats.expenses;
  const savingsRate =
    stats.income > 0 ? ((net / stats.income) * 100).toFixed(0) : "0";
  const defCur = "EGP";

  return (
    <div className="space-y-4">
      {/* Month / Cycle Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <h2 className="section-title">Financial Reports</h2>
          {paydayStart > 1 && (
            <div className="inline-flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-0.5 gap-0.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => {
                  setPeriodMode("cycle");
                  setMonthOffset(0);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors",
                  periodMode === "cycle"
                    ? "bg-blue-600 text-white"
                    : "text-white/50 hover:text-white",
                )}
              >
                Payday Cycle
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriodMode("calendar");
                  setMonthOffset(0);
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg transition-colors",
                  periodMode === "calendar"
                    ? "bg-blue-600 text-white"
                    : "text-white/50 hover:text-white",
                )}
              >
                Calendar Month
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setMonthOffset((o) => o + 1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Previous period"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-white/85 min-w-[136px] text-center font-mono">
            {periodLabel}
          </span>
          <button
            onClick={() => setMonthOffset((o) => Math.max(0, o - 1))}
            disabled={monthOffset === 0}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25"
            aria-label="Next period"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
        <Card padding="sm" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={17} className="text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-white/40">Income</p>
            <p
              className={cn(
                "text-sm sm:text-lg font-bold text-white font-mono tabular-nums truncate",
                privacyMode && "privacy-blur",
              )}
            >
              {formatCurrency(stats.income, defCur)}
            </p>
            {stats.incomeChange !== 0 && (
              <p
                className={cn(
                  "text-[10px] truncate",
                  stats.incomeChange > 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {stats.incomeChange > 0 ? "+" : ""}
                {stats.incomeChange.toFixed(0)}% vs prior
              </p>
            )}
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={17} className="text-rose-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-white/40">Expenses</p>
            <p
              className={cn(
                "text-sm sm:text-lg font-bold text-white font-mono tabular-nums truncate",
                privacyMode && "privacy-blur",
              )}
            >
              {formatCurrency(stats.expenses, defCur)}
            </p>
            {stats.expenseChange !== 0 && (
              <p
                className={cn(
                  "text-[10px] truncate",
                  stats.expenseChange < 0
                    ? "text-emerald-400"
                    : "text-rose-400",
                )}
              >
                {stats.expenseChange > 0 ? "+" : ""}
                {stats.expenseChange.toFixed(0)}% vs prior
              </p>
            )}
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign size={17} className="text-blue-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-white/40">Net Cash Flow</p>
            <p
              className={cn(
                "text-sm sm:text-lg font-bold font-mono tabular-nums truncate",
                net >= 0 ? "text-emerald-400" : "text-rose-400",
                privacyMode && "privacy-blur",
              )}
            >
              {net >= 0 ? "+" : "-"}
              {formatCurrency(net, defCur)}
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Activity size={17} className="text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-white/40">Savings Rate</p>
            <p
              className={cn(
                "text-sm sm:text-lg font-bold text-white font-mono tabular-nums",
                privacyMode && "privacy-blur",
              )}
            >
              {savingsRate}%
            </p>
            <p className="text-[10px] text-white/30 truncate">
              {stats.txCount} transactions
            </p>
          </div>
        </Card>
      </div>

      {/* Chart + category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7">
          <IncomeExpenseChart />
        </div>

        <Card padding="sm" className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-semibold text-white">Breakdown</h3>
            <div className="flex bg-white/[0.04] border border-white/[0.06] rounded-xl p-0.5 gap-0.5">
              {(["spending", "income"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setBreakdownTab(t)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all",
                    breakdownTab === t
                      ? t === "spending"
                        ? "bg-rose-500/80 text-white"
                        : "bg-emerald-500/80 text-white"
                      : "text-white/50 hover:text-white",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {(() => {
            const isSpending = breakdownTab === "spending";
            const rows = isSpending ? stats.topCategories : stats.topIncome;
            const total = isSpending ? stats.expenses : stats.income;
            if (rows.length === 0) {
              return (
                <p className="text-white/30 text-sm py-10 text-center">
                  {isSpending
                    ? "No expenses in this period"
                    : "No income in this period"}
                </p>
              );
            }
            return (
              <div className="space-y-3">
                {rows.map(([cat, amount]) => {
                  const pct = total > 0 ? (amount / total) * 100 : 0;
                  const customColor = customCategories.find(
                    (c) => c.name === cat,
                  )?.color;
                  const color =
                    customColor ??
                    CATEGORY_COLORS[cat] ??
                    (isSpending ? "#94a3b8" : "#34d399");
                  return (
                    <div key={cat} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-white/80 truncate">{cat}</span>
                        </div>
                        <span
                          className={cn(
                            "font-mono font-medium text-white/60 whitespace-nowrap",
                            privacyMode && "privacy-blur",
                          )}
                        >
                          {formatCurrency(amount, defCur)}{" "}
                          <span className="text-white/30">
                            ({pct.toFixed(0)}%)
                          </span>
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </Card>
      </div>
    </div>
  );
}
