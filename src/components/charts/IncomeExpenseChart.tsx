import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency, cn } from "../../lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/50 text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-mono font-medium" style={{ color: p.color }}>
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
}

export function IncomeExpenseChart() {
  const { transactions, accounts, privacyMode } = useStore();

  const chartData = useMemo(() => {
    const now = new Date();
    const months: { key: string; label: string; income: number; expense: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      months.push({ key, label, income: 0, expense: 0 });
    }

    for (const tx of transactions) {
      if (tx.type === "transfer") continue;
      const txMonth = tx.date.slice(0, 7);
      const entry = months.find((m) => m.key === txMonth);
      if (entry) {
        if (tx.type === "income") entry.income += tx.amount;
        else entry.expense += tx.amount;
      }
    }

    return months;
  }, [transactions, accounts]);

  if (chartData.every((d) => d.income === 0 && d.expense === 0)) {
    return (
      <Card>
        <h3 className="section-title mb-6">Income vs Expenses</h3>
        <div className="flex items-center justify-center h-48 text-white/30 text-sm">
          No data for the last 6 months
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="section-title mb-1">Income vs Expenses</h3>
      <p className="text-xs text-white/40 mb-6">Last 6 months comparison</p>
      <div className={cn("transition-all duration-300", privacyMode && "blur-lg select-none pointer-events-none")}>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={40} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }} />
            <Bar dataKey="income" name="Income" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="expense" name="Expenses" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
