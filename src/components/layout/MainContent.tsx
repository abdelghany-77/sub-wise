import { Coins, Eye, EyeOff, Plus, Settings, Database } from "lucide-react";
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
import type { Page } from "./Sidebar";
import { useStore } from "../../store/useStore";
import { useState } from "react";

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
  const [showFAB, setShowFAB] = useState(false);

  const showAddButton = page === "dashboard" || page === "transactions";

  return (
    <main className="flex-1 overflow-y-auto min-h-0 pb-20 lg:pb-0">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-[#0d0d14]/80 backdrop-blur-sm border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile Logo — shown only on small screens where sidebar is hidden */}
          <div className="lg:hidden flex items-center gap-2 flex-shrink-0">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center shadow-glow">
              <Coins size={14} className="text-white" />
            </div>
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-white truncate">
            {PAGE_TITLES[page]}
          </h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Mobile quick access to Settings & Data (not in bottom nav) */}
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
          {showAddButton && (
            <span className="hidden sm:inline-flex">
              <AddTransactionModal />
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 animate-fade-in">
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

      {/* Mobile FAB for quick add */}
      {showAddButton && !showFAB && (
        <div className="fixed bottom-20 right-4 z-20 sm:hidden">
          <button
            onClick={() => setShowFAB(true)}
            className="w-14 h-14 rounded-2xl bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-900/40 flex items-center justify-center transition-all duration-200 active:scale-95"
            aria-label="Add new transaction"
          >
            <Plus size={24} />
          </button>
        </div>
      )}
      {showFAB && (
        <AddTransactionModal
          autoOpen
          onClose={() => setShowFAB(false)}
        />
      )}
    </main>
  );
}
