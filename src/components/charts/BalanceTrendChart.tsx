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
import {
  formatCurrency,
  accountBalanceInBase,
  amountInBase,
  todayISO,
  cn,
} from "../../lib/utils";

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
      <p className="text-white font-bold font-mono text-xs tabular-nums">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function BalanceTrendChart() {
  const { transactions, accounts, exchangeRates, privacyMode } = useStore();

  const chartData = useMemo(() => {
    if (transactions.length === 0) return [];

    const accMap = new Map(accounts.map((a) => [a.id, a]));

    // Current total balance across ALL accounts expressed in base currency (EGP)
    const currentTotalBase = accounts.reduce(
      (sum, acc) => sum + accountBalanceInBase(acc, exchangeRates),
      0,
    );

    // Aggregate net base-currency balance change per calendar day
    // Transfers between own accounts do not change total portfolio balance (except minor FX spread)
    const dailyChange = new Map<string, number>();
    const dateSet = new Set<string>();

    for (const tx of transactions) {
      dateSet.add(tx.date);
      let delta = 0;
      if (tx.type === "income") {
        delta = amountInBase(tx.amount, accMap.get(tx.accountId), exchangeRates);
      } else if (tx.type === "expense") {
        delta = -amountInBase(tx.amount, accMap.get(tx.accountId), exchangeRates);
      } else if (tx.type === "transfer" && tx.toAccountId) {
        const outBase = amountInBase(
          tx.amount,
          accMap.get(tx.accountId),
          exchangeRates,
        );
        const inBase = amountInBase(
          tx.toAmount ?? tx.amount,
          accMap.get(tx.toAccountId),
          exchangeRates,
        );
        delta = inBase - outBase;
      }
      dailyChange.set(tx.date, (dailyChange.get(tx.date) ?? 0) + delta);
    }

    const todayStr = todayISO();
    const uniqueDates = Array.from(dateSet)
      .filter((d) => d <= todayStr)
      .sort();

    if (uniqueDates.length === 0) return [];

    let running = currentTotalBase;
    const history: Array<{ date: string; balance: number }> = [];

    // Walk backwards from today's balance
    const lastTxDate = uniqueDates[uniqueDates.length - 1];
    if (lastTxDate !== todayStr) {
      history.unshift({
        date: todayStr.slice(5),
        balance: Math.round(running),
      });
    }

    for (let i = uniqueDates.length - 1; i >= 0; i--) {
      const d = uniqueDates[i];
      history.unshift({
        date: d.slice(5),
        balance: Math.round(running),
      });
      running -= dailyChange.get(d) ?? 0;
    }

    return history.slice(-14);
  }, [transactions, accounts, exchangeRates]);

  if (chartData.length < 2) {
    return (
      <Card className="h-full min-h-[270px] flex flex-col justify-between p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Balance Trend</h3>
          <p className="text-[11px] text-white/40">
            Total portfolio progression (EGP)
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center text-white/30 text-xs text-center">
          Need at least 2 transaction days to display trend
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full min-h-[270px] flex flex-col justify-between p-4 sm:p-5">
      <div>
        <h3 className="text-sm font-semibold text-white">Balance Trend</h3>
        <p className="text-[11px] text-white/40">
          Total portfolio progression (EGP)
        </p>
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
              tickFormatter={(v: number) =>
                Math.abs(v) >= 1000
                  ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
                  : String(v)
              }
              width={40}
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
