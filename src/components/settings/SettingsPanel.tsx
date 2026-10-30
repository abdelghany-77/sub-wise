import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Globe,
  Shield,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Target,
  Sliders,
  Database,
  CalendarDays,
  Sparkles,
  Check,
  Coins,
} from "lucide-react";
import { useStore, type AppSettings } from "../../store/useStore";
import { useToastStore } from "../../store/useToastStore";
import { Card } from "../ui/Card";
import { Select } from "../ui/FormFields";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import {
  formatCurrency,
  getFinancialCycle,
  parseLocalDate,
  cn,
} from "../../lib/utils";
import type {
  Account,
  Transaction,
  Budget,
  SavingsGoal,
  RecurringBill,
  Iou,
  ExchangeRates,
} from "../../types";

type TabId = "general" | "budget" | "data";

interface ImportPayload {
  accounts: Account[];
  transactions: Transaction[];
  budgets?: Budget[];
  savingsGoals?: SavingsGoal[];
  recurring?: RecurringBill[];
  ious?: Iou[];
  exchangeRates?: ExchangeRates;
  monthlyBudgetTarget?: number;
  settings?: Partial<AppSettings>;
}

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "general", label: "General", icon: Sliders },
  { id: "budget", label: "Budget", icon: Target },
  { id: "data", label: "Data", icon: Database },
];

const DATE_FORMATS = [
  { value: "MMM D, YYYY", label: "MMM D, YYYY — Oct 5, 2026 (Default)" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK/EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
];

const WEEK_START_OPTIONS = [
  { value: "saturday", label: "Saturday (Middle East / Egypt)" },
  { value: "sunday", label: "Sunday" },
  { value: "monday", label: "Monday (Standard)" },
];

const MONTH_START_DAYS = Array.from({ length: 31 }, (_, i) => {
  const day = i + 1;
  const suffix =
    day === 1 || day === 21 || day === 31
      ? "st"
      : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
          ? "rd"
          : "th";
  let label = `${day}${suffix} of every month`;
  if (day === 1) label += " (Standard Calendar Month)";
  if (day >= 25 && day <= 28) label += " (Common Payday)";
  return { value: String(day), label };
});

const TINTS = {
  blue: "bg-blue-500/15 text-blue-400",
  violet: "bg-violet-500/15 text-violet-400",
  amber: "bg-amber-500/15 text-amber-400",
  sky: "bg-sky-500/15 text-sky-400",
  emerald: "bg-emerald-500/15 text-emerald-400",
  rose: "bg-rose-500/15 text-rose-400",
} as const;

function formatShortDate(dateStr: string): string {
  return parseLocalDate(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function describeBackupAge(iso: string | null): string {
  if (!iso) return "Never";
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "Unknown";
  const days = Math.floor((Date.now() - time) / 864e5);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function isOptionalArray(value: unknown): boolean {
  return value === undefined || Array.isArray(value);
}

function SectionHeader({
  icon: Icon,
  tint,
  title,
  description,
  titleClassName,
}: {
  icon: LucideIcon;
  tint: keyof typeof TINTS;
  title: string;
  description: string;
  titleClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
          TINTS[tint],
        )}
      >
        <Icon size={17} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h3 className={cn("text-sm font-semibold text-white", titleClassName)}>
          {title}
        </h3>
        <p className="text-xs text-white/40 leading-snug">{description}</p>
      </div>
    </div>
  );
}

function Switch({
  checked,
  onChange,
  labelledBy,
}: {
  checked: boolean;
  onChange: () => void;
  labelledBy: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={onChange}
      className={cn(
        "relative w-11 h-6 rounded-full flex-shrink-0 transition-colors duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111827]",
        checked ? "bg-blue-600" : "bg-white/15 hover:bg-white/20",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200",
          checked && "translate-x-5",
        )}
      />
    </button>
  );
}

function ActionTile({
  icon: Icon,
  tint,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  tint: keyof typeof TINTS;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 p-3.5 rounded-xl text-left bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.16] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
    >
      <div
        className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105",
          TINTS[tint],
        )}
      >
        <Icon size={18} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-white/40 leading-snug">{description}</p>
      </div>
    </button>
  );
}

export function SettingsPanel() {
  const {
    privacyMode,
    togglePrivacyMode,
    settings,
    updateSettings,
    monthlyBudgetTarget,
    setMonthlyBudgetTarget,
    accounts,
    transactions,
    budgets,
    savingsGoals,
    recurring,
    ious,
    exchangeRates,
    importData,
    clearAll,
    lastBackupDate,
    isBackupNeeded,
    recordBackup,
  } = useStore();
  const addToast = useToastStore((s) => s.addToast);

  const privacyLabelId = useId();
  const [activeTab, setActiveTab] = useState<TabId>("general");

  const monthStartsOnDay = settings.monthStartsOnDay ?? 1;
  const currency = "EGP";
  const currentCycle = useMemo(
    () => getFinancialCycle(new Date(), monthStartsOnDay),
    [monthStartsOnDay],
  );

  const [budgetTargetInput, setBudgetTargetInput] = useState(
    monthlyBudgetTarget > 0 ? String(monthlyBudgetTarget) : "",
  );

  useEffect(() => {
    setBudgetTargetInput(
      monthlyBudgetTarget > 0 ? String(monthlyBudgetTarget) : "",
    );
  }, [monthlyBudgetTarget]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImport, setPendingImport] = useState<ImportPayload | null>(
    null,
  );
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const parsedTarget =
    budgetTargetInput.trim() === "" ? 0 : Number(budgetTargetInput);
  const targetValid = Number.isFinite(parsedTarget) && parsedTarget >= 0;
  const targetDirty = targetValid && parsedTarget !== monthlyBudgetTarget;
  const benchmarkBase = targetValid ? parsedTarget : monthlyBudgetTarget;
  const dailyBenchmark = benchmarkBase / Math.max(1, currentCycle.totalDays);

  const backupNeeded = isBackupNeeded();

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetValid) {
      addToast({ type: "error", message: "Enter a valid amount (0 or more)." });
      return;
    }
    setMonthlyBudgetTarget(parsedTarget);
    addToast({
      type: "success",
      message:
        parsedTarget > 0
          ? `Monthly target set to ${formatCurrency(parsedTarget, currency)}.`
          : "Monthly target cleared. Using income as the base.",
    });
  };

  const handleExport = () => {
    const now = new Date().toISOString();
    const payload = {
      exportedAt: now,
      version: "2.0",
      accounts,
      transactions,
      budgets,
      savingsGoals,
      recurring,
      ious,
      exchangeRates,
      settings,
      monthlyBudgetTarget,
      lastBackupDate: now,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `walleteer-backup-${now.split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordBackup();
    addToast({ type: "success", message: "Backup downloaded." });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const data = JSON.parse(
        await file.text(),
      ) as Partial<ImportPayload> | null;
      if (
        !data ||
        !Array.isArray(data.accounts) ||
        !Array.isArray(data.transactions) ||
        !isOptionalArray(data.budgets) ||
        !isOptionalArray(data.savingsGoals) ||
        !isOptionalArray(data.recurring) ||
        !isOptionalArray(data.ious)
      ) {
        throw new Error("Invalid file format");
      }
      setPendingImport({
        accounts: data.accounts,
        transactions: data.transactions,
        budgets: data.budgets,
        savingsGoals: data.savingsGoals,
        recurring: data.recurring,
        ious: data.ious,
        exchangeRates:
          data.exchangeRates && typeof data.exchangeRates === "object"
            ? data.exchangeRates
            : undefined,
        monthlyBudgetTarget:
          typeof data.monthlyBudgetTarget === "number"
            ? data.monthlyBudgetTarget
            : undefined,
        settings:
          data.settings && typeof data.settings === "object"
            ? data.settings
            : undefined,
      });
    } catch {
      addToast({
        type: "error",
        message:
          "Import failed. Make sure this is a valid Walleteer JSON backup file.",
      });
    } finally {
      input.value = "";
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    importData(pendingImport);
    addToast({
      type: "success",
      message: `Restored ${pendingImport.accounts.length} accounts and ${pendingImport.transactions.length} transactions.`,
    });
    setPendingImport(null);
  };

  const handleClearAll = () => {
    clearAll();
    addToast({ type: "info", message: "All local data has been cleared." });
  };

  const dataStats = [
    { label: "Accounts", value: accounts.length },
    { label: "Transactions", value: transactions.length },
    { label: "Recurring", value: recurring.length },
    { label: "Budgets", value: budgets.length },
  ];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
          Settings & Backup
        </h2>
        <p className="text-xs text-white/40">
          Preferences, budget target and local data backups
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-5 md:items-start">
        <div
          role="tablist"
          aria-label="Settings sections"
          aria-orientation="horizontal"
          className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible md:w-44 flex-shrink-0 pb-1 md:pb-0 md:sticky md:top-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map(({ id, label, icon: Icon }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                id={`settings-tab-${id}`}
                aria-selected={selected}
                aria-controls={`settings-panel-${id}`}
                onClick={() => setActiveTab(id)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap flex-shrink-0 md:flex-shrink md:w-full transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50",
                  selected
                    ? "bg-white/10 text-white border border-white/15 shadow-sm"
                    : "text-white/50 border border-transparent hover:text-white/90 hover:bg-white/[0.05]",
                )}
              >
                <Icon size={15} aria-hidden="true" />
                <span>{label}</span>
                {id === "budget" && monthlyBudgetTarget > 0 && (
                  <span
                    className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400"
                    title="Budget target active"
                  />
                )}
                {id === "data" && backupNeeded && (
                  <span
                    className="ml-auto w-2 h-2 rounded-full bg-amber-400"
                    title="Backup recommended"
                  />
                )}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id={`settings-panel-${activeTab}`}
          aria-labelledby={`settings-tab-${activeTab}`}
          className="flex-1 min-w-0"
        >
          {activeTab === "general" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
              <Card padding="sm" className="space-y-3">
                <SectionHeader
                  icon={Globe}
                  tint="blue"
                  title="Localization"
                  description="Base currency and date display format"
                />
                <div className="space-y-3">
                  {/* Read-only currency info tile */}
                  <div className="p-3 rounded-xl bg-blue-500/[0.06] border border-blue-500/20 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center flex-shrink-0">
                      <Coins size={17} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">
                        Base Currency: EGP
                      </p>
                      <p className="text-[11px] text-white/40 leading-snug">
                        All totals are converted to Egyptian Pound. Multi-currency accounts use their exchange rates.
                      </p>
                    </div>
                  </div>
                  <Select
                    label="Date Format"
                    value={settings.dateFormat}
                    onChange={(e) =>
                      updateSettings({
                        dateFormat: e.target.value as
                          "MMM D, YYYY" | "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD",
                      })
                    }
                    options={DATE_FORMATS}
                  />
                </div>
              </Card>

              <Card padding="sm" className="space-y-3">
                <SectionHeader
                  icon={Shield}
                  tint="violet"
                  title="Privacy"
                  description="Blur balances and sensitive figures"
                />
                <div className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="min-w-0">
                    <p
                      id={privacyLabelId}
                      className="text-sm font-medium text-white"
                    >
                      Blur sensitive amounts
                    </p>
                    <p className="text-xs text-white/40 leading-snug">
                      {privacyMode
                        ? "Amounts are hidden."
                        : "Amounts are visible."}{" "}
                      You can also toggle it from the eye icon in the header.
                    </p>
                  </div>
                  <Switch
                    checked={privacyMode}
                    onChange={togglePrivacyMode}
                    labelledBy={privacyLabelId}
                  />
                </div>
              </Card>

              <Card padding="sm" className="space-y-3 lg:col-span-2">
                <SectionHeader
                  icon={CalendarDays}
                  tint="amber"
                  title="Financial Month & Calendar"
                  description="Align budget cycles and Safe-to-Spend with your payday"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Select
                    label="Financial Month Starts On"
                    value={String(monthStartsOnDay)}
                    onChange={(e) =>
                      updateSettings({
                        monthStartsOnDay: parseInt(e.target.value, 10) || 1,
                      })
                    }
                    options={MONTH_START_DAYS}
                  />
                  <Select
                    label="Week Starts On"
                    value={settings.weekStartsOn}
                    onChange={(e) =>
                      updateSettings({
                        weekStartsOn: e.target.value as
                          "sunday" | "monday" | "saturday",
                      })
                    }
                    options={WEEK_START_OPTIONS}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="sm:col-span-1 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold text-white/40">
                      <Sparkles
                        size={12}
                        className="text-blue-400"
                        aria-hidden="true"
                      />
                      Active cycle
                    </span>
                    <span className="block mt-1 font-mono font-bold text-blue-300 text-sm">
                      {currentCycle.cycleLabel}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-white/40">
                      Cycle progress
                    </span>
                    <span className="block mt-1 font-mono font-bold text-white text-sm">
                      Day {currentCycle.currentDayInCycle} of{" "}
                      {currentCycle.totalDays}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="block text-[10px] uppercase tracking-wider font-semibold text-white/40">
                      Next payday
                    </span>
                    <span className="block mt-1 font-mono font-bold text-emerald-400 text-sm">
                      {formatShortDate(currentCycle.nextPaydayDate)}
                      <span className="ml-1.5 text-[11px] font-semibold text-emerald-400/70">
                        {currentCycle.daysUntilPayday === 0
                          ? "today"
                          : `in ${currentCycle.daysUntilPayday} ${currentCycle.daysUntilPayday === 1 ? "day" : "days"}`}
                      </span>
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "budget" && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 animate-fade-in">
              <Card
                padding="sm"
                className="lg:col-span-3 space-y-4 bg-gradient-to-br from-[#121624] via-[#0E121E] to-[#111827] border-blue-500/20"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
                    <Target size={18} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white">
                      Monthly Spending Limit
                    </h3>
                    <p className="text-xs text-white/50 leading-snug mt-0.5">
                      Safe-to-Spend uses this as its baseline. Set it to 0 to
                      use your cycle-to-date income instead.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveBudget}
                  className="space-y-3"
                  noValidate
                >
                  <div>
                    <label
                      htmlFor="monthly-budget-target"
                      className="label-base"
                    >
                      Monthly Spending Ceiling ({currency})
                    </label>
                    <div className="relative">
                      <input
                        id="monthly-budget-target"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        value={budgetTargetInput}
                        onChange={(e) => setBudgetTargetInput(e.target.value)}
                        placeholder="e.g. 25000 (0 = automatic)"
                        aria-invalid={!targetValid}
                        className={cn(
                          "input-base text-lg font-mono font-bold pl-4 pr-16",
                          !targetValid && "border-rose-500/50",
                        )}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-white/40 pointer-events-none">
                        {currency}
                      </span>
                    </div>
                    {!targetValid && (
                      <p role="alert" className="mt-1.5 text-xs text-rose-400">
                        Enter a valid amount (0 or more).
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      type="submit"
                      size="sm"
                      icon={<Check size={15} aria-hidden="true" />}
                      disabled={!targetDirty}
                    >
                      Save Target
                    </Button>
                    {targetDirty && (
                      <span className="text-xs text-amber-300/80">
                        Unsaved changes
                      </span>
                    )}
                  </div>
                </form>
              </Card>

              <Card padding="sm" className="lg:col-span-2 space-y-3">
                <SectionHeader
                  icon={CalendarDays}
                  tint="sky"
                  title="Current Cycle"
                  description={currentCycle.cycleLabel}
                />
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div className="col-span-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <dt className="text-[10px] uppercase tracking-wider font-semibold text-white/40">
                      Daily benchmark
                    </dt>
                    <dd
                      className={cn(
                        "mt-1 font-mono font-bold text-white text-base",
                        privacyMode && "privacy-blur",
                      )}
                    >
                      {benchmarkBase > 0
                        ? `~${formatCurrency(Math.round(dailyBenchmark), currency)} / day`
                        : "Automatic"}
                    </dd>
                    <dd className="text-[11px] text-white/40 mt-0.5">
                      {benchmarkBase > 0
                        ? `Spread over ${currentCycle.totalDays} days`
                        : "Based on cycle income"}
                    </dd>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                    <dt className="text-[10px] uppercase tracking-wider font-semibold text-white/40">
                      Days left
                    </dt>
                    <dd className="mt-1 font-mono font-bold text-white text-sm">
                      {currentCycle.remainingDays}
                    </dd>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <dt className="text-[10px] uppercase tracking-wider font-semibold text-white/40">
                      Next payday
                    </dt>
                    <dd className="mt-1 font-mono font-bold text-emerald-400 text-sm">
                      {formatShortDate(currentCycle.nextPaydayDate)}
                    </dd>
                  </div>
                </dl>
              </Card>
            </div>
          )}

          {activeTab === "data" && (
            <div className="space-y-4 animate-fade-in">
              <Card
                padding="sm"
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                      backupNeeded ? TINTS.amber : TINTS.emerald,
                    )}
                  >
                    {backupNeeded ? (
                      <ShieldAlert size={17} aria-hidden="true" />
                    ) : (
                      <ShieldCheck size={17} aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">
                        Backup health
                      </h3>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          backupNeeded
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                        )}
                      >
                        {backupNeeded ? "Backup recommended" : "Up to date"}
                      </span>
                    </div>
                    <p className="text-xs text-white/40">
                      Last backup:{" "}
                      <span
                        className="font-mono text-white/70"
                        title={
                          lastBackupDate
                            ? new Date(lastBackupDate).toLocaleString()
                            : undefined
                        }
                      >
                        {describeBackupAge(lastBackupDate)}
                      </span>
                    </p>
                  </div>
                </div>

                <dl className="flex items-center gap-4 text-xs sm:flex-shrink-0">
                  {dataStats.map((s) => (
                    <div key={s.label} className="text-left sm:text-right">
                      <dd className="font-mono font-bold text-white text-sm leading-none">
                        {s.value}
                      </dd>
                      <dt className="text-[10px] text-white/40 mt-1">
                        {s.label}
                      </dt>
                    </div>
                  ))}
                </dl>
              </Card>

              <Card padding="sm" className="space-y-3">
                <SectionHeader
                  icon={Database}
                  tint="blue"
                  title="Backup & Restore"
                  description="Backups are JSON files stored on your device"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelected}
                  className="hidden"
                  aria-label="Import backup file"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ActionTile
                    icon={Download}
                    tint="blue"
                    title="Export backup"
                    description="Download all data as JSON"
                    onClick={handleExport}
                  />
                  <ActionTile
                    icon={Upload}
                    tint="sky"
                    title="Import backup"
                    description="Replace data from a JSON file"
                    onClick={() => fileInputRef.current?.click()}
                  />
                </div>
              </Card>

              <Card
                padding="sm"
                className="border-rose-500/25 bg-rose-500/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <SectionHeader
                  icon={Trash2}
                  tint="rose"
                  title="Danger zone"
                  titleClassName="text-rose-400"
                  description="Permanently erase all accounts, transactions and settings on this device"
                />
                <Button
                  variant="danger"
                  size="sm"
                  icon={<Trash2 size={14} aria-hidden="true" />}
                  onClick={() => setShowClearConfirm(true)}
                  className="sm:flex-shrink-0"
                >
                  Clear All Data
                </Button>
              </Card>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
        title="Replace current data?"
        message={
          pendingImport
            ? `This backup contains ${pendingImport.accounts.length} accounts and ${pendingImport.transactions.length} transactions. Importing will overwrite everything currently stored on this device.`
            : ""
        }
        confirmLabel="Import & Replace"
        variant="primary"
      />

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Delete all data?"
        message="This will wipe all data on this browser and cannot be undone. Make sure you downloaded a backup first."
        confirmLabel="Yes, Delete Everything"
      />
    </div>
  );
}
