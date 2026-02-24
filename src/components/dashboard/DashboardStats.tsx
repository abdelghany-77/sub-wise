import { useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, DollarSign } from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../lib/utils";
import { cn } from "../../lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  trend?: string;
  trendUp?: boolean;
  privacyMode?: boolean;
  children?: React.ReactNode;
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  trend,
  trendUp,
  privacyMode,
  children,
}: StatCardProps) {
  return (
    <Card className="flex items-center gap-4" hover>
      <div
        className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center`}
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="stat-label">{label}</p>
        {value && (
          <p
            className={cn(
              "stat-value mt-1 text-white transition-all duration-300",
              privacyMode && "blur-md select-none",
            )}
          >
            {value}
          </p>
        )}
        {children}
        {trend && (
          <p
            className={cn(
              "text-xs mt-1 flex items-center gap-1 transition-all duration-300",
              trendUp ? "text-emerald-400" : "text-rose-400",
              privacyMode && "blur-md select-none",
            )}
          >
            {trendUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {trend}
          </p>
        )}
      </div>
    </Card>
  );
}

export function DashboardStats() {
  const { transactions, accounts, getNetWorthByCurrency } = useStore();

  const statsByCurrency = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });

    // Group by currency using account lookup
    const byCurrency: Record<string, { income: number; expenses: number }> = {};
    for (const tx of thisMonth) {
      const acc = accounts.find((a) => a.id === tx.accountId);
      const cur = acc?.currency ?? "EGP";
      if (!byCurrency[cur]) byCurrency[cur] = { income: 0, expenses: 0 };
      if (tx.type === "income") byCurrency[cur].income += tx.amount;
      if (tx.type === "expense") byCurrency[cur].expenses += tx.amount;
    }

    // If no transactions, use first account currency or EGP
    const currencies = Object.keys(byCurrency);
    if (currencies.length === 0) {
      const defaultCur = accounts[0]?.currency ?? "EGP";
      byCurrency[defaultCur] = { income: 0, expenses: 0 };
    }

    return byCurrency;
  }, [transactions, accounts]);

  const netWorthByCurrency = getNetWorthByCurrency();
  const currencies = Object.keys(netWorthByCurrency);
  const { privacyMode } = useStore();

  // Build display values considering multiple currencies
  const statCurrencies = Object.keys(statsByCurrency);
  const totalIncome =
    statCurrencies.length === 1
      ? formatCurrency(
          statsByCurrency[statCurrencies[0]].income,
          statCurrencies[0],
        )
      : statCurrencies
          .map((c) => formatCurrency(statsByCurrency[c].income, c))
          .join(" + ");
  const totalExpenses =
    statCurrencies.length === 1
      ? formatCurrency(
          statsByCurrency[statCurrencies[0]].expenses,
          statCurrencies[0],
        )
      : statCurrencies
          .map((c) => formatCurrency(statsByCurrency[c].expenses, c))
          .join(" + ");

  // Savings rate (use first currency or aggregate)
  const primaryCur = statCurrencies[0] ?? "EGP";
  const primaryStats = statsByCurrency[primaryCur] ?? {
    income: 0,
    expenses: 0,
  };
  const savings = primaryStats.income - primaryStats.expenses;
  const savingsRate =
    primaryStats.income > 0
      ? ((savings / primaryStats.income) * 100).toFixed(0)
      : "0";

  // Build net worth display string
  const netWorthDisplay =
    currencies.length > 0
      ? currencies
          .map((cur) => formatCurrency(netWorthByCurrency[cur], cur))
          .join(" + ")
      : formatCurrency(0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Net Worth"
        value={currencies.length <= 1 ? netWorthDisplay : ""}
        icon={<DollarSign size={22} />}
        iconBg="rgba(124,58,237,0.2)"
        iconColor="#a78bfa"
        privacyMode={privacyMode}
      >
        {currencies.length > 1 && (
          <div
            className={cn(
              "flex flex-col gap-0.5 mt-1 transition-all duration-300",
              privacyMode && "blur-md select-none",
            )}
          >
            {currencies.map((cur) => (
              <span
                key={cur}
                className="stat-value text-white text-sm font-mono"
              >
                {formatCurrency(netWorthByCurrency[cur], cur)}
              </span>
            ))}
          </div>
        )}
      </StatCard>
      <StatCard
        label="Income This Month"
        value={totalIncome}
        icon={<TrendingUp size={22} />}
        iconBg="rgba(16,185,129,0.2)"
        iconColor="#34d399"
        trendUp
        privacyMode={privacyMode}
      />
      <StatCard
        label="Expenses This Month"
        value={totalExpenses}
        icon={<TrendingDown size={22} />}
        iconBg="rgba(244,63,94,0.2)"
        iconColor="#fb7185"
        trendUp={false}
        privacyMode={privacyMode}
      />
      <StatCard
        label="Savings Rate"
        value={`${savingsRate}%`}
        icon={<Activity size={22} />}
        iconBg="rgba(14,165,233,0.2)"
        iconColor="#38bdf8"
        trend={
          savings >= 0
            ? `+${formatCurrency(savings, primaryCur)} saved`
            : `${formatCurrency(Math.abs(savings), primaryCur)} deficit`
        }
        trendUp={savings >= 0}
        privacyMode={privacyMode}
      />
    </div>
  );
}
