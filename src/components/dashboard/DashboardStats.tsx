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
  const { transactions, getNetWorthByCurrency } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = transactions.filter((tx) => {
      const d = new Date(tx.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });

    const income = thisMonth
      .filter((tx) => tx.type === "income")
      .reduce((s, tx) => s + tx.amount, 0);

    const expenses = thisMonth
      .filter((tx) => tx.type === "expense")
      .reduce((s, tx) => s + tx.amount, 0);

    const savings = income - expenses;
    const savingsRate =
      income > 0 ? ((savings / income) * 100).toFixed(0) : "0";

    return { income, expenses, savings, savingsRate };
  }, [transactions]);

  const netWorthByCurrency = getNetWorthByCurrency();
  const currencies = Object.keys(netWorthByCurrency);
  const { privacyMode } = useStore();

  // Build net worth display string
  const netWorthDisplay = currencies.length > 0
    ? currencies.map((cur) => formatCurrency(netWorthByCurrency[cur], cur)).join(" + ")
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
          <div className={cn(
            "flex flex-col gap-0.5 mt-1 transition-all duration-300",
            privacyMode && "blur-md select-none",
          )}>
            {currencies.map((cur) => (
              <span key={cur} className="stat-value text-white text-sm font-mono">
                {formatCurrency(netWorthByCurrency[cur], cur)}
              </span>
            ))}
          </div>
        )}
      </StatCard>
      <StatCard
        label="Income This Month"
        value={formatCurrency(stats.income)}
        icon={<TrendingUp size={22} />}
        iconBg="rgba(16,185,129,0.2)"
        iconColor="#34d399"
        trendUp
        privacyMode={privacyMode}
      />
      <StatCard
        label="Expenses This Month"
        value={formatCurrency(stats.expenses)}
        icon={<TrendingDown size={22} />}
        iconBg="rgba(244,63,94,0.2)"
        iconColor="#fb7185"
        trendUp={false}
        privacyMode={privacyMode}
      />
      <StatCard
        label="Savings Rate"
        value={`${stats.savingsRate}%`}
        icon={<Activity size={22} />}
        iconBg="rgba(14,165,233,0.2)"
        iconColor="#38bdf8"
        trend={
          stats.savings >= 0
            ? `+${formatCurrency(stats.savings)} saved`
            : `${formatCurrency(Math.abs(stats.savings))} deficit`
        }
        trendUp={stats.savings >= 0}
        privacyMode={privacyMode}
      />
    </div>
  );
}
