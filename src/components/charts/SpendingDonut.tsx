import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { formatCurrency } from "../../lib/utils";
import { CATEGORY_COLORS } from "../../types";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1">{item.name}</p>
      <p className="text-white font-bold font-mono">
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
  if (percent < 0.05) return null;
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
      fontSize={11}
      fontWeight="600"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export function SpendingDonut() {
  const { transactions } = useStore();

  const data = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const tx of transactions) {
      if (tx.type !== "expense") continue;
      byCategory.set(
        tx.category,
        (byCategory.get(tx.category) ?? 0) + tx.amount,
      );
    }
    return Array.from(byCategory.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // top 8 cats
  }, [transactions]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="section-title mb-6">Spending Breakdown</h3>
        <div className="flex items-center justify-center h-48 text-white/30 text-sm">
          No expense data yet
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="section-title mb-1">Spending Breakdown</h3>
      <p className="text-xs text-white/40 mb-6">
        Total expenses: {formatCurrency(total)}
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
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
          <Legend
            formatter={(value) => (
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                {value}
              </span>
            )}
            iconSize={10}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
