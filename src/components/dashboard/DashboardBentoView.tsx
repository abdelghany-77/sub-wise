import { useMemo } from "react";
import {
  Wallet,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { BalanceTrendChart } from "../charts/BalanceTrendChart";
import { SpendingDonut } from "../charts/SpendingDonut";
import { RecentTransactions } from "./RecentTransactions";
import { UpcomingBillsWidget } from "./UpcomingBillsWidget";
import { formatCurrency, getFinancialCycle, cn } from "../../lib/utils";
import type { Page } from "../layout/Sidebar";

interface Props {
  onNavigate: (page: Page) => void;
}

export function DashboardBentoView({ onNavigate }: Props) {
  const {
    getNetWorthBreakdown,
    getSafeToSpend,
    transactions,
    privacyMode,
    togglePrivacyMode,
    settings,
  } = useStore();

  const breakdown = getNetWorthBreakdown();
  const safeData = getSafeToSpend();
  const { dailyAllowance, remainingDays, daysInMonth, currentDay, status } = safeData;

  const cycle = useMemo(
    () => getFinancialCycle(new Date(), settings.monthStartsOnDay ?? 1),
    [settings.monthStartsOnDay],
  );

  // Financial Cycle / Month-to-date Cashflow Stats
  const { mtdIncome, mtdExpenses, savingsRate, isSavingsPositive } = useMemo(() => {
    const mtdTxs = transactions.filter((tx) => cycle.isDateInCycle(tx.date) && !tx.isIou);

    let inc = 0;
    let exp = 0;
    for (const tx of mtdTxs) {
      if (tx.type === "income") inc += tx.amount;
      if (tx.type === "expense") exp += tx.amount;
    }

    const net = inc - exp;
    const rate = inc > 0 ? Math.round((net / inc) * 100) : exp > 0 ? -100 : 0;

    return {
      mtdIncome: inc,
      mtdExpenses: exp,
      savingsRate: rate,
      isSavingsPositive: net >= 0,
    };
  }, [transactions, cycle]);

  // Status config for Safe-To-Spend
  const safeStatusConfig = {
    safe: {
      label: "On Track",
      badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      icon: <ShieldCheck size={13} className="text-emerald-400" />,
    },
    caution: {
      label: "Tight",
      badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      icon: <AlertTriangle size={13} className="text-amber-400" />,
    },
    overpace: {
      label: "Over Pace",
      badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
      icon: <AlertCircle size={13} className="text-rose-400" />,
    },
  }[status];

  // Month day progress
  const monthDayPercent = Math.min(100, Math.round((currentDay / daysInMonth) * 100));

  return (
    <div className="space-y-6">
      {/* =========================================================================
          TIER 1: HERO BENTO ROW (grid-cols-1 lg:grid-cols-12 gap-5)
          - Net Worth Hero Card (lg:col-span-5)
          - Safe-to-Spend Card (lg:col-span-4)
          - Monthly Cashflow Card (lg:col-span-3)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Net Worth Hero Card (lg:col-span-5) */}
        <div className="lg:col-span-5 rounded-2xl bg-gradient-to-br from-[#12192B]/95 via-[#0D121F]/95 to-[#0A0E17]/95 border border-blue-500/25 p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between group">
          {/* Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-blue-500/15 blur-3xl pointer-events-none" />

          {/* Top Row: Label & Privacy Toggle */}
          <div className="flex items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                <Wallet size={16} />
              </div>
              <span className="text-xs font-semibold text-blue-300/90 tracking-wide uppercase">
                Total Net Worth
              </span>
            </div>

            <button
              onClick={togglePrivacyMode}
              className="p-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/50 hover:text-white border border-white/10 transition-colors"
              title={privacyMode ? "Show Balances" : "Hide Balances"}
              aria-label="Toggle Privacy Mode"
            >
              {privacyMode ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Large Total Balance */}
          <div className="my-4 relative z-10">
            <p
              className={cn(
                "text-3xl sm:text-4xl lg:text-[40px] font-black font-mono tracking-tight tabular-nums text-white drop-shadow-md leading-none",
                privacyMode && "privacy-blur",
              )}
            >
              {formatCurrency(breakdown.totalNetWorth, "EGP")}
            </p>
            <p className="text-[11px] text-white/40 mt-1.5">
              Consolidated wealth across all accounts & gold
            </p>
          </div>

          {/* Subtle Pills Underneath: Liquid Cash vs Assets/Gold */}
          <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-2 relative z-10">
            <div
              className={cn(
                "px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs font-mono font-medium text-blue-300 flex items-center gap-1.5",
                privacyMode && "privacy-blur",
              )}
            >
              <Coins size={12} className="text-blue-400" />
              <span>Liquid Cash:</span>
              <span className="font-bold">{formatCurrency(breakdown.liquidCash, "EGP")}</span>
            </div>

            <div
              className={cn(
                "px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-mono font-medium text-amber-300 flex items-center gap-1.5",
                privacyMode && "privacy-blur",
              )}
            >
              <Sparkles size={12} className="text-amber-400" />
              <span>Assets/Gold:</span>
              <span className="font-bold">{formatCurrency(breakdown.hardAssets, "EGP")}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Safe-to-Spend Card (lg:col-span-4) */}
        <div className="lg:col-span-4 rounded-2xl bg-gradient-to-br from-[#131A26]/95 to-[#0E131E]/95 border border-white/[0.08] p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between group">
          {/* Header Row: Label & Status Badge */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <span className="text-xs font-semibold text-white/80 tracking-wide uppercase">
                Safe-to-Spend
              </span>
            </div>

            {/* Status Badge */}
            <div
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                safeStatusConfig.badgeClass,
              )}
            >
              {safeStatusConfig.icon}
              <span>{safeStatusConfig.label}</span>
            </div>
          </div>

          {/* Daily Allowance Number */}
          <div className="my-3">
            <span className="text-[10px] text-white/40 uppercase font-medium tracking-wider block">
              Today's Daily Allowance
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span
                className={cn(
                  "text-3xl sm:text-4xl font-black font-mono tracking-tight tabular-nums text-white",
                  privacyMode && "privacy-blur",
                )}
              >
                {formatCurrency(dailyAllowance, "EGP")}
              </span>
              <span className="text-xs font-medium text-white/40">/ day</span>
            </div>
          </div>

          {/* Remaining Days & Month Progress */}
          <div className="pt-3 border-t border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-white/50 text-[11px]">
                <Calendar size={12} className="text-blue-400" />
                <span>{safeData.cycleLabel || "Cycle Pace"}</span>
              </span>
              <span className="text-[11px] font-mono text-white/80 font-medium">
                <strong className="text-white">{remainingDays} days</strong> left of {daysInMonth}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${monthDayPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Cashflow Card (lg:col-span-3) */}
        <div className="lg:col-span-3 rounded-2xl bg-gradient-to-br from-[#131A26]/95 to-[#0E131E]/95 border border-white/[0.08] p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
              <div>
                <span className="text-xs font-semibold text-white/80 tracking-wide uppercase block">
                  {settings.monthStartsOnDay && settings.monthStartsOnDay > 1 ? "Cycle Cashflow" : "Monthly Cashflow"}
                </span>
                <span className="text-[10px] text-teal-300/80 font-mono">
                  {cycle.cycleLabel}
                </span>
              </div>
            </div>

            {/* Net Savings Percentage */}
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border",
                isSavingsPositive
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/30",
              )}
            >
              {savingsRate >= 0 ? `+${savingsRate}%` : `${savingsRate}%`} saved
            </span>
          </div>

          {/* Stacked Compact View: Inflow vs Outflow */}
          <div className="space-y-2.5 my-3">
            {/* Inflow */}
            <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <ArrowDownLeft size={13} className="text-emerald-400" />
                <span>Inflow</span>
              </div>
              <span
                className={cn(
                  "text-xs sm:text-sm font-bold font-mono text-emerald-400 tabular-nums",
                  privacyMode && "privacy-blur",
                )}
              >
                +{formatCurrency(mtdIncome, "EGP")}
              </span>
            </div>

            {/* Outflow */}
            <div className="flex items-center justify-between bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
              <div className="flex items-center gap-1.5 text-xs text-white/60">
                <ArrowUpRight size={13} className="text-rose-400" />
                <span>Outflow</span>
              </div>
              <span
                className={cn(
                  "text-xs sm:text-sm font-bold font-mono text-rose-400 tabular-nums",
                  privacyMode && "privacy-blur",
                )}
              >
                -{formatCurrency(mtdExpenses, "EGP")}
              </span>
            </div>
          </div>

          {/* Footer Subtitle */}
          <div className="pt-2 border-t border-white/[0.06] text-[10px] text-white/40 flex items-center justify-between">
            <span>Net flow this {settings.monthStartsOnDay && settings.monthStartsOnDay > 1 ? "cycle" : "month"}</span>
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

      {/* =========================================================================
          TIER 2: VISUAL ANALYTICS (grid-cols-1 lg:grid-cols-12 gap-5)
          - Balance Trend AreaChart (lg:col-span-8 h-[320px])
          - Category Breakdown Donut (lg:col-span-4 h-[320px])
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8">
          <BalanceTrendChart />
        </div>
        <div className="lg:col-span-4">
          <SpendingDonut />
        </div>
      </div>

      {/* =========================================================================
          TIER 3: ACTIONABLE FEEDS (grid-cols-1 lg:grid-cols-2 gap-5)
          - Left: Recent Activity (top 5 transactions in clean list layout, View All link)
          - Right: Upcoming Bills (Next 7 Days, max 3-4 bills, quick Pay button, Manage All)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <RecentTransactions onViewAll={() => onNavigate("transactions")} />
        <UpcomingBillsWidget onViewAll={() => onNavigate("commitments")} />
      </div>
    </div>
  );
}
