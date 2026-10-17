import { useState, useRef } from "react";
import {
  Globe,
  Calendar,
  Shield,
  Info,
  Download,
  Upload,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Target,
  Sliders,
  Database,
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Card } from "../ui/Card";
import { Select } from "../ui/FormFields";
import { Button } from "../ui/Button";
import { formatCurrency, cn } from "../../lib/utils";
import type { Account, Transaction, Budget, SavingsGoal, RecurringBill, Iou } from "../../types";

const CURRENCIES = [
  { value: "EGP", label: "EGP — Egyptian Pound" },
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "SAR", label: "SAR — Saudi Riyal" },
  { value: "AED", label: "AED — UAE Dirham" },
];

const DATE_FORMATS = [
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY (US)" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY (UK/EU)" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO)" },
];

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
    importData,
    clearAll,
    lastBackupDate,
    isBackupNeeded,
    recordBackup,
  } = useStore();

  const [activeTab, setActiveTab] = useState<"general" | "budget" | "data">("general");

  // Budget target state
  const [budgetTargetInput, setBudgetTargetInput] = useState(
    monthlyBudgetTarget > 0 ? String(monthlyBudgetTarget) : "",
  );
  const [targetSaved, setTargetSaved] = useState(false);

  // Backup & Restore
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");
  const [importMsg, setImportMsg] = useState("");
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetTargetInput);
    if (!isNaN(val) && val >= 0) {
      setMonthlyBudgetTarget(val);
      setTargetSaved(true);
      setTimeout(() => setTargetSaved(false), 3000);
    }
  };

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      version: "2.0",
      accounts,
      transactions,
      budgets,
      savingsGoals,
      recurring,
      ious,
      monthlyBudgetTarget,
      lastBackupDate: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `walleteer-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    recordBackup();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw) as {
          accounts: Account[];
          transactions: Transaction[];
          budgets?: Budget[];
          savingsGoals?: SavingsGoal[];
          recurring?: RecurringBill[];
          ious?: Iou[];
          monthlyBudgetTarget?: number;
        };
        if (!Array.isArray(data.accounts) || !Array.isArray(data.transactions)) {
          throw new Error("Invalid file format");
        }
        importData({
          accounts: data.accounts,
          transactions: data.transactions,
          budgets: data.budgets,
          savingsGoals: data.savingsGoals,
          recurring: data.recurring,
          ious: data.ious,
          monthlyBudgetTarget: data.monthlyBudgetTarget,
        });
        setImportStatus("success");
        setImportMsg(
          `Successfully restored ${data.accounts.length} accounts, ${data.transactions.length} transactions, and ${data.recurring?.length ?? 0} recurring commitments.`,
        );
      } catch {
        setImportStatus("error");
        setImportMsg("Failed to import. Make sure this is a valid Walleteer JSON backup file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setImportStatus("idle"), 5000);
    };
    reader.readAsText(file);
  };

  const backupNeeded = isBackupNeeded();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Settings & Backup
        </h2>
        <p className="text-xs sm:text-sm text-white/50 mt-1">
          Manage your monthly budget targets, personal preferences, and encrypted local data backups.
        </p>
      </div>

      {/* Segmented Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveTab("general")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all",
            activeTab === "general"
              ? "bg-white/10 text-white border border-white/15 shadow-sm"
              : "text-white/45 hover:text-white/80",
          )}
        >
          <Sliders size={15} />
          <span>General & Privacy</span>
        </button>

        <button
          onClick={() => setActiveTab("budget")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all",
            activeTab === "budget"
              ? "bg-white/10 text-white border border-white/15 shadow-sm"
              : "text-white/45 hover:text-white/80",
          )}
        >
          <Target size={15} />
          <span>Monthly Budget Target</span>
          {monthlyBudgetTarget > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/20 text-blue-300 font-mono">
              Active
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("data")}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative",
            activeTab === "data"
              ? "bg-white/10 text-white border border-white/15 shadow-sm"
              : "text-white/45 hover:text-white/80",
          )}
        >
          <Database size={15} />
          <span>Data & Backup</span>
          {backupNeeded && (
            <span className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0B0F17]" />
          )}
        </button>
      </div>

      {/* TAB 1: GENERAL & PRIVACY */}
      {activeTab === "general" && (
        <div className="space-y-5 animate-fade-in">
          {/* Currency & Formats */}
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400">
                <Globe size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Localization & Currency</h3>
                <p className="text-xs text-white/40">Select your default baseline currency and formatting</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Select
                label="Base Currency"
                value={settings.defaultCurrency}
                onChange={(e) => updateSettings({ defaultCurrency: e.target.value })}
                options={CURRENCIES}
              />
              <Select
                label="Date Format"
                value={settings.dateFormat}
                onChange={(e) =>
                  updateSettings({
                    dateFormat: e.target.value as "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD",
                  })
                }
                options={DATE_FORMATS}
              />
            </div>
          </Card>

          {/* Privacy Switch */}
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center text-violet-400">
                <Shield size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Privacy Mode</h3>
                <p className="text-xs text-white/40">Conceal all numbers and sensitive balance figures with a subtle blur</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 py-2 pt-1 border-t border-white/[0.04]">
              <div>
                <p className="text-sm font-medium text-white">Blur Sensitive Amounts</p>
                <p className="text-xs text-white/40">You can also toggle this at any time using the Eye icon in the top header</p>
              </div>
              <button
                onClick={togglePrivacyMode}
                role="switch"
                aria-checked={privacyMode ? "true" : "false"}
                aria-label="Toggle privacy mode"
                className={`relative w-12 h-7 rounded-full transition-all duration-200 flex-shrink-0 ${
                  privacyMode ? "bg-blue-600" : "bg-white/10"
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform duration-200 shadow-md ${
                    privacyMode ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          </Card>

          {/* Calendar settings */}
          <Card className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                <Calendar size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Calendar Behavior</h3>
                <p className="text-xs text-white/40">Adjust starting day of week for analytics</p>
              </div>
            </div>

            <Select
              label="Week Starts On"
              value={settings.weekStartsOn}
              onChange={(e) =>
                updateSettings({
                  weekStartsOn: e.target.value as "sunday" | "monday" | "saturday",
                })
              }
              options={[
                { value: "saturday", label: "Saturday (Middle East / Egypt)" },
                { value: "sunday", label: "Sunday" },
                { value: "monday", label: "Monday (Standard)" },
              ]}
            />
          </Card>

          {/* About App */}
          <Card className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                <Info size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-white">Walleteer CFO Engine</h3>
                <p className="text-xs text-white/40">Architecture & device storage status</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 text-xs">
              <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                <span className="text-white/40 block">Version</span>
                <span className="font-mono font-bold text-white">v0.3.0</span>
              </div>
              <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                <span className="text-white/40 block">Storage</span>
                <span className="font-medium text-emerald-400">Offline Local-First</span>
              </div>
              <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                <span className="text-white/40 block">PWA Support</span>
                <span className="font-medium text-blue-400">Standalone App</span>
              </div>
            </div>
            <p className="text-xs text-white/30 pt-2 border-t border-white/[0.04]">
              All data is stored directly in your browser's private indexed storage. No servers, no tracking, zero telemetry.
            </p>
          </Card>
        </div>
      )}

      {/* TAB 2: MONTHLY BUDGET TARGET & CFO ENGINE */}
      {activeTab === "budget" && (
        <div className="space-y-5 animate-fade-in">
          <Card className="p-6 relative overflow-hidden bg-gradient-to-br from-[#121624] via-[#0E121E] to-transparent border-blue-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
                <Target size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white">Monthly Target Spending Limit</h3>
                <p className="text-xs text-white/50 mt-1">
                  The Safe-to-Spend engine calculates your daily allowance using this baseline. If set to 0, Walleteer automatically uses your real Month-to-Date income as the base.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveBudget} className="mt-6 space-y-4">
              <div>
                <label className="label-base">Monthly Spending Ceiling (EGP)</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={budgetTargetInput}
                    onChange={(e) => setBudgetTargetInput(e.target.value)}
                    placeholder="e.g. 25000 (0 for automatic income base)"
                    className="input-base text-lg font-mono font-bold pl-4 pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-white/40">
                    EGP
                  </span>
                </div>
              </div>

              {monthlyBudgetTarget > 0 && (
                <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs flex items-center justify-between">
                  <span className="text-blue-300">Target Daily Benchmark:</span>
                  <span className="font-mono font-bold text-white">
                    ~{formatCurrency(Math.round(monthlyBudgetTarget / 30), "EGP")} / day
                  </span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">
                  Save Budget Target
                </Button>
                {targetSaved && (
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1 animate-fade-in">
                    <ShieldCheck size={14} />
                    Target updated successfully!
                  </span>
                )}
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 3: DATA & BACKUP */}
      {activeTab === "data" && (
        <div className="space-y-5 animate-fade-in">
          {/* Status Message */}
          {importStatus !== "idle" && (
            <div
              className={`flex items-start gap-3 p-4 rounded-xl border text-sm animate-slide-up ${
                importStatus === "success"
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              }`}
            >
              {importStatus === "success" ? (
                <ShieldCheck size={18} className="flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
              )}
              {importMsg}
            </div>
          )}

          {/* Backup Health Bar */}
          <Card className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm">Backup Health Status</h3>
                {backupNeeded ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Backup Recommended
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Up to Date
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 mt-1">
                Last recorded backup:{" "}
                <span className="font-mono text-white/70">
                  {lastBackupDate ? new Date(lastBackupDate).toLocaleDateString() : "Never"}
                </span>
              </p>
            </div>

            <Button
              icon={<Download size={15} />}
              onClick={handleExport}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs self-start sm:self-auto shadow-md shadow-blue-600/20"
            >
              Download Backup JSON
            </Button>
          </Card>

          {/* Restore */}
          <Card className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 flex items-center justify-center text-sky-400 flex-shrink-0">
                <Upload size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">Restore from Backup</h3>
                <p className="text-xs text-white/50 mt-1">
                  Upload a previously saved Walleteer backup file. This will restore all accounts, transaction ledgers, recurring bills, and preferences.
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
              aria-label="Import backup file"
            />
            <Button
              variant="ghost"
              icon={<Upload size={15} />}
              onClick={() => fileInputRef.current?.click()}
              className="w-full sm:w-auto text-xs"
            >
              Choose Backup File to Restore
            </Button>
          </Card>

          {/* Danger Zone */}
          <Card className="border-rose-500/20 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400 flex-shrink-0">
                <Trash2 size={18} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-rose-400">Danger Zone: Reset App</h3>
                <p className="text-xs text-white/50 mt-1">
                  Permanently clear all accounts, transactions, subscriptions, and settings from local device storage.
                </p>
              </div>
            </div>

            {showClearConfirm ? (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 space-y-3">
                <p className="text-xs text-rose-300 font-medium">
                  Are you absolutely certain? This will wipe all data on this browser. Make sure you downloaded a backup first!
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => {
                      clearAll();
                      setShowClearConfirm(false);
                    }}
                  >
                    Yes, Delete Everything
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={() => setShowClearConfirm(true)}
                className="text-xs"
              >
                Clear All Data
              </Button>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
