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
import { formatCurrency, cn } from "../../lib/utils";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl p-2.5 shadow-xl">
      <p className="text-white/50 text-[11px] mb-0.5">{label}</p>
      <p className="text-white font-bold font-mono text-xs">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function BalanceTrendChart() {
  const { transactions, accounts, privacyMode } = useStore();

  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    // Sort transactions by date ascending
    const sorted = [...transactions].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    // Current total balance excluding savings
    const currentBalance = accounts
      .filter((a) => a.type !== "savings")
      .reduce((s, a) => s + a.balance, 0);

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

    const uniqueDates = Array.from(dateSet).sort();
    if (uniqueDates.length === 0) return [];

    let running = currentBalance;
    const history: Array<{ date: string; balance: number }> = [];

    // Add today's point
    const todayStr = new Date().toISOString().split("T")[0];
    history.unshift({
      date: todayStr.slice(5),
      balance: running,
    });

    // Walk backwards
    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const d = uniqueDates[i];
      const change = dailyChange.get(d) ?? 0;
      running -= change;
      history.unshift({
        date: d.slice(5),
        balance: Math.max(0, running),
      });
    }

    return history.slice(-14); // show last 14 data points
  }, [transactions, accounts]);

  if (chartData.length < 2) {
    return (
      <Card className="h-[320px] flex flex-col justify-between p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Balance Trend</h3>
          <p className="text-[11px] text-white/40">Historical balance progression</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-white/30 text-xs">
          Need at least 2 transactions to display trend
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[320px] flex flex-col justify-between p-4 sm:p-5">
      <div>
        <h3 className="text-sm font-semibold text-white">Balance Trend</h3>
        <p className="text-[11px] text-white/40">Historical balance progression</p>
      </div>

      <div
        className={cn(
          "flex-1 min-h-0 pt-2 transition-all duration-300",
          privacyMode && "privacy-blur pointer-events-none",
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 0, left: -10 }}
          >
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={35}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="balance"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#balanceGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: "#3B82F6",
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
