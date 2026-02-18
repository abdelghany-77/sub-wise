import { Menu } from "lucide-react";
import { DashboardStats } from "../dashboard/DashboardStats";
import { SpendingDonut } from "../charts/SpendingDonut";
import { BalanceTrendChart } from "../charts/BalanceTrendChart";
import { TransactionHistory } from "../transactions/TransactionHistory";
import { AddTransactionModal } from "../transactions/AddTransactionModal";
import { AccountsPanel } from "../accounts/AccountsPanel";
import { DataManager } from "../data/DataManager";
import type { Page } from "./Sidebar";

interface Props {
  page: Page;
  onMobileMenuToggle: () => void;
  onChangePage: (page: Page) => void;
}

const PAGE_TITLES: Record<Page, string> = {
  dashboard: "Dashboard",
  accounts: "Accounts",
  transactions: "Transactions",
  data: "Data & Backup",
};

export function MainContent({ page, onMobileMenuToggle }: Props) {
  return (
    <main className="flex-1 overflow-y-auto min-h-0 pb-16 lg:pb-0">
      {/* Top Bar */}
      <header className="sticky top-0 z-10 bg-[#0d0d14]/80 backdrop-blur-sm border-b border-white/[0.06] px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-base sm:text-lg font-semibold text-white truncate">
            {PAGE_TITLES[page]}
          </h1>
        </div>
        {(page === "dashboard" || page === "transactions") && (
          <div className="flex-shrink-0">
            <AddTransactionModal />
          </div>
        )}
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
            <TransactionHistory />
          </>
        )}

        {page === "accounts" && <AccountsPanel />}

        {page === "transactions" && <TransactionHistory />}

        {page === "data" && <DataManager />}
      </div>
    </main>
  );
}
