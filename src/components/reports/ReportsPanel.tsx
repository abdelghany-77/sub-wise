import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, DollarSign, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { IncomeExpenseChart } from "../charts/IncomeExpenseChart";
import { formatCurrency, cn } from "../../lib/utils";
import { CATEGORY_COLORS } from "../../types";

export function ReportsPanel() {
  const { transactions, accounts, privacyMode } = useStore();
  const [monthOffset, setMonthOffset] = useState(0);

  const selectedDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthOffset);
    return d;
  }, [monthOffset]);

  const monthLabel = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const monthKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}`;

  const stats = useMemo(() => {
    const monthTxs = transactions.filter((tx) => tx.date.startsWith(monthKey));
    let income = 0, expenses = 0;
    const catSpend: Record<string, number> = {};
    const incomeSources: Record<string, number> = {};

    for (const tx of monthTxs) {
      if (tx.type === "income") {
        income += tx.amount;
        incomeSources[tx.category] = (incomeSources[tx.category] ?? 0) + tx.amount;
      } else if (tx.type === "expense") {
        expenses += tx.amount;
        catSpend[tx.category] = (catSpend[tx.category] ?? 0) + tx.amount;
      }
    }

    const topCategories = Object.entries(catSpend)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const topIncome = Object.entries(incomeSources)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    // Previous month comparison
    const prevDate = new Date(selectedDate);
    prevDate.setMonth(prevDate.getMonth() - 1);
    const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;
    const prevTxs = transactions.filter((tx) => tx.date.startsWith(prevKey));
    let prevIncome = 0, prevExpenses = 0;
    for (const tx of prevTxs) {
      if (tx.type === "income") prevIncome += tx.amount;
      else if (tx.type === "expense") prevExpenses += tx.amount;
    }

    const incomeChange = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
    const expenseChange = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

    return { income, expenses, topCategories, topIncome, incomeChange, expenseChange, txCount: monthTxs.length };
  }, [transactions, monthKey, selectedDate]);

  const net = stats.income - stats.expenses;
  const savingsRate = stats.income > 0 ? ((net / stats.income) * 100).toFixed(0) : "0";
  const defCur = accounts[0]?.currency ?? "EGP";

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="section-title">Financial Reports</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset((o) => o + 1)} className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all" aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <span className="text-sm font-medium text-white/80 min-w-[130px] text-center">{monthLabel}</span>
          <button onClick={() => setMonthOffset((o) => Math.max(0, o - 1))} disabled={monthOffset === 0} className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all disabled:opacity-25" aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Income</p>
            <p className={cn("text-base sm:text-lg font-bold text-white font-mono", privacyMode && "blur-md select-none")}>{formatCurrency(stats.income, defCur)}</p>
            {stats.incomeChange !== 0 && (
              <p className={cn("text-[10px]", stats.incomeChange > 0 ? "text-emerald-400" : "text-rose-400")}>
                {stats.incomeChange > 0 ? "+" : ""}{stats.incomeChange.toFixed(0)}% vs last month
              </p>
            )}
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center flex-shrink-0">
            <TrendingDown size={18} className="text-rose-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Expenses</p>
            <p className={cn("text-base sm:text-lg font-bold text-white font-mono", privacyMode && "blur-md select-none")}>{formatCurrency(stats.expenses, defCur)}</p>
            {stats.expenseChange !== 0 && (
              <p className={cn("text-[10px]", stats.expenseChange < 0 ? "text-emerald-400" : "text-rose-400")}>
                {stats.expenseChange > 0 ? "+" : ""}{stats.expenseChange.toFixed(0)}% vs last month
              </p>
            )}
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign size={18} className="text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Net Cash Flow</p>
            <p className={cn("text-base sm:text-lg font-bold font-mono", net >= 0 ? "text-emerald-400" : "text-rose-400", privacyMode && "blur-md select-none")}>
              {net >= 0 ? "+" : ""}{formatCurrency(net, defCur)}
            </p>
          </div>
        </Card>
        <Card padding="sm" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Activity size={18} className="text-violet-400" />
          </div>
          <div>
            <p className="text-xs text-white/40">Savings Rate</p>
            <p className={cn("text-base sm:text-lg font-bold text-white", privacyMode && "blur-md select-none")}>{savingsRate}%</p>
            <p className="text-[10px] text-white/30">{stats.txCount} transactions</p>
          </div>
        </Card>
      </div>

      {/* Income vs Expense Chart */}
      <IncomeExpenseChart />

      {/* Top Spending + Income Sources */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Spending Categories */}
        <Card>
          <h3 className="section-title mb-4">Top Spending Categories</h3>
          {stats.topCategories.length === 0 ? (
            <p className="text-white/30 text-sm py-8 text-center">No expenses this month</p>
          ) : (
            <div className="space-y-3">
              {stats.topCategories.map(([cat, amount]) => {
                const pct = stats.expenses > 0 ? (amount / stats.expenses) * 100 : 0;
                const color = CATEGORY_COLORS[cat] ?? "#94a3b8";
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-white/80">{cat}</span>
                      </div>
                      <span className={cn("font-mono font-medium text-white/60", privacyMode && "blur-md select-none")}>
                        {formatCurrency(amount, defCur)} <span className="text-white/30 text-xs">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Income Sources */}
        <Card>
          <h3 className="section-title mb-4">Income Sources</h3>
          {stats.topIncome.length === 0 ? (
            <p className="text-white/30 text-sm py-8 text-center">No income this month</p>
          ) : (
            <div className="space-y-3">
              {stats.topIncome.map(([cat, amount]) => {
                const pct = stats.income > 0 ? (amount / stats.income) * 100 : 0;
                const color = CATEGORY_COLORS[cat] ?? "#34d399";
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                        <span className="text-white/80">{cat}</span>
                      </div>
                      <span className={cn("font-mono font-medium text-white/60", privacyMode && "blur-md select-none")}>
                        {formatCurrency(amount, defCur)} <span className="text-white/30 text-xs">({pct.toFixed(0)}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
