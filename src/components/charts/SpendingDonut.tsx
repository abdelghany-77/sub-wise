import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency, cn } from "../../lib/utils";
import { CATEGORY_COLORS } from "../../types";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#111827] border border-white/10 rounded-xl p-2.5 shadow-xl">
      <p className="text-white/60 text-[11px] mb-0.5">{item.name}</p>
      <p className="text-white font-bold font-mono text-xs">
        {formatCurrency(item.value)}
      </p>
    </div>
  );
}

const RADIAN = Math.PI / 180;
interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}
function CustomLabel({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: LabelProps) {
  if (percent < 0.08) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={9}
      fontWeight="700"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function SpendingDonut() {
  const { transactions, privacyMode } = useStore();

  const data = useMemo(() => {
    const now = new Date();
    const byCategory = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      const d = new Date(tx.date);
      if (
        d.getMonth() !== now.getMonth() ||
        d.getFullYear() !== now.getFullYear()
      )
        continue;
      byCategory.set(
        tx.category,
        (byCategory.get(tx.category) ?? 0) + tx.amount,
      );
    }
    return Array.from(byCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // top 6 categories
  }, [transactions]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <Card className="h-[320px] flex flex-col justify-between p-4 sm:p-5">
        <div>
          <h3 className="text-sm font-semibold text-white">Category Breakdown</h3>
          <p className="text-[11px] text-white/40">Monthly expense allocation</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-white/30 text-xs">
          No expense data yet this month
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-[320px] flex flex-col justify-between p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Category Breakdown</h3>
          <p
            className={cn(
              "text-[11px] text-white/40",
              privacyMode && "privacy-blur",
            )}
          >
            This month: {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 min-h-0 relative flex items-center justify-center transition-all duration-300 py-1",
          privacyMode && "privacy-blur pointer-events-none",
        )}
      >
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={74}
              paddingAngle={3}
              dataKey="value"
              labelLine={false}
              label={CustomLabel}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={CATEGORY_COLORS[entry.name] ?? "#7c3aed"}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Compact Legend Grid (max 4-6 items) */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-2 border-t border-white/[0.04]">
        {data.slice(0, 4).map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: CATEGORY_COLORS[entry.name] ?? "#7c3aed",
              }}
            />
            <span className="text-[10px] text-white/60 truncate">
              {entry.name}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
