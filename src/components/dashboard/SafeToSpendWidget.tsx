import { useState } from "react";
import { Sparkles, ShieldCheck, AlertTriangle, AlertCircle, Edit3, Check, Calendar } from "lucide-react";
import { useStore } from "../../store/useStore";
import { formatCurrency, cn } from "../../lib/utils";

export function SafeToSpendWidget() {
  const { getSafeToSpend, monthlyBudgetTarget, setMonthlyBudgetTarget, privacyMode } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tempBudget, setTempBudget] = useState(monthlyBudgetTarget ? String(monthlyBudgetTarget) : "");

  const safeData = getSafeToSpend();
  const {
    dailyAllowance,
    totalRemaining,
    remainingDays,
    daysInMonth,
    currentDay,
    status,
    monthlyBase,
    fixedUpcomingBills,
    monthToDateExpenses,
  } = safeData;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempBudget);
    if (!isNaN(val) && val >= 0) {
      setMonthlyBudgetTarget(val);
    }
    setIsEditing(false);
  };

  const statusConfig = {
    safe: {
      label: "Safe Pace",
      bgBadge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      glow: "from-emerald-600/20 via-blue-600/10 to-transparent",
      borderColor: "border-emerald-500/30",
      icon: <ShieldCheck size={16} className="text-emerald-400" />,
      subtext: "You are on track with your monthly spending limit.",
    },
    caution: {
      label: "Caution Pace",
      bgBadge: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      glow: "from-amber-600/20 via-orange-600/10 to-transparent",
      borderColor: "border-amber-500/30",
      icon: <AlertTriangle size={16} className="text-amber-400" />,
      subtext: "Spending is slightly ahead of your daily target pace.",
    },
    overpace: {
      label: "Over Budget Pace",
      bgBadge: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      glow: "from-rose-600/20 via-rose-900/10 to-transparent",
      borderColor: "border-rose-500/30",
      icon: <AlertCircle size={16} className="text-rose-400" />,
      subtext: "Commitments & expenses have exceeded target allowance.",
    },
  }[status];

  // Month progress percentage
  const monthProgress = Math.round((currentDay / daysInMonth) * 100);
  const budgetSpentProgress =
    monthlyBase > 0 ? Math.min(100, Math.round(((monthToDateExpenses + fixedUpcomingBills) / monthlyBase) * 100)) : 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl bg-[#0F1420]/90 backdrop-blur-xl border p-5 sm:p-6 transition-all duration-300 shadow-xl",
        statusConfig.borderColor,
      )}
    >
      {/* Background ambient mesh glow */}
      <div
        className={cn(
          "absolute -right-20 -top-20 w-80 h-80 rounded-full bg-gradient-to-br blur-3xl pointer-events-none opacity-40",
          statusConfig.glow,
        )}
      />

      {/* Header bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
            <Sparkles size={16} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Safe-to-Spend Daily Engine
            </h2>
            <p className="text-[11px] text-white/40">
              Personal CFO calculated daily variable allowance
            </p>
          </div>
        </div>

        {/* Status indicator badge */}
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border",
              statusConfig.bgBadge,
            )}
          >
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </div>

          <button
            onClick={() => {
              setTempBudget(monthlyBudgetTarget ? String(monthlyBudgetTarget) : "");
              setIsEditing(!isEditing);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-white/60 hover:text-white border border-white/10 transition-colors"
            title="Set target monthly spending"
          >
            <Edit3 size={12} />
            <span className="hidden sm:inline">Set Target</span>
          </button>
        </div>
      </div>

      {/* Inline Budget Setter Form if open */}
      {isEditing && (
        <form
          onSubmit={handleSaveBudget}
          className="relative z-10 my-3 p-3 rounded-xl bg-white/[0.04] border border-white/10 flex items-center gap-2 animate-fade-in"
        >
          <span className="text-xs text-white/60 font-medium">Monthly Target (EGP):</span>
          <input
            type="number"
            min="0"
            step="100"
            value={tempBudget}
            onChange={(e) => setTempBudget(e.target.value)}
            placeholder="e.g. 25000 (0 uses income)"
            className="flex-1 bg-black/40 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-blue-500"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Check size={14} />
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-2 py-1.5 text-white/40 hover:text-white text-xs"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Main Hero Metric: Big Daily Allowance */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-5 mt-4 items-center">
        {/* Left Column: Big Daily Number */}
        <div className="md:col-span-7 space-y-1">
          <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase">
            Today's Safe Allowance
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-4xl sm:text-5xl font-black font-mono tracking-tight tabular-nums text-white drop-shadow-md transition-all duration-300",
                privacyMode && "privacy-blur",
              )}
            >
              {formatCurrency(dailyAllowance, "EGP")}
            </span>
            <span className="text-sm font-medium text-white/50">/ day</span>
          </div>
          <p className="text-xs text-white/50 pt-0.5">{statusConfig.subtext}</p>
        </div>

        {/* Right Column: Month Timeline & Remaining Days */}
        <div className="md:col-span-5 bg-white/[0.03] rounded-xl p-3.5 border border-white/[0.06] space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-white/60">
              <Calendar size={13} className="text-blue-400" />
              <span>Remaining Days</span>
            </span>
            <span className="font-mono font-bold text-white">
              {remainingDays} <span className="text-white/40 text-[10px]">of {daysInMonth}</span>
            </span>
          </div>

          {/* Month Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-white/40">
              <span>Day {currentDay} ({monthProgress}%)</span>
              <span>Committed {budgetSpentProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/[0.08] overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                style={{ width: `${monthProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Pillars Footer */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5 pt-4 border-t border-white/[0.06]">
        {/* Base budget/income */}
        <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
          <span className="text-[10px] text-white/40 font-medium uppercase block">
            {monthlyBudgetTarget > 0 ? "Target Budget" : "Monthly Income"}
          </span>
          <span
            className={cn(
              "text-xs sm:text-sm font-mono font-bold text-white tabular-nums",
              privacyMode && "privacy-blur",
            )}
          >
            {formatCurrency(monthlyBase, "EGP")}
          </span>
        </div>

        {/* Upcoming Bills */}
        <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
          <span className="text-[10px] text-amber-400/80 font-medium uppercase block">
            Fixed Bills (MTD)
          </span>
          <span
            className={cn(
              "text-xs sm:text-sm font-mono font-bold text-amber-300 tabular-nums",
              privacyMode && "privacy-blur",
            )}
          >
            -{formatCurrency(fixedUpcomingBills, "EGP")}
          </span>
        </div>

        {/* MTD Variable Expenses */}
        <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
          <span className="text-[10px] text-rose-400/80 font-medium uppercase block">
            Variable Spent
          </span>
          <span
            className={cn(
              "text-xs sm:text-sm font-mono font-bold text-rose-300 tabular-nums",
              privacyMode && "privacy-blur",
            )}
          >
            -{formatCurrency(monthToDateExpenses, "EGP")}
          </span>
        </div>

        {/* Pool Remaining */}
        <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
          <span className="text-[10px] text-emerald-400/80 font-medium uppercase block">
            Total Remaining
          </span>
          <span
            className={cn(
              "text-xs sm:text-sm font-mono font-bold text-emerald-400 tabular-nums",
              privacyMode && "privacy-blur",
            )}
          >
            {formatCurrency(totalRemaining, "EGP")}
          </span>
        </div>
      </div>
    </div>
  );
}
