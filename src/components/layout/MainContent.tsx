import { useState, useEffect } from "react";
import { Coins, Eye, EyeOff, Plus, Settings, Database, Search, Command } from "lucide-react";
import { DashboardStats } from "../dashboard/DashboardStats";
import { SpendingDonut } from "../charts/SpendingDonut";
import { BalanceTrendChart } from "../charts/BalanceTrendChart";
import { IncomeExpenseChart } from "../charts/IncomeExpenseChart";
import { TransactionHistory } from "../transactions/TransactionHistory";
import { AddTransactionModal } from "../transactions/AddTransactionModal";
import { AccountsPanel } from "../accounts/AccountsPanel";
import { BudgetsPanel } from "../budgets/BudgetsPanel";
import { SavingsGoalsPanel } from "../goals/SavingsGoalsPanel";
import { ReportsPanel } from "../reports/ReportsPanel";
import { SettingsPanel } from "../settings/SettingsPanel";
import { DataManager } from "../data/DataManager";
import { CommandPalette } from "../ui/CommandPalette";
import type { Page } from "./Sidebar";
import { useStore } from "../../store/useStore";

interface Props {
  page: Page;
  onChangePage: (page: Page) => void;
}

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard",
  accounts: "Accounts",
  transactions: "Transactions",
  budgets: "Budgets",
  goals: "Savings Goals",
  reports: "Reports",
  settings: "Settings",
  data: "Data & Backup",
};

export function MainContent({ page, onChangePage }: Props) {
  const { privacyMode, togglePrivacyMode } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
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

  const showAddButton = page === "dashboard" || page === "transactions";

  return (
    <main className="flex-1 overflow-y-auto min-h-0 pb-28 sm:pb-12">
      {/* Top Bar */}
      <header className="sticky top-0 z-20 bg-[#080B10]/85 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Logo — shown only on small screens where sidebar is hidden */}
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-glow">
              <Coins size={14} className="text-white" />
            </div>
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-white truncate">
            {PAGE_TITLES[page]}
          </h1>
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

          {/* Mobile quick access to Settings & Data */}
          <div className="lg:hidden flex items-center gap-1">
            <button
              onClick={() => onChangePage("settings")}
              aria-label="Settings"
              className={`p-2 rounded-xl transition-all duration-200 ${
                page === "settings"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/40 hover:text-white hover:bg-white/10"
              }`}
            >
              <Settings size={18} />
            </button>
            <button
              onClick={() => onChangePage("data")}
              aria-label="Data & Backup"
              className={`p-2 rounded-xl transition-all duration-200 ${
                page === "data"
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-white/40 hover:text-white hover:bg-white/10"
              }`}
            >
              <Database size={16} />
            </button>
          </div>

          {/* Privacy Toggle */}
          <button
            onClick={togglePrivacyMode}
            aria-label={privacyMode ? "Show balances" : "Hide balances"}
            aria-pressed={privacyMode ? "true" : "false"}
            className={`p-2 rounded-xl transition-all duration-200 ${
              privacyMode
                ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                : "text-white/40 hover:text-white hover:bg-white/10"
            }`}
          >
            {privacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>

          {/* Desktop Add Transaction Button (hidden on mobile, embedded in header) */}
          {showAddButton && (
            <span className="hidden sm:inline-flex">
              <AddTransactionModal />
            </span>
          )}
        </div>
      </header>

      {/* Main Page Content */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in max-w-7xl mx-auto">
        {page === "dashboard" && (
          <>
            <DashboardStats />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
              <SpendingDonut />
              <BalanceTrendChart />
            </div>
            <IncomeExpenseChart />
            <TransactionHistory />
          </>
        )}

        {page === "accounts" && <AccountsPanel />}
        {page === "transactions" && <TransactionHistory />}
        {page === "budgets" && <BudgetsPanel />}
        {page === "goals" && <SavingsGoalsPanel />}
        {page === "reports" && <ReportsPanel />}
        {page === "settings" && <SettingsPanel />}
        {page === "data" && <DataManager />}
      </div>

      {/* Mobile-only Floating Action Button (constrained strictly to mobile screens, hidden on desktop) */}
      {showAddButton && !showAddModal && (
        <div className="fixed bottom-20 right-6 z-40 sm:hidden">
          <button
            onClick={() => setShowAddModal(true)}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white shadow-xl shadow-blue-900/50 flex items-center justify-center transition-all duration-200 active:scale-95 border border-blue-400/30"
            aria-label="Add new transaction"
          >
            <Plus size={24} />
          </button>
        </div>
      )}

      {/* Mobile Add Transaction Modal Trigger */}
      {showAddModal && (
        <AddTransactionModal
          autoOpen
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onNavigate={onChangePage}
        onOpenAddModal={() => setShowAddModal(true)}
      />
    </main>
  );
}
