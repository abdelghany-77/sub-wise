import { useState, useEffect } from "react";
import { Coins, Eye, EyeOff, Plus, Settings, Search, Command } from "lucide-react";
import { DashboardBentoView } from "../dashboard/DashboardBentoView";
import { AccountsPanel } from "../accounts/AccountsPanel";
import { TransactionHistory } from "../transactions/TransactionHistory";
import { CommitmentsPanel } from "../commitments/CommitmentsPanel";
import { BudgetsPanel } from "../budgets/BudgetsPanel";
import { SavingsGoalsPanel } from "../goals/SavingsGoalsPanel";
import { ReportsPanel } from "../reports/ReportsPanel";
import { SettingsPanel } from "../settings/SettingsPanel";
import { CommandPalette } from "../ui/CommandPalette";
import type { Page } from "./Sidebar";
import { useStore } from "../../store/useStore";

interface Props {
  page: Page;
  onChangePage: (page: Page) => void;
  onOpenQuickAdd: () => void;
}

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Personal CFO Dashboard",
  accounts: "Accounts & Asset Vault",
  transactions: "Transactions Ledger",
  commitments: "Bills & IOUs",
  subscriptions: "Subscriptions & Recurring Bills",
  ious: "IOUs: Lent & Borrowed",
  budgets: "Category Budgets",
  goals: "Savings Goals",
  reports: "Analytics & Reports",
  settings: "Settings & Backup",
  data: "Settings & Backup",
};

export function MainContent({ page, onChangePage, onOpenQuickAdd }: Props) {
  const { privacyMode, togglePrivacyMode, isBackupNeeded } = useStore();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const backupAlert = isBackupNeeded();

  return (
    <main className="flex-1 overflow-y-auto min-h-0 pb-28 md:pb-8">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-[#080B10]/85 backdrop-blur-xl border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Logo — visible when desktop sidebar is hidden */}
          <div className="md:hidden flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Coins size={16} className="text-white" />
            </div>
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white truncate tracking-tight">
              {PAGE_TITLES[page] || "Walleteer"}
            </h1>
          </div>
        </div>

        {/* Center/Right Toolbar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Global Search / Command Bar Trigger */}
          <button
            onClick={() => setIsCommandOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-white/50 hover:text-white transition-all text-xs"
            aria-label="Open command palette"
          >
            <Search size={14} className="text-white/40" />
            <span className="hidden md:inline text-white/50">Search or command...</span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white/60">
              <Command size={10} />K
            </kbd>
          </button>

          {/* Quick-Add Button (Desktop top bar) */}
          <button
            onClick={onOpenQuickAdd}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-600/30 transition-all border border-blue-400/30 active:scale-95"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span>Add Transaction</span>
          </button>

          {/* Mobile quick access to Settings & Backup */}
          <div className="md:hidden flex items-center gap-1">
            <button
              onClick={() => onChangePage("settings")}
              aria-label="Settings & Backup"
              className={`p-2 rounded-xl transition-all duration-200 relative ${
                page === "settings" || page === "data"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/40 hover:text-white hover:bg-white/10"
              }`}
            >
              <Settings size={18} />
              {backupAlert && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0B0F17]" />
              )}
            </button>
          </div>

          {/* Privacy Toggle */}
          <button
            onClick={togglePrivacyMode}
            aria-label={privacyMode ? "Show balances" : "Hide balances"}
            aria-pressed={privacyMode ? "true" : "false"}
            title={privacyMode ? "Privacy Mode Active (Balances Blurred)" : "Toggle Privacy Mode"}
            className={`p-2 rounded-xl transition-all duration-200 ${
              privacyMode
                ? "bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30"
                : "text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </header>

      {/* Main Page Content - Standardized Breathing Room */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-28 md:pb-10 animate-fade-in">
        {page === "dashboard" && <DashboardBentoView onNavigate={onChangePage} />}
        {page === "accounts" && <AccountsPanel />}
        {page === "transactions" && <TransactionHistory />}
        {page === "commitments" && <CommitmentsPanel />}
        {page === "subscriptions" && <CommitmentsPanel initialTab="subscriptions" />}
        {page === "ious" && <CommitmentsPanel initialTab="ious" />}
        {page === "budgets" && <BudgetsPanel />}
        {page === "goals" && <SavingsGoalsPanel />}
        {page === "reports" && <ReportsPanel />}
        {(page === "settings" || page === "data") && <SettingsPanel />}
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={onChangePage}
        onOpenAddModal={onOpenQuickAdd}
      />
    </main>
  );
}
