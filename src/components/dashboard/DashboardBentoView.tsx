import { useState, useMemo } from "react";
import {
  Wallet,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Edit3,
  Check,
  Sun,
  Moon,
  Sunrise,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { useDashboardInsights } from "../../hooks/useDashboardInsights";
import { InsightsStrip } from "./InsightsStrip";
import { BalanceTrendChart } from "../charts/BalanceTrendChart";
import { SpendingDonut } from "../charts/SpendingDonut";
import { RecentTransactions } from "./RecentTransactions";
import { UpcomingBillsWidget } from "./UpcomingBillsWidget";
import { formatCurrency, getFinancialCycle, amountInBase, cn } from "../../lib/utils";
import type { Page } from "../layout/Sidebar";

interface Props {
  onNavigate: (page: Page) => void;
}

// ── Greeting helper ──────────────────────────────────────────────

function getGreeting(): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", icon: <Sunrise size={16} className="text-amber-400" /> };
  if (h < 17) return { text: "Good Afternoon", icon: <Sun size={16} className="text-orange-400" /> };
  return { text: "Good Evening", icon: <Moon size={16} className="text-indigo-400" /> };
}

// ── Safe-to-Spend status config ──────────────────────────────────

const SAFE_STATUS = {
  safe: {
    label: "On Track",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: <ShieldCheck size={13} className="text-emerald-400" />,
    ringColor: "#10b981",
  },
  caution: {
    label: "Tight",
    badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: <AlertTriangle size={13} className="text-amber-400" />,
    ringColor: "#f59e0b",
  },
  overpace: {
    label: "Over Pace",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    icon: <AlertCircle size={13} className="text-rose-400" />,
    ringColor: "#ef4444",
  },
} as const;

// ── Progress Ring Component ──────────────────────────────────────

function ProgressRing({
  percent,
  size = 100,
  stroke = 6,
  color = "#3b82f6",
  bgColor = "rgba(255,255,255,0.08)",
  children,
}: {
  percent: number;
  size?: number;
  stroke?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const p = Math.min(100, Math.max(0, percent));
  const offset = circumference - (p / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={bgColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ── Mini Sparkline (14 bars) ─────────────────────────────────────

function SpendingSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className="w-[4px] rounded-full bg-gradient-to-t from-blue-500/60 to-blue-400/40 transition-all duration-300"
          style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

// ── Main Dashboard Component ─────────────────────────────────────

export function DashboardBentoView({ onNavigate }: Props) {
  const {
    getNetWorthBreakdown,
    getSafeToSpend,
    transactions,
    accounts,
    exchangeRates,
    privacyMode,
    togglePrivacyMode,
    settings,
    monthlyBudgetTarget,
    setMonthlyBudgetTarget,
  } = useStore();

  const { insights, stats } = useDashboardInsights();
  const breakdown = getNetWorthBreakdown();
  const safeData = getSafeToSpend();
  const { dailyAllowance, remainingDays, daysInMonth, currentDay, status } = safeData;

  const greeting = getGreeting();
  const safeStatusConfig = SAFE_STATUS[status];

  const cycle = useMemo(
    () => getFinancialCycle(new Date(), settings.monthStartsOnDay ?? 1),
    [settings.monthStartsOnDay],
  );

  // Month-to-date cashflow (converted to base currency & matching insights)
  const mtdIncome = stats.income;
  const mtdExpenses = stats.expenses;
  const savingsRate = stats.savingsRate;
  const isSavingsPositive = mtdIncome >= mtdExpenses;

  // 14-day spending sparkline (converted to base currency)
  const sparklineData = useMemo(() => {
    const bars: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const total = transactions
        .filter((tx) => tx.type === "expense" && tx.date === ds && !tx.isIou)
        .reduce((s, tx) => {
          const acc = accounts.find((a) => a.id === tx.accountId);
          return s + amountInBase(tx.amount, acc, exchangeRates);
        }, 0);
      bars.push(total);
    }
    return bars;
  }, [transactions, accounts, exchangeRates]);

  // Budget progress percent
  const monthDayPercent = Math.min(100, Math.round((currentDay / daysInMonth) * 100));
  const spendPercent = safeData.monthlyBase > 0
    ? Math.min(100, Math.round((safeData.monthToDateExpenses / safeData.monthlyBase) * 100))
    : 0;

  // Inline budget target editor
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempBudget, setTempBudget] = useState(monthlyBudgetTarget > 0 ? String(monthlyBudgetTarget) : "");

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempBudget);
    if (!isNaN(val) && val >= 0) setMonthlyBudgetTarget(val);
    setIsEditingTarget(false);
  };

  // Net worth 30-day delta
  const nwDelta30d = stats.netWorthChange30d;
  const nwDeltaPositive = nwDelta30d >= 0;

  return (
    <div className="space-y-5">
      {/* ═══════════════════════════════════════════════════════════
          GREETING ROW
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {greeting.icon}
          <h2 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
            {greeting.text}
          </h2>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-mono text-white/60">
            <Calendar size={11} className="inline mr-1 text-blue-400" />
            {cycle.cycleLabel}
          </div>
          <button
            onClick={togglePrivacyMode}
            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white/50 hover:text-white border border-white/[0.08] transition-colors"
            title={privacyMode ? "Show Balances" : "Hide Balances"}
          >
            {privacyMode ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          HERO ROW: Net Worth · Safe-to-Spend · Cashflow
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ─── Card 1: Net Worth Hero ─── */}
        <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-[#12192B]/95 via-[#0D121F]/95 to-[#0A0E17]/95 border border-blue-500/25 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group">
          <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Wallet size={16} />
            </div>
            <span className="text-[11px] font-semibold text-blue-300/90 tracking-wider uppercase">
              Total Net Worth
            </span>
          </div>

          {/* Big Number */}
          <div className="my-3 relative z-10">
            <p
              className={cn(
                "text-3xl sm:text-[38px] font-black font-mono tracking-tight tabular-nums text-white drop-shadow-md leading-none",
                privacyMode && "privacy-blur",
              )}
            >
              {formatCurrency(breakdown.totalNetWorth, "EGP")}
            </p>
            {/* 30-day delta pill */}
            <div className="flex items-center gap-2 mt-2">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border font-mono",
                  nwDeltaPositive
                    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/25"
                    : "bg-rose-500/15 text-rose-300 border-rose-500/25",
                  privacyMode && "privacy-blur",
                )}
              >
                {nwDeltaPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {nwDeltaPositive ? "+" : ""}
                {formatCurrency(nwDelta30d, "EGP")}
              </span>
              <span className="text-[10px] text-white/30">30 days</span>
            </div>
          </div>

          {/* Breakdown Pills */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2 relative z-10">
            <div
              className={cn(
                "px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] font-mono font-medium text-blue-300 flex items-center gap-1.5",
                privacyMode && "privacy-blur",
              )}
            >
              <Coins size={11} className="text-blue-400" />
              Liquid {formatCurrency(breakdown.liquidCash, "EGP")}
            </div>
            <div
              className={cn(
                "px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono font-medium text-amber-300 flex items-center gap-1.5",
                privacyMode && "privacy-blur",
              )}
            >
              <Sparkles size={11} className="text-amber-400" />
              Assets {formatCurrency(breakdown.hardAssets, "EGP")}
            </div>
            {(breakdown.receivables > 0 || breakdown.payables > 0) && (
              <div
                className={cn(
                  "px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] font-mono font-medium text-purple-300 flex items-center gap-1.5",
                  privacyMode && "privacy-blur",
                )}
              >
                Net IOU {formatCurrency(breakdown.receivables - breakdown.payables, "EGP")}
              </div>
            )}
          </div>
        </div>

        {/* ─── Card 2: Safe-to-Spend ─── */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#131A26]/95 to-[#0E131E]/95 border border-white/[0.08] p-5 shadow-xl relative overflow-hidden flex flex-col justify-between group">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span className="text-[11px] font-semibold text-white/80 tracking-wider uppercase">
                Safe-to-Spend
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
                  safeStatusConfig.badgeClass,
                )}
              >
                {safeStatusConfig.icon}
                {safeStatusConfig.label}
              </div>
              <button
                onClick={() => {
                  setTempBudget(monthlyBudgetTarget > 0 ? String(monthlyBudgetTarget) : "");
                  setIsEditingTarget(!isEditingTarget);
                }}
                className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/40 hover:text-white transition-colors"
                title="Set spending target"
              >
                <Edit3 size={12} />
              </button>
            </div>
          </div>

          {/* Inline target editor */}
          {isEditingTarget && (
            <form
              onSubmit={handleSaveBudget}
              className="my-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center gap-2 animate-fade-in"
            >
              <span className="text-[10px] text-white/50 font-medium whitespace-nowrap">Target (EGP):</span>
              <input
                type="number"
                min="0"
                step="100"
                value={tempBudget}
                onChange={(e) => setTempBudget(e.target.value)}
                placeholder="0 = auto"
                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white placeholder-white/25 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0"
                autoFocus
              />
              <button type="submit" className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-medium flex items-center gap-1">
                <Check size={11} /> OK
              </button>
            </form>
          )}

          {/* Ring + Daily Allowance */}
          <div className="flex items-center gap-4 my-3">
            <ProgressRing
              percent={spendPercent}
              size={80}
              stroke={5}
              color={safeStatusConfig.ringColor}
            >
              <div className="text-center">
                <span className="text-[10px] text-white/40 block">spent</span>
                <span className="text-sm font-bold font-mono text-white">{spendPercent}%</span>
              </div>
            </ProgressRing>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-white/40 uppercase tracking-wider block">
                Daily Allowance
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span
                  className={cn(
                    "text-2xl sm:text-3xl font-black font-mono tracking-tight tabular-nums text-white",
                    privacyMode && "privacy-blur",
                  )}
                >
                  {formatCurrency(dailyAllowance, "EGP")}
                </span>
                <span className="text-[10px] font-medium text-white/30">/ day</span>
              </div>
              {stats.projectedSpend > 0 && (
                <p className={cn("text-[10px] text-white/35 mt-0.5", privacyMode && "privacy-blur")}>
                  Projected: {formatCurrency(Math.round(stats.projectedSpend), "EGP")} this cycle
                </p>
              )}
            </div>
          </div>

          {/* Cycle Progress */}
          <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-white/40">
                <Calendar size={10} className="inline mr-1 text-blue-400" />
                {safeData.cycleLabel || "Cycle"}
              </span>
              <span className="text-white/70 font-mono">
                <strong className="text-white">{remainingDays}d</strong> left of {daysInMonth}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${monthDayPercent}%` }}
              />
            </div>
            {!monthlyBudgetTarget && (
              <button
                onClick={() => {
                  setTempBudget("");
                  setIsEditingTarget(true);
                }}
                className="text-[10px] text-blue-400/70 hover:text-blue-400 transition-colors"
              >
                💡 Set a monthly target for better insights
              </button>
            )}
          </div>
        </div>

        {/* ─── Card 3: Cashflow ─── */}
        <div className="lg:col-span-3 rounded-2xl bg-gradient-to-br from-[#131A26]/95 to-[#0E131E]/95 border border-white/[0.08] p-5 shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-white/80 tracking-wider uppercase block">
                  {settings.monthStartsOnDay > 1 ? "Cycle Flow" : "Cashflow"}
                </span>
                <span className="text-[10px] text-teal-300/70 font-mono">{cycle.cycleLabel}</span>
              </div>
            </div>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border",
                isSavingsPositive
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/30",
              )}
            >
              {savingsRate >= 0 ? "+" : ""}{savingsRate}%
            </span>
          </div>

          {/* Sparkline */}
          <div className="my-3 flex items-end justify-center">
            <SpendingSparkline data={sparklineData} />
          </div>

          {/* Inflow / Outflow */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                <ArrowDownLeft size={12} className="text-emerald-400" /> Inflow
              </div>
              <span className={cn("text-xs font-bold font-mono text-emerald-400 tabular-nums", privacyMode && "privacy-blur")}>
                +{formatCurrency(mtdIncome, "EGP")}
              </span>
            </div>
            <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                <ArrowUpRight size={12} className="text-rose-400" /> Outflow
              </div>
              <span className={cn("text-xs font-bold font-mono text-rose-400 tabular-nums", privacyMode && "privacy-blur")}>
                -{formatCurrency(mtdExpenses, "EGP")}
              </span>
            </div>
          </div>

          {/* Net Flow Footer */}
          <div className="pt-2 border-t border-white/[0.06] text-[10px] text-white/40 flex items-center justify-between mt-auto">
            <span>Net {settings.monthStartsOnDay > 1 ? "cycle" : "month"}</span>
            <span
              className={cn(
                "font-mono font-bold",
                mtdIncome - mtdExpenses >= 0 ? "text-emerald-400" : "text-rose-400",
                privacyMode && "privacy-blur",
              )}
            >
              {mtdIncome - mtdExpenses >= 0 ? "+" : ""}
              {formatCurrency(mtdIncome - mtdExpenses, "EGP")}
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          INSIGHTS STRIP
          ═══════════════════════════════════════════════════════════ */}
      <InsightsStrip insights={insights} onNavigate={onNavigate} />

      {/* ═══════════════════════════════════════════════════════════
          CHARTS + RECENT ACTIVITY
          ═══════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:auto-rows-[300px]">
        <div className="lg:col-span-4 min-h-[270px]">
          <BalanceTrendChart />
        </div>
        <div className="lg:col-span-3 min-h-[270px]">
          <SpendingDonut />
        </div>
        <div className="lg:col-span-5 min-h-[270px]">
          <RecentTransactions onViewAll={() => onNavigate("transactions")} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          UPCOMING BILLS
          ═══════════════════════════════════════════════════════════ */}
      <UpcomingBillsWidget onViewAll={() => onNavigate("commitments")} />
    </div>
  );
}
