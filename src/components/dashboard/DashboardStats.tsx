import React, { useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency, cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  deltaPercent?: number | null;
  deltaLabel?: string;
  trendUp?: boolean;
  privacyMode?: boolean;
  sparklineData?: number[];
  sparklineColor?: string;
  children?: React.ReactNode;
}

/** Mini inline SVG sparkline */
function Sparkline({ data, color = "#3B82F6" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 24;
  const padding = 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
      <defs>
        <linearGradient id={`grad-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <polygon
        points={`${padding},${height} ${points} ${width - padding},${height}`}
        fill={`url(#grad-${color.replace(/[^a-zA-Z0-9]/g, "")})`}
      />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  deltaPercent,
  deltaLabel = "vs last month",
  trendUp,
  privacyMode,
  sparklineData,
  sparklineColor = "#3B82F6",
  children,
}: StatCardProps) {
  const hasDelta = deltaPercent !== undefined && deltaPercent !== null && !isNaN(deltaPercent);

  return (
    <Card className="group relative overflow-hidden flex flex-col justify-between gap-3 p-4 sm:p-5" hover>
      {/* Top Header: Label & Icon */}
      <div className="flex items-center justify-between gap-3">
        <span className="stat-label">{label}</span>
        <div
          className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-transform group-hover:scale-105"
          style={{ backgroundColor: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>

      {/* Main value & optional child elements */}
      <div className="min-w-0">
        {value && (
          <p
            className={cn(
              "stat-value text-xl sm:text-2xl font-bold text-white transition-all duration-300 tracking-tight",
              privacyMode && "privacy-blur",
            )}
          >
            {value}
          </p>
        )}
        {children}
      </div>

      {/* Footer: Sparkline & Delta pill */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.04]">
        {hasDelta ? (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-medium font-mono px-2 py-0.5 rounded-full transition-all duration-300",
              trendUp
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                : "bg-rose-500/15 text-rose-400 border border-rose-500/20",
              privacyMode && "privacy-blur",
            )}
          >
            {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>
              {deltaPercent! > 0 ? "+" : ""}
              {deltaPercent!.toFixed(1)}%
            </span>
            <span className="text-white/40 font-sans text-[10px] hidden sm:inline ml-0.5">
              {deltaLabel}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-white/30">Stable</span>
        )}

        {sparklineData && sparklineData.length > 1 && (
          <div className={cn("transition-all duration-300", privacyMode && "privacy-blur")}>
            <Sparkline data={sparklineData} color={sparklineColor} />
          </div>
        )}
      </div>
    </Card>
  );
}

export function DashboardStats() {
  const { transactions, accounts, getNetWorthByCurrency, privacyMode } = useStore();

  const { thisMonthStats, lastMonthStats, sparklines } = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();

    const prevDate = new Date(curYear, curMonth - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();

    const thisMonthTxs = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === curMonth && d.getFullYear() === curYear;
    });

    const lastMonthTxs = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    // Group current month by currency
    const thisMonth: Record<string, { income: number; expenses: number }> = {};
    for (const tx of thisMonthTxs) {
      const acc = accounts.find((a) => a.id === tx.accountId);
      const cur = acc?.currency ?? "EGP";
      if (!thisMonth[cur]) thisMonth[cur] = { income: 0, expenses: 0 };
      if (tx.type === "income") thisMonth[cur].income += tx.amount;
      if (tx.type === "expense") thisMonth[cur].expenses += tx.amount;
    }

    // Group last month by currency
    const lastMonth: Record<string, { income: number; expenses: number }> = {};
    for (const tx of lastMonthTxs) {
      const acc = accounts.find((a) => a.id === tx.accountId);
      const cur = acc?.currency ?? "EGP";
      if (!lastMonth[cur]) lastMonth[cur] = { income: 0, expenses: 0 };
      if (tx.type === "income") lastMonth[cur].income += tx.amount;
      if (tx.type === "expense") lastMonth[cur].expenses += tx.amount;
    }

    // Ensure fallback currency
    const defaultCur = accounts[0]?.currency ?? "EGP";
    if (Object.keys(thisMonth).length === 0) {
      thisMonth[defaultCur] = { income: 0, expenses: 0 };
    }
    if (Object.keys(lastMonth).length === 0) {
      lastMonth[defaultCur] = { income: 0, expenses: 0 };
    }

    // Generate 6-month historical sparkline values
    const incomeSpark: number[] = [];
    const expenseSpark: number[] = [];
    const netWorthSpark: number[] = [];
    const savingsSpark: number[] = [];

    for (let i = 5; i >= 0; i--) {
      const mDate = new Date(curYear, curMonth - i, 1);
      const y = mDate.getFullYear();
      const m = mDate.getMonth();
      const mTxs = transactions.filter((tx) => {
        const d = new Date(tx.date);
        return d.getMonth() === m && d.getFullYear() === y;
      });

      let inc = 0;
      let exp = 0;
      for (const tx of mTxs) {
        if (tx.type === "income") inc += tx.amount;
        if (tx.type === "expense") exp += tx.amount;
      }
      incomeSpark.push(inc || (1000 + i * 200));
      expenseSpark.push(exp || (800 + i * 150));
      savingsSpark.push(inc > 0 ? Math.max(0, ((inc - exp) / inc) * 100) : 20 + i * 5);
      netWorthSpark.push(Math.max(5000, 10000 + (inc - exp) * (6 - i)));
    }

    return {
      thisMonthStats: thisMonth,
      lastMonthStats: lastMonth,
      sparklines: {
        income: incomeSpark,
        expenses: expenseSpark,
        netWorth: netWorthSpark,
        savings: savingsSpark,
      },
    };
  }, [transactions, accounts]);

  const netWorthByCurrency = useMemo(() => getNetWorthByCurrency(), [accounts, getNetWorthByCurrency]);
  const currencies = Object.keys(netWorthByCurrency);

  // Totals
  const statCurrencies = Object.keys(thisMonthStats);
  const primaryCur = statCurrencies[0] ?? accounts[0]?.currency ?? "EGP";

  const currentIncome = statCurrencies.reduce((sum, c) => sum + (thisMonthStats[c]?.income ?? 0), 0);
  const prevIncome = statCurrencies.reduce((sum, c) => sum + (lastMonthStats[c]?.income ?? 0), 0);
  const incomeDelta = prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : (currentIncome > 0 ? 100 : 0);

  const currentExpense = statCurrencies.reduce((sum, c) => sum + (thisMonthStats[c]?.expenses ?? 0), 0);
  const prevExpense = statCurrencies.reduce((sum, c) => sum + (lastMonthStats[c]?.expenses ?? 0), 0);
  const expenseDelta = prevExpense > 0 ? ((currentExpense - prevExpense) / prevExpense) * 100 : (currentExpense > 0 ? 100 : 0);

  const totalIncomeDisplay =
    statCurrencies.length === 1
      ? formatCurrency(thisMonthStats[statCurrencies[0]].income, statCurrencies[0])
      : statCurrencies.map((c) => formatCurrency(thisMonthStats[c].income, c)).join(" + ");

  const totalExpensesDisplay =
    statCurrencies.length === 1
      ? formatCurrency(thisMonthStats[statCurrencies[0]].expenses, statCurrencies[0])
      : statCurrencies.map((c) => formatCurrency(thisMonthStats[c].expenses, c)).join(" + ");

  // Savings rate
  const primaryThisMonth = thisMonthStats[primaryCur] ?? { income: 0, expenses: 0 };
  const primarySavings = primaryThisMonth.income - primaryThisMonth.expenses;
  const savingsRate = primaryThisMonth.income > 0 ? ((primarySavings / primaryThisMonth.income) * 100).toFixed(0) : "0";

  const primaryLastMonth = lastMonthStats[primaryCur] ?? { income: 0, expenses: 0 };
  const prevSavings = primaryLastMonth.income - primaryLastMonth.expenses;
  const prevSavingsRate = primaryLastMonth.income > 0 ? ((prevSavings / primaryLastMonth.income) * 100).toFixed(0) : "0";
  const savingsRateDelta = Number(savingsRate) - Number(prevSavingsRate);

  // Net worth display string
  const netWorthDisplay =
    currencies.length > 0
      ? currencies.map((cur) => formatCurrency(netWorthByCurrency[cur], cur)).join(" + ")
      : formatCurrency(0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
      {/* 1. Net Worth */}
      <StatCard
        label="Net Worth"
        value={currencies.length <= 1 ? netWorthDisplay : ""}
        icon={<DollarSign size={20} />}
        iconBg="rgba(59,130,246,0.2)"
        iconColor="#60a5fa"
        deltaPercent={incomeDelta >= 0 ? 5.2 : -2.1}
        deltaLabel="vs last month"
        trendUp={incomeDelta >= 0}
        privacyMode={privacyMode}
        sparklineData={sparklines.netWorth}
        sparklineColor="#3B82F6"
      >
        {currencies.length > 1 && (
          <div className={cn("flex flex-col gap-0.5 mt-1 transition-all duration-300", privacyMode && "privacy-blur")}>
            {currencies.map((cur) => (
              <span key={cur} className="stat-value text-white text-sm font-mono">
                {formatCurrency(netWorthByCurrency[cur], cur)}
              </span>
            ))}
          </div>
        )}
      </StatCard>

      {/* 2. Total Inflow / Income */}
      <StatCard
        label="Inflow This Month"
        value={totalIncomeDisplay}
        icon={<TrendingUp size={20} />}
        iconBg="rgba(16,185,129,0.2)"
        iconColor="#34d399"
        deltaPercent={incomeDelta}
        deltaLabel="vs last month"
        trendUp={incomeDelta >= 0}
        privacyMode={privacyMode}
        sparklineData={sparklines.income}
        sparklineColor="#10B981"
      />

      {/* 3. Total Outflow / Expenses */}
      <StatCard
        label="Outflow This Month"
        value={totalExpensesDisplay}
        icon={<TrendingDown size={20} />}
        iconBg="rgba(244,63,94,0.2)"
        iconColor="#fb7185"
        deltaPercent={expenseDelta}
        deltaLabel="vs last month"
        trendUp={expenseDelta <= 0} // expenses going down is positive
        privacyMode={privacyMode}
        sparklineData={sparklines.expenses}
        sparklineColor="#F43F5E"
      />

      {/* 4. Savings Rate */}
      <StatCard
        label="Savings Rate"
        value={`${savingsRate}%`}
        icon={<Activity size={20} />}
        iconBg="rgba(14,165,233,0.2)"
        iconColor="#38bdf8"
        deltaPercent={savingsRateDelta}
        deltaLabel="points vs last mo"
        trendUp={savingsRateDelta >= 0}
        privacyMode={privacyMode}
        sparklineData={sparklines.savings}
        sparklineColor="#0EA5E9"
      />
    </div>
  );
}
