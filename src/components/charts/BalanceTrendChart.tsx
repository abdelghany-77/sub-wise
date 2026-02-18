import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/50 text-xs mb-1">{label}</p>
      <p className="text-white font-bold font-mono">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function BalanceTrendChart() {
  const { transactions, accounts } = useStore();

  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    // Sort transactions by date ascending
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Current total balance is the "now" point
    const currentBalance = accounts.reduce((s, a) => s + a.balance, 0);

    // Walk backwards from now to reconstruct historical balance
    const today = new Date();
    const dateSet = new Set<string>();
    sorted.forEach((tx) => dateSet.add(tx.date));

    // Build a map of net change per day
    const dailyChange = new Map<string, number>();
    for (const tx of sorted) {
      const delta =
        tx.type === "income"
          ? tx.amount
          : tx.type === "expense"
            ? -tx.amount
            : 0;
      dailyChange.set(tx.date, (dailyChange.get(tx.date) ?? 0) + delta);
    }

    const sortedDates = Array.from(dateSet).sort();

    // Forward simulation from earliest balance
    // Starting from current balance, reverse back to start
    let balance = currentBalance;

    const allDates = sortedDates;
    // Add today if not included
    const todayStr = today.toISOString().split("T")[0];
    if (!allDates.includes(todayStr)) allDates.push(todayStr);
    allDates.sort();

    // Walk backwards
    const reversed = [...allDates].reverse();
    const reversedPoints: { date: string; balance: number }[] = [];
    reversedPoints.push({ date: todayStr, balance: currentBalance });

    for (let i = 0; i < reversed.length; i++) {
      const d = reversed[i];
      if (d === todayStr) continue;
      const change = dailyChange.get(d) ?? 0;
      balance -= change;
      reversedPoints.push({ date: d, balance: Math.max(0, balance) });
    }

    reversedPoints.sort((a, b) => a.date.localeCompare(b.date));

    // Format dates for display
    return reversedPoints.map((p) => ({
      date: new Date(p.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      balance: Math.round(p.balance),
    }));
  }, [transactions, accounts]);

  if (chartData.length < 2) {
    return (
      <Card>
        <h3 className="section-title mb-6">Balance Trend</h3>
        <div className="flex items-center justify-center h-48 text-white/30 text-sm">
          Add more transactions to see balance history
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="section-title mb-1">Balance Trend</h3>
      <p className="text-xs text-white/40 mb-6">Net worth over time</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="#7c3aed"
            strokeWidth={2.5}
            fill="url(#balanceGradient)"
            dot={false}
            activeDot={{
              r: 5,
              fill: "#7c3aed",
              stroke: "#fff",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
